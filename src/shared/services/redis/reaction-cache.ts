import { RedisCommandRawReply } from "@redis/client/dist/lib/commands";
import { Helpers } from "@global/helpers/helper";
import { ServerError } from "@global/helpers/error-handler";
import {
  IReactionDocument,
  IReactionDocumentResponse,
  IReactions,
  iReactionsKeys,
  UserDetails,
} from "@reaction/interfaces/reaction-interface";
import { config } from "@root/config";
import { BaseCache } from "@service/redis/base-cache";
import { IUserDocument } from "@user/interfaces/user-interface";

const log = config.LOG.getInstance("ReactionCache");

export type ReactionCacheMultiType =
  | string
  | number
  | Buffer
  | RedisCommandRawReply[]
  | IReactionDocument
  | IReactionDocument[]
  | IReactionDocumentResponse
  | IReactionDocumentResponse[];

export class ReactionCache extends BaseCache {
  constructor() {
    super("reaction");
  }

  public async savePostReactionToCache(
    reactionDoc: IReactionDocument
  ): Promise<void> {
    try {
      if (!this.client.isOpen) {
        this.client.connect();
      }
      const dataToSave = [
        "_id",
        `${reactionDoc._id}`,
        "reaction",
        `${reactionDoc.reaction}`,
        "postId",
        `${reactionDoc.postId}`,
        "postCreator",
        `${reactionDoc.postCreator}`,
        "postReactor",
        `${reactionDoc.postReactor}`,
        "createdAt",
        `${reactionDoc.createdAt}`,
      ];
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
        await this.incrementPostReactionFromCache(
          reactionDoc.postId,
          existingReactionType,
          -1
        );
        await this.incrementPostReactionFromCache(
          reactionDoc.postId,
          reactionDoc.reaction,
          1
        );
        this.client.HSET(
          `reaction:${reactionDoc.postId}:${reactionDoc.postReactor}`,
          dataToSave
        );
      } else if (
        existingReactionType &&
        reactionDoc.reaction &&
        existingReactionType === reactionDoc.reaction
      ) {
        // remove count from current
        await this.removePostReactionFromCache(
          reactionDoc.postId,
          `${reactionDoc.postReactor}`
        );
        await this.incrementPostReactionFromCache(
          reactionDoc.postId,
          reactionDoc.reaction,
          -1
        );
      } else if (reactionDoc.reaction && !existingReactionType) {
        // increment count of current
        await this.incrementPostReactionFromCache(
          reactionDoc.postId,
          reactionDoc.reaction,
          1
        );
        const transaction = this.client.multi();
        transaction
          .LPUSH(
            `reactions:${reactionDoc.postId}`,
            `${reactionDoc.postReactor}`
          )
          .LPUSH(
            `user-reactions:${reactionDoc.postReactor}`,
            `${reactionDoc.postId}`
          )
          .HSET(
            `reaction:${reactionDoc.postId}:${reactionDoc.postReactor}`,
            dataToSave
          )
          .exec();
      }
    } catch (error) {
      log.error(error);
      throw new ServerError("Redis Server error");
    }
  }

  public async removePostReactionFromCache(
    postId: string,
    postReactor: string
  ): Promise<void> {
    try {
      if (!this.client.isOpen) this.client.connect();

      const transaction = this.client.multi();
      await transaction
        .LREM(`reactions:${postId}`, 1, `${postReactor}`)
        .LREM(`user-reactions:${postReactor}`, 1, `${postId}`)
        .DEL(`reaction:${postId}:${postReactor}`)
        .exec();
    } catch (error) {
      log.error(error);
      throw new ServerError("Server error");
    }
  }

  public async deleteReactionFromCache(reactionDoc: IReactionDocument) {
    // remove count from current
    try {
      // remove count from current
      await this.removePostReactionFromCache(
        reactionDoc.postId,
        `${reactionDoc.postReactor}`
      );
      await this.incrementPostReactionFromCache(
        reactionDoc.postId,
        reactionDoc.reaction,
        -1
      );
      log.info("Successfully deleted from cache");
    } catch (error) {
      log.error(error);
      throw new ServerError("Redis Server error");
    }
  }

  public async getReactionsByUserIdFromCache(
    userId: string,
    start: number = 0,
    end: number = -1
  ): Promise<IReactionDocumentResponse[]> {
    try {
      if (!this.client.isOpen) this.client.connect();
      const transaction = this.client.multi();
      const reactionItems = await this.client.LRANGE(
        `user-reactions:${userId}`,
        start,
        end
      );
      for (const postId of reactionItems) {
        transaction.HGETALL(`reaction:${postId}:${userId}`);
      }
      const reactions: ReactionCacheMultiType =
        (await transaction.exec()) as ReactionCacheMultiType;

      const reactionReplies: IReactionDocumentResponse[] = [];
      for (const reaction of reactions as IReactionDocument[]) {
        reactionReplies.push(await this.getReactionSubData(reaction));
      }
      log.info("Fetching data from Redis cache");
      return reactionReplies;
    } catch (error) {
      log.error(error);
      throw new ServerError("Server error");
    }
  }

  public async getReactionFromCache(
    postId: string,
    postReactor: string
  ): Promise<IReactionDocumentResponse[]> {
    try {
      if (!this.client.isOpen) this.client.connect();
      const reaction = (await this.client.HGETALL(
        `reaction:${postId}:${postReactor}`
      )) as unknown as IReactionDocument;

      const reactionReply: IReactionDocumentResponse =
        await this.getReactionSubData(reaction);

      log.info("Fetching data from Redis cache");
      return [reactionReply];
    } catch (error) {
      log.error(error);
      throw new ServerError("Server error");
    }
  }

  public async getReactionsFromCache(
    postId: string,
    start: number = 0,
    end: number = -1
  ): Promise<IReactionDocumentResponse[]> {
    try {
      if (!this.client.isOpen) this.client.connect();
      const transaction = this.client.multi();
      const reactionItems = await this.client.LRANGE(
        `reactions:${postId}`,
        start,
        end
      );
      for (const item of reactionItems) {
        transaction.HGETALL(`reaction:${postId}:${item}`);
      }
      const reactions: ReactionCacheMultiType =
        (await transaction.exec()) as ReactionCacheMultiType;

      const reactionReplies: IReactionDocumentResponse[] = [];
      for (const reaction of reactions as IReactionDocument[]) {
        reactionReplies.push(await this.getReactionSubData(reaction));
      }
      log.info("Fetching data from Redis cache");
      return reactionReplies;
    } catch (error) {
      log.error(error);
      throw new ServerError("Server error");
    }
  }

  private async getReactionSubData(
    reaction: IReactionDocument
  ): Promise<IReactionDocumentResponse> {
    if (!this.client.isOpen) this.client.connect();

    const creator: IUserDocument = (await this.client.HGETALL(
      `user:${reaction.postCreator}`
    )) as unknown as IUserDocument;

    const reactor: IUserDocument = (await this.client.HGETALL(
      `user:${reaction.postReactor}`
    )) as unknown as IUserDocument;

    const postCreator = {
      _id: creator._id,
      profilePicture: creator.profilePicture,
      username: creator.username,
      avatarColor: creator.avatarColor,
    } as UserDetails;

    const postReactor = {
      _id: reactor._id,
      profilePicture: reactor.profilePicture,
      username: reactor.username,
      avatarColor: reactor.avatarColor,
    } as UserDetails;

    const reactionResponse: IReactionDocumentResponse = {
      _id: `${reaction._id}`,
      reaction: reaction.reaction,
      postId: reaction.postId,
      createdAt: reaction.createdAt,
      postCreator,
      postReactor,
    } as IReactionDocumentResponse;

    return reactionResponse;
  }

  private getPreviousReaction(
    listReactions: string[],
    postReactor: string
  ): IReactionDocument | undefined {
    return listReactions.find((item) => {
      const value = Helpers.parseJSON(item) as IReactionDocument;
      return value.postReactor == postReactor;
    }) as unknown as IReactionDocument;
  }

  private async getPostReactionsData(postId: string): Promise<IReactions> {
    if (!this.client.isOpen) this.client.connect();
    const response = await this.client.HGET(`post:${postId}`, "reactions");
    return JSON.parse(response!) as IReactions;
  }

  private async getReactionData(
    postId: string,
    postReactor: string
  ): Promise<IReactionDocument> {
    if (!this.client.isOpen) this.client.connect();
    const response = await this.client.HGETALL(
      `reaction:${postId}:${postReactor}`
    );
    return response as unknown as IReactionDocument;
  }

  private async incrementPostReactionFromCache(
    postId: string,
    reaction: string,
    amount: number
  ): Promise<void> {
    const postReactions = (await this.getPostReactionsData(
      postId
    )) as IReactions;

    const index: number = iReactionsKeys.findIndex((item) => item === reaction);

    postReactions[iReactionsKeys[index]] =
      postReactions[iReactionsKeys[index]] + amount < 0
        ? 0
        : postReactions[iReactionsKeys[index]] + amount;
    if (!this.client.isOpen) this.client.connect();
    await this.client.HSET(
      `post:${postId}`,
      "reactions",
      JSON.stringify(postReactions)
    );
  }
}
