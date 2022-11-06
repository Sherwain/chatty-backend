import { BaseCache } from "@service/redis/base-cache";
import { ServerError } from "@global/helpers/error-handler";
import { config } from "@root/config";
import { IUserDocument } from "@user/interfaces/user-interface";
import { Helpers } from "@global/helpers/helper";

const log = config.LOG.getInstance("UserCache");

export class UserCache extends BaseCache {
  constructor() {
    super("user");
  }

  public async saveUserToCache(
    key: string,
    uId: string,
    createdUser: IUserDocument
  ): Promise<void> {
    const createdAt = new Date();
    const firstList: string[] = [
      "_id",
      `${createdUser._id}`,
      "uId",
      `${createdUser.uId}`,
      "username",
      `${createdUser.username}`,
      "email",
      `${createdUser.email}`,
      "avatarColor",
      `${createdUser.avatarColor}`,
      "createdAt",
      `${createdAt}`,
      "postsCount",
      `${createdUser.postsCount}`,
    ];

    const secondList: string[] = [
      "blocked",
      JSON.stringify(createdUser.blocked),
      "blockedBy",
      JSON.stringify(createdUser.blockedBy),
      "profilePicture",
      `${createdUser.profilePicture}`,
      "followersCount",
      `${createdUser.followersCount}`,
      "followingCount",
      `${createdUser.followingCount}`,
      "notifications",
      JSON.stringify(createdUser.notifications),
      "social",
      JSON.stringify(createdUser.social),
    ];

    const thirdList: string[] = [
      "work",
      `${createdUser.work}`,
      "location",
      `${createdUser.location}`,
      "school",
      `${createdUser.school}`,
      "quote",
      `${createdUser.quote}`,
      "bgImageVersion",
      `${createdUser.bgImageVersion}`,
      "bgImageId",
      `${createdUser.bgImageId}`,
    ];

    const dataToSave: string[] = [...firstList, ...secondList, ...thirdList];

    try {
      if (!this.client.isOpen) {
        this.client.connect();
      }
      const transaction = this.client.multi();
      transaction
        .ZADD("users", {
          score: parseInt(uId, 10),
          value: `${key}`,
        })
        .HSET(`user:${key}`, dataToSave)
        .exec();
    } catch (error) {
      log.error(error);
      throw new ServerError("Server error. Try again");
    }
  }

  public async getUserFromCache(userId: string): Promise<IUserDocument | null> {
    try {
      if (!this.client.isOpen) {
        this.client.connect();
      }
      const result = await this.client.HGETALL(`user:${userId}`);
      const user = Object.fromEntries(
        Object.entries(result).map(([key, value]) => [
          key,
          Helpers.parseJSON(value),
        ])
      ) as unknown as IUserDocument;
      return user;
    } catch (error) {
      log.error(error);
      throw new ServerError("Server error");
    }
  }
}
