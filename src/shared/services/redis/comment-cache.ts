import { RedisCommandRawReply } from "@redis/client/dist/lib/commands";
import { ServerError } from "@global/helpers/error-handler";
import {
  ICommentDocument,
  ICommentDocumentResponse,
} from "@comment/interfaces/comment-interface";
import { config } from "@root/config";
import { BaseCache } from "@service/redis/base-cache";
import { IUserDocument } from "@user/interfaces/user-interface";
import { UserDetails } from "@reaction/interfaces/reaction-interface";

const log = config.LOG.getInstance("CommentCache");

export type CommentCacheMultiType =
  | string
  | number
  | Buffer
  | RedisCommandRawReply[]
  | ICommentDocument
  | ICommentDocument[]
  | ICommentDocumentResponse
  | ICommentDocumentResponse[];

export class CommentCache extends BaseCache {
  constructor() {
    super("comment");
  }

  public async savePostCommentToCache(
    commentDoc: ICommentDocument,
    uId: string
  ): Promise<void> {
    try {
      if (!this.client.isOpen) {
        this.client.connect();
      }
      const dataToSave = [
        "_id",
        `${commentDoc._id}`,
        "comment",
        `${commentDoc.comment}`,
        "postId",
        `${commentDoc.postId}`,
        "postCreator",
        `${commentDoc.postCreator}`,
        "postCommenter",
        `${commentDoc.postCommenter}`,
        "createdAt",
        `${commentDoc.createdAt}`,
      ];
      const transaction = this.client.multi();
      await transaction
        // store all the users who commented on the post
        .ZADD(`comments:${commentDoc.postId}`, {
          score: parseInt(uId, 10),
          value: `${commentDoc._id}`,
        })
        // store all the post that a user commented on
        .ZADD(`user-comments:${commentDoc.postCommenter}`, {
          score: parseInt(uId, 10),
          value: `${commentDoc._id}`,
        })
        // stores all comments that for each post by commenter
        // .ZADD(
        //   `user-comments:${commentDoc.postId}:${commentDoc.postCommenter}`,
        //   {
        //     score: parseInt(uId, 10),
        //     value: `${commentDoc._id}`,
        //   }
        // )
        // save the comment
        .HSET(`comment:${commentDoc._id}`, dataToSave)
        .HINCRBY(`post:${commentDoc.postId}`, "commentsCount", 1)
        .exec();
    } catch (error) {
      log.error(error);
      throw new ServerError("Redis Server error");
    }
  }

  public async removePostCommentFromCache(
    postId: string,
    postCommenter: string,
    commentId: string
  ): Promise<void> {
    try {
      if (!this.client.isOpen) this.client.connect();

      const transaction = this.client.multi();
      await transaction
        .ZREM(`comments:${postId}`, `${postCommenter}`)
        .ZREM(`user-comments:${postCommenter}`, `${postId}`)
        .DEL(`comment:${commentId}`)
        .HINCRBY(`post:${postId}`, "commentsCount", -1)
        .exec();
    } catch (error) {
      log.error(error);
      throw new ServerError("Server error");
    }
  }

  public async deleteCommentFromCache(commentDoc: ICommentDocument) {
    // remove count from current
    try {
      // remove count from current
      await this.removePostCommentFromCache(
        commentDoc.postId,
        `${commentDoc.postCommenter}`,
        `${commentDoc._id}`
      );
      log.info("Successfully deleted from cache");
    } catch (error) {
      log.error(error);
      throw new ServerError("Redis Server error");
    }
  }

  public async updateCommentInCache(
    commentDoc: ICommentDocument
  ): Promise<void> {
    try {
      if (!this.client.isOpen) {
        this.client.connect();
      }
      const dataToSave = ["comment", `${commentDoc.comment}`];
      await this.client.HSET(`comment:${commentDoc.id}`, dataToSave);
    } catch (error) {
      log.error(error);
      throw new ServerError("Redis Server error");
    }
  }

  // all comments for a user
  public async getCommentsForUserFromCache(
    userId: string,
    uId: string
  ): Promise<ICommentDocumentResponse[]> {
    try {
      if (!this.client.isOpen) this.client.connect();
      const transaction = this.client.multi();
      const commentItems = await this.client.ZRANGE(
        `user-comments:${userId}`,
        uId,
        uId,
        { REV: true, BY: "SCORE" }
      );
      for (const commentId of commentItems) {
        transaction.HGETALL(`comment:${commentId}`);
      }
      const comments: CommentCacheMultiType =
        (await transaction.exec()) as CommentCacheMultiType;

      log.info("comments", comments);
      const commentReplies: ICommentDocumentResponse[] = [];
      for (const comment of comments as ICommentDocument[]) {
        commentReplies.push(await this.getCommentSubData(comment));
      }
      log.info("Fetching data from Redis cache");
      return commentReplies;
    } catch (error) {
      log.error(error);
      throw new ServerError("Server error");
    }
  }

  // get all comments from a post for a user
  public async getCommentsForUserPostFromCache(
    postId: string,
    uId: string
  ): Promise<ICommentDocumentResponse[]> {
    try {
      if (!this.client.isOpen) this.client.connect();

      const commentItems = await this.client.ZRANGE(
        `comments:${postId}`,
        uId,
        uId,
        { REV: true, BY: "SCORE" }
      );

      const transaction = this.client.multi();
      for (const commentId of commentItems) {
        transaction.HGETALL(`comment:${commentId}`);
      }
      const comments: CommentCacheMultiType =
        (await transaction.exec()) as CommentCacheMultiType;

      const commentReplies: ICommentDocumentResponse[] = [];
      for (const comment of comments as ICommentDocument[]) {
        commentReplies.push(await this.getCommentSubData(comment));
      }
      log.info("Fetching data from Redis cache");
      return commentReplies;
    } catch (error) {
      log.error(error);
      throw new ServerError("Server error");
    }
  }

  // get all comments for post
  public async getCommentsFromCache(
    postId: string,
    start: number = 0,
    end: number = -1
  ): Promise<ICommentDocumentResponse[]> {
    try {
      if (!this.client.isOpen) this.client.connect();

      const transaction = this.client.multi();
      const commentItems = await this.client.ZRANGE(
        `comments:${postId}`,
        start,
        end,
        { REV: true }
      );
      for (const commentId of commentItems) {
        transaction.HGETALL(`comment:${commentId}`);
      }
      const comments: CommentCacheMultiType =
        (await transaction.exec()) as CommentCacheMultiType;
      const commentReplies: ICommentDocumentResponse[] = [];
      for (const comment of comments as ICommentDocument[]) {
        commentReplies.push(await this.getCommentSubData(comment));
      }
      log.info("Fetching data from Redis cache");
      return commentReplies;
    } catch (error) {
      log.error(error);
      throw new ServerError("Server error");
    }
  }

  // get single comment
  public async getCommentFromCache(
    commentId: string
  ): Promise<ICommentDocumentResponse[]> {
    try {
      if (!this.client.isOpen) this.client.connect();

      const transaction = this.client.multi();
      transaction.HGETALL(`comment:${commentId}`);

      const comments: CommentCacheMultiType =
        (await transaction.exec()) as CommentCacheMultiType;
      const commentReplies: ICommentDocumentResponse[] = [];
      for (const comment of comments as ICommentDocument[]) {
        commentReplies.push(await this.getCommentSubData(comment));
      }
      log.info("Fetching data from Redis cache");
      return commentReplies;
    } catch (error) {
      log.error(error);
      throw new ServerError("Server error");
    }
  }

  private async getCommentSubData(
    comment: ICommentDocument
  ): Promise<ICommentDocumentResponse> {
    if (!this.client.isOpen) this.client.connect();

    const creator: IUserDocument = (await this.client.HGETALL(
      `user:${comment.postCreator}`
    )) as unknown as IUserDocument;

    const reactor: IUserDocument = (await this.client.HGETALL(
      `user:${comment.postCommenter}`
    )) as unknown as IUserDocument;

    const postCreator = {
      _id: creator._id,
      profilePicture: creator.profilePicture,
      username: creator.username,
      avatarColor: creator.avatarColor,
    } as UserDetails;

    const postCommenter = {
      _id: reactor._id,
      profilePicture: reactor.profilePicture,
      username: reactor.username,
      avatarColor: reactor.avatarColor,
    } as UserDetails;

    const commentResponse: ICommentDocumentResponse = {
      _id: `${comment._id}`,
      comment: comment.comment,
      postId: comment.postId,
      createdAt: comment.createdAt,
      postCreator,
      postCommenter,
    } as unknown as ICommentDocumentResponse;

    return commentResponse;
  }

  private async incrementPostCommentFromCache(
    postId: string,
    amount: number
  ): Promise<void> {
    await this.client.HINCRBY(`post:${postId}`, "commentsCount", amount);
  }
}
