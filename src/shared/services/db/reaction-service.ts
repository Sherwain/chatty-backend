import { IQueryReaction } from "./../../../features/reaction/interfaces/reaction-interface";
import { PostModel } from "@post/models/post-schema";
import { ObjectId } from "mongodb";
import {
  IReactionDocument,
  IReactionDocumentResponse,
  iReactionsKeys,
} from "@reaction/interfaces/reaction-interface";
import { ReactionModel } from "@reaction/models/reaction-schema";
import { config } from "@root/config";
import { IPostDocument } from "@post/interfaces/post-interface";
import { ServerError } from "@global/helpers/error-handler";

const log = config.LOG.getInstance("database");

class ReactionService {
  public async saveReactionToDB(reactionDoc: IReactionDocument): Promise<void> {
    try {
      const existingReaction = await this.getReactionData(
        reactionDoc.postId,
        `${reactionDoc.postReactor}`
      );

      const existingReactionType = existingReaction?.reaction;
      if (
        existingReactionType &&
        reactionDoc.reaction &&
        existingReactionType != reactionDoc.reaction
      ) {
        //decrement count of existing reaction and increment count of current one
        await this.incrementPostReactionFromDB(
          reactionDoc.postId,
          existingReactionType,
          -1
        );
        await this.incrementPostReactionFromDB(
          reactionDoc.postId,
          reactionDoc.reaction,
          1
        );
        existingReaction.reaction = reactionDoc.reaction;
        existingReaction.save();
      } else if (
        existingReactionType &&
        reactionDoc.reaction &&
        existingReactionType === reactionDoc.reaction
      ) {
        // remove count from current
        await this.deleteReactionFromDB(reactionDoc);
      } else if (reactionDoc.reaction && !existingReactionType) {
        // increment count of current
        await this.incrementPostReactionFromDB(
          reactionDoc.postId,
          reactionDoc.reaction,
          1
        );
        ReactionModel.create(reactionDoc);
      }
      //send reaction notification
    } catch (error) {
      log.error(error);
      throw new ServerError("Redis Server error");
    }
  }

  public async deleteReactionFromDB(reactionDoc: IReactionDocument) {
    // remove count from current
    try {
      this.removePostReactionFromDB(
        reactionDoc.postId,
        `${reactionDoc.postReactor}`
      );
      await this.incrementPostReactionFromDB(
        reactionDoc.postId,
        reactionDoc.reaction,
        -1
      );
      log.info("Successfully deleted from database");
    } catch (error) {
      log.error(error);
      throw new ServerError("Redis Server error");
    }
  }

  public removePostReactionFromDB(postId: string, postReactor: string): void {
    try {
      ReactionModel.findOneAndDelete({
        postId: new ObjectId(postId),
        postReactor: new ObjectId(postReactor),
      }).exec();
    } catch (error) {
      log.error(error);
      throw new ServerError("Server error");
    }
  }

  public async getReactionsFromDB(
    query: IQueryReaction
  ): Promise<IReactionDocumentResponse[]> {
    const reactions: IReactionDocumentResponse[] =
      await ReactionModel.aggregate([
        { $match: query },
        {
          $lookup: {
            from: "auth",
            localField: "postCreator",
            foreignField: "userId",
            as: "aCreator",
          },
        },
        { $unwind: "$aCreator" },
        {
          $lookup: {
            from: "auth",
            localField: "postReactor",
            foreignField: "userId",
            as: "aReactor",
          },
        },
        { $unwind: "$aReactor" },
        {
          $lookup: {
            from: "user",
            localField: "postCreator",
            foreignField: "_id",
            as: "uCreator",
          },
        },
        { $unwind: "$uCreator" },
        {
          $lookup: {
            from: "user",
            localField: "postReactor",
            foreignField: "_id",
            as: "uReactor",
          },
        },
        { $unwind: "$uReactor" },
        { $project: this.aggregateProject() },
      ]);
    return reactions;
  }

  private aggregateProject() {
    return {
      _id: 1,
      reaction: 1,
      postId: 1,
      createdAt: 1,
      postCreator: {
        _id: "$uCreator._id",
        profilePicture: "$uCreator.profilePicture",
        username: "$aCreator.username",
        avatarColor: "$aCreator.avatarColor",
      },
      postReactor: {
        _id: "$uReactor._id",
        profilePicture: "$uReactor.profilePicture",
        username: "$aReactor.username",
        avatarColor: "$aReactor.avatarColor",
      },
    };
  }

  private async getReactionData(
    postId: string,
    postReactor: string
  ): Promise<IReactionDocument> {
    const response = await ReactionModel.findOne({
      postId: new ObjectId(postId),
      postReactor: new ObjectId(postReactor),
    });
    return response as IReactionDocument;
  }

  private async getPostReactionsData(postId: string): Promise<IPostDocument> {
    const response = await PostModel.findById(postId);
    return response!;
  }

  private async incrementPostReactionFromDB(
    postId: string,
    reaction: string,
    amount: number
  ): Promise<void> {
    const postReactions = await this.getPostReactionsData(postId);

    const index: number = iReactionsKeys.findIndex((item) => item === reaction);

    postReactions.reactions!;

    postReactions.reactions![iReactionsKeys[index]] =
      postReactions.reactions![iReactionsKeys[index]] + amount < 0
        ? 0
        : postReactions.reactions![iReactionsKeys[index]] + amount;

    await postReactions.save();
  }
}
export const reactionService: ReactionService = new ReactionService();
