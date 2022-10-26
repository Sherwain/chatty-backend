import HTTP_STATUS from "http-status-codes";
import { userService } from "@service/db/user-service";
import { UserCache } from "@service/redis/user-cache";
import { IUserDocument } from "@user/interfaces/user-interface";
import { Request, Response } from "express";

const userCache: UserCache = new UserCache();

export class CurrentUser {
  public async currentUser(req: Request, res: Response): Promise<void> {
    let isUser = false;
    let token = null;
    let user = null;
    const cachedUser: IUserDocument =
      ((await userCache.getUserFromCache(
        req.currentUser!.userId
      )) as IUserDocument) ||
      ((await userService.getUserById(
        req.currentUser!.userId
      )) as IUserDocument);

    if (Object.keys(cachedUser).length) {
      isUser = true;
      token = req.session?.jwt;
      user = cachedUser;
    }

    res.status(HTTP_STATUS.OK).json({ token, isUser, user });
  }
}
