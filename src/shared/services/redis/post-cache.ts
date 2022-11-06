import { updatedPost } from "./../../../mocks/post.mock";
import {
  IPostDocument,
  IReactions,
  ISavePostToCache,
} from "@post/interfaces/post-interface";
import { BaseCache } from "@service/redis/base-cache";
import { ServerError } from "@global/helpers/error-handler";
import { config } from "@root/config";
import { Helpers } from "@global/helpers/helper";
import { RedisCommandRawReply } from "@redis/client/dist/lib/commands";

const log = config.LOG.getInstance("PostCache");
export type PostCacheMultiType =
  | string
  | number
  | Buffer
  | RedisCommandRawReply[]
  | IPostDocument
  | IPostDocument[];

export class PostCache extends BaseCache {
  constructor() {
    super("post");
  }

  private getPostSubData(post: IPostDocument): IPostDocument {
    post.reactions = Helpers.parseJSON(`${post.reactions}`) as IReactions;
    post.commentsCount = Helpers.parseJSON(`${post.commentsCount}`) as number;
    post.createdAt = new Date(Helpers.parseJSON(`${post.createdAt}`)) as Date;
    return post;
  }

  private formatRedisPostData(
    createdPost: IPostDocument,
    flag: number
  ): string[] {
    if (flag) {
      return [
        "_id",
        `${createdPost._id}`,
        "userId",
        `${createdPost.userId}`,
        "username",
        `${createdPost.username}`,
        "email",
        `${createdPost.email}`,
        "avatarColor",
        `${createdPost.avatarColor}`,
        "profilePicture",
        `${createdPost.profilePicture}`,
        "createdAt",
        `${createdPost.createdAt}`,
        "post",
        `${createdPost.post}`,
        "bgColor",
        `${createdPost.bgColor}`,
        "commentsCount",
        `${createdPost.commentsCount}`,
        "imgVersion",
        `${createdPost.imgVersion}`,
        "imgId",
        `${createdPost.imgId}`,
        "feelings",
        `${createdPost.feelings}`,
        "gifUrl",
        `${createdPost.gifUrl}`,
        "privacy",
        `${createdPost.privacy}`,
        "reactions",
        JSON.stringify(createdPost.reactions),
      ];
    }
    return [
      "post",
      `${createdPost.post}`,
      "bgColor",
      `${createdPost.bgColor}`,
      "profilePicture",
      `${createdPost.profilePicture}`,
      "imgVersion",
      `${createdPost.imgVersion}`,
      "imgId",
      `${createdPost.imgId}`,
      "feelings",
      `${createdPost.feelings}`,
      "gifUrl",
      `${createdPost.gifUrl}`,
      "privacy",
      `${createdPost.privacy}`,
    ];
  }

  public async savePostToCache(postData: ISavePostToCache): Promise<void> {
    const { key, uId, createdPost, currentUserId } = postData;
    const dataToSave: string[] = this.formatRedisPostData(createdPost, 1);

    try {
      if (!this.client.isOpen) {
        this.client.connect();
      }
      const transaction = this.client.multi();

      transaction
        .HINCRBY(`user:${currentUserId}`, "postsCount", 1)
        .ZADD("posts", {
          score: parseInt(uId, 10),
          value: `${key}`,
        })
        .HSET(`post:${key}`, dataToSave);
      await transaction.exec();
    } catch (error) {
      log.error(error);
      throw new ServerError("Server error. Try again");
    }
  }

  public async updatePostInCache(
    postId: string,
    updatedPost: IPostDocument
  ): Promise<IPostDocument> {
    try {
      if (!this.client.isOpen) {
        this.client.connect();
      }
      const transaction = this.client.multi();
      const data: string[] = this.formatRedisPostData(updatedPost, 0);
      transaction.HSET(`post:${postId}`, data);
      await transaction.exec();
      const post: PostCacheMultiType = (await transaction
        .HGETALL(`post:${postId}`)
        .exec()) as PostCacheMultiType;
      const result = this.getPostSubData(post as IPostDocument);
      return result;
    } catch (error) {
      log.error(error);
      throw new ServerError("Server error. Try again");
    }
  }

  public async getPostsFromCache(
    key: string,
    start: number,
    end: number
  ): Promise<IPostDocument[]> {
    try {
      if (!this.client.isOpen) {
        this.client.connect();
      }

      const postList = await this.client.ZRANGE(key, start, end, {
        REV: true,
      });
      const transaction: ReturnType<typeof this.client.multi> =
        this.client.multi();

      for (const post of postList) {
        transaction.HGETALL(`post:`);
      }
      const posts: PostCacheMultiType =
        (await transaction.exec()) as PostCacheMultiType;

      const postReplies: IPostDocument[] = [];
      for (const post of posts as IPostDocument[]) {
        postReplies.push(this.getPostSubData(post));
      }
      log.info("Fetching data from Redis cache");
      return postReplies;
    } catch (error) {
      log.error(error);
      throw new ServerError("Server error");
    }
  }

  public async getUserPostsFromCache(
    key: string,
    uId: number
  ): Promise<IPostDocument[] | IPostDocument> {
    try {
      if (!this.client.isOpen) {
        this.client.connect();
      }

      const postList = await this.client.ZRANGE(key, uId, uId, {
        REV: true,
        BY: "SCORE",
      });
      const transaction: ReturnType<typeof this.client.multi> =
        this.client.multi();

      for (const post of postList) {
        transaction.HGETALL(`post:${post}`);
      }
      const posts: PostCacheMultiType =
        (await transaction.exec()) as PostCacheMultiType;

      const postReplies: IPostDocument[] = [];
      for (const post of posts as IPostDocument[]) {
        post.reactions = Helpers.parseJSON(`${post.reactions}`) as IReactions;
        post.commentsCount = Helpers.parseJSON(
          `${post.commentsCount}`
        ) as number;
        post.createdAt = new Date(
          Helpers.parseJSON(`${post.createdAt}`)
        ) as Date;
        postReplies.push(post);
      }
      log.info("Fetching data from Redis cache");
      return postReplies;
    } catch (error) {
      log.error(error);
      throw new ServerError("Server error");
    }
  }

  public async getPostsWithImagesFromCache(
    key: string,
    start: number,
    end: number
  ): Promise<IPostDocument[]> {
    try {
      if (!this.client.isOpen) {
        this.client.connect();
      }

      const postList = await this.client.ZRANGE(key, start, end, {
        REV: true,
      });
      const transaction: ReturnType<typeof this.client.multi> =
        this.client.multi();

      for (const post of postList) {
        transaction.HGETALL(`post:${post}`);
      }
      const posts: PostCacheMultiType =
        (await transaction.exec()) as PostCacheMultiType;

      const postReplies: IPostDocument[] = [];
      for (const post of posts as IPostDocument[]) {
        if ((post.imgId && post.imgVersion) || post.gifUrl) {
          post.reactions = Helpers.parseJSON(`${post.reactions}`) as IReactions;
          post.commentsCount = Helpers.parseJSON(
            `${post.commentsCount}`
          ) as number;
          post.createdAt = new Date(
            Helpers.parseJSON(`${post.createdAt}`)
          ) as Date;
          postReplies.push(post);
        }
      }
      log.info("Fetching data from Redis cache");
      return postReplies;
    } catch (error) {
      log.error(error);
      throw new ServerError("Server error");
    }
  }

  public async getTotalPostsInCache(key: string): Promise<number> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }
      const count: number = await this.client.ZCARD(key);
      log.info("Fetching data from Redis cache");
      return count;
    } catch (error) {
      log.error(error);
      throw new ServerError("Server error. Try again.");
    }
  }

  public async getTotalUserPostsInCache(
    key: string,
    uId: number
  ): Promise<number> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }
      const count: number = await this.client.ZCOUNT(key, uId, uId);
      log.info("Fetching data from Redis cache");
      return count;
    } catch (error) {
      log.error(error);
      throw new ServerError("Redis error. Try again.");
    }
  }

  public async deletePostFromCache(
    userId: string,
    postId: string
  ): Promise<void> {
    try {
      if (!this.client.isOpen) {
        this.client.connect();
      }
      const transaction = this.client.multi();
      transaction
        .ZREM("posts", postId)
        .DEL(`post:${postId}`)
        .DEL(`comments:${postId}`)
        .DEL(`reactions:${postId}`)
        .HINCRBY(`user:${userId}`, "postsCount", -1)
        .exec();
      log.info("successfully delete post from redis cache...");
    } catch (error) {
      log.error(error);
      throw new ServerError("Redis error. Try again.");
    }
  }
}
