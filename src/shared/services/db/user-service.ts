import mongoose from "mongoose";
import { IUserDocument } from "@user/interfaces/user-interface";
import { UserModel } from "@user/models/user-schema";
import { config } from "@root/config";

const log = config.LOG.getInstance("database");

class UserService {
  public async addUserData(data: IUserDocument): Promise<void> {
    await UserModel.create(data);
  }

  public async getUserById(userId: string): Promise<IUserDocument> {
    log.info("Getting user from mongodb database...");
    const users: IUserDocument[] = await UserModel.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(userId) } },
      {
        $lookup: {
          from: "auth",
          localField: "_id",
          foreignField: "userId",
          as: "auth",
        },
      },
      { $unwind: "$auth" },
      { $project: this.aggregateProject() },
    ]);
    return users[0];
  }

  public async getUserByAuthId(id: string): Promise<IUserDocument> {
    const users: IUserDocument[] = await UserModel.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(id) } },
      {
        $lookup: {
          from: "auth",
          localField: "_id",
          foreignField: "userId",
          as: "auth",
        },
      },
      { $unwind: "$auth" },
      { $project: this.aggregateProject() },
    ]);
    return users[0];
  }

  private aggregateProject() {
    return {
      _id: 1,
      username: "$auth.username",
      uId: "$auth.uId",
      email: "$auth.email",
      avatarColor: "$auth.avatarColor",
      createdAt: "$auth.createdAt",
      postsCount: 1,
      work: 1,
      school: 1,
      quote: 1,
      location: 1,
      blocked: 1,
      blockedBy: 1,
      bgImageVersion: 1,
      bgImageId: 1,
      followersCount: 1,
      followingCount: 1,
      notifications: 1,
      social: 1,
      profilePicture: 1,
    };
  }
}

export const userService: UserService = new UserService();
