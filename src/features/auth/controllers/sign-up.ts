import { authQueue } from "@service/queues/auth-queue";
import { UserCache } from "@service/redis/user-cache";
import HTTP_STATUS from "http-status-codes";
import { IAuthDocument, ISignUpData } from "@auth/interfaces/auth-interface";
import { authService } from "@service/db/auth-service";
import { ObjectId } from "mongodb";
import { Request, Response } from "express";
import { JoiValidation } from "@global/decorators/joi-validator.decorators";
import { SignupSchema } from "@auth/joi-schemas/signup";
import { BadRequestError } from "@global/helpers/error-handler";
import { UploadApiResponse } from "cloudinary";
import { upload } from "@service/cloud/cloudinary";
import { config } from "@root/config";
import Logger from "bunyan";
import { Helpers } from "@global/helpers/helper";
import { IUserDocument } from "@user/interfaces/user-interface";
import { omit } from "lodash";
import { userQueue } from "@service/queues/user-queue";
import JWT from "jsonwebtoken";

const log: Logger = config.LOG.getInstance("server");
const userCache: UserCache = new UserCache();

export class SignUp {
  @JoiValidation(SignupSchema)
  public async create(req: Request, res: Response): Promise<void> {
    const { username, email, password, avatarColor, avatarImage } = req.body;
    let user: IAuthDocument = await authService.getUserByUsernameOrEmail(
      username,
      email
    );
    if (user) {
      throw new BadRequestError("User already exists!");
    }

    const authObjectId: ObjectId = new ObjectId();
    const userObjectId: ObjectId = new ObjectId();
    const uId = Helpers.generateRandomIntegers().toString();

    const authData: IAuthDocument = SignUp.prototype.signUpData({
      _id: authObjectId,
      uId,
      email: email.toLowerCase(),
      username,
      password,
      avatarColor,
    });

    const result: UploadApiResponse = (await upload(
      avatarImage,
      `${userObjectId}`,
      true,
      true
    )) as UploadApiResponse;
    if (!result?.public_id) {
      log.error("Error occurred");
      throw new BadRequestError(
        "File upload: Error occurred. Please try again..."
      );
    }

    //add to redis
    const userDataCache: IUserDocument = SignUp.prototype.userData(
      authData,
      userObjectId
    );
    userDataCache.profilePicture = `https://res.cloudinary.com/cloudie/image/upload/v${result.version}/${config.CLOUDINARY_FOLDER}/${userObjectId}`;
    await userCache.saveUserToCache(`${userObjectId}`, uId, userDataCache);

    //add to database
    omit(userDataCache, [
      "uId",
      "username",
      "email",
      "avatarColor",
      "password",
    ]);

    authQueue.addAuthUserJob("addAuthUserToDB", { value: authData });
    userQueue.addUserJob("addUserToDB", { value: userDataCache });

    const userJWT: string = SignUp.prototype.signToken(authData, userObjectId);
    req.session = { jwt: userJWT };

    res.status(HTTP_STATUS.CREATED).json({
      message: "User created successfully!",
      user: userDataCache,
      token: userJWT,
    });
  }

  private signToken(data: IAuthDocument, userObjectId: ObjectId): string {
    return JWT.sign(
      {
        userId: userObjectId,
        uId: data.uId,
        email: data.email,
        username: data.username,
        avatarColor: data.avatarColor,
      },
      config.JWT_TOKEN!
    );
  }

  public async getData(req: Request, res: Response): Promise<void> {
    log.info("In the get data endpoint");
    res.status(HTTP_STATUS.ACCEPTED).json({ message: "OK" });
  }

  private signUpData(data: ISignUpData): IAuthDocument {
    const { _id, username, email, uId, password, avatarColor } = data;
    return {
      _id,
      uId,
      username,
      email,
      password,
      avatarColor,
      createAt: new Date(),
    } as unknown as IAuthDocument;
  }

  private userData(data: IAuthDocument, userObjectId: ObjectId): IUserDocument {
    const { _id, username, uId, email, password, avatarColor } = data;
    return {
      _id: userObjectId,
      authId: data,
      uId,
      username: username,
      email,
      password,
      avatarColor,
      profilePicture: null,
      blocked: [],
      blockedBy: [],
      work: null,
      location: null,
      school: null,
      quote: null,
      bgImageVersion: null,
      bgImageId: null,
      followersCount: 0,
      followingCount: 0,
      postsCount: 0,
      notifications: {
        messages: true,
        reactions: true,
        comments: true,
        follows: true,
      },
      social: {
        facebook: null,
        instagram: null,
        twitter: null,
        youtube: null,
      },
    } as unknown as IUserDocument;
  }
}
