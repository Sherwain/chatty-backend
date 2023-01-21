import { CommentsModel } from "@comment/model/comment-schema";
import { ObjectId } from "mongodb";
import { config } from "@root/config";
import { ServerError } from "@global/helpers/error-handler";
import {
  ICommentDocument,
  ICommentDocumentResponse,
  IQueryComment,
} from "@comment/interfaces/comment-interface";
import { PostModel } from "@post/models/post-schema";

const log = config.LOG.getInstance("database");

class CommentService {
  public async saveCommentToDB(commentDoc: ICommentDocument): Promise<void> {
    try {
      // increment count of current
      CommentsModel.create(commentDoc);
      PostModel.updateOne(
        {
          postId: commentDoc.postId,
        },
        {
          $inc: { ["commentsCount"]: +1 },
        }
      ).exec();

      //send comment notification
    } catch (error) {
      log.error(error);
      throw new ServerError("Redis Server error");
    }
  }

  public updateCommentInDB(commentId: ObjectId, comment: string) {
    CommentsModel.updateOne(
      {
        _id: commentId,
      },
      {
        comment: comment,
      }
    ).exec();
  }

  public async deleteCommentFromDB(commentDoc: ICommentDocument) {
    // remove count from current
    try {
      this.removePostCommentFromDB(commentDoc._id!.toString());
      await this.incrementPostCommentFromDB(commentDoc.postId, -1);
      log.info("Successfully deleted from database");
    } catch (error) {
      log.error(error);
      throw new ServerError("Redis Server error");
    }
  }

  public removePostCommentFromDB(_id: string): void {
    try {
      CommentsModel.findOneAndDelete({
        _id: new ObjectId(_id),
      }).exec();
    } catch (error) {
      log.error(error);
      throw new ServerError("Server error");
    }
  }

  public async getCommentsFromDB(
    query: IQueryComment,
    sort: Record<string, 1 | -1>
  ): Promise<ICommentDocumentResponse[]> {
    const comments: ICommentDocumentResponse[] = await CommentsModel.aggregate([
      { $match: query },
      { $sort: sort },
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
          localField: "postCommenter",
          foreignField: "userId",
          as: "aCommenter",
        },
      },
      { $unwind: "$aCommenter" },
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
          localField: "postCommenter",
          foreignField: "_id",
          as: "uCommenter",
        },
      },
      { $unwind: "$uCommenter" },
      { $project: this.aggregateProject() },
    ]);
    log.info("Successfully fetched data from database");
    return comments;
  }

  private aggregateProject() {
    return {
      _id: 1,
      comment: 1,
      postId: 1,
      createdAt: 1,
      postCreator: {
        _id: "$uCreator._id",
        profilePicture: "$uCreator.profilePicture",
        username: "$aCreator.username",
        avatarColor: "$aCreator.avatarColor",
      },
      postCommenter: {
        _id: "$uCommenter._id",
        profilePicture: "$uCommenter.profilePicture",
        username: "$aCommenter.username",
        avatarColor: "$aCommenter.avatarColor",
      },
    };
  }

  private async incrementPostCommentFromDB(
    postId: string,
    amount: number
  ): Promise<void> {
    PostModel.updateOne(
      {
        postId: postId,
      },
      {
        $inc: { ["commentsCount"]: amount },
      }
    ).exec();
  }
}
export const commentService: CommentService = new CommentService();
