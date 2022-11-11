import { postQueue } from "@service/queues/post-queue";
import { IPostDocument } from "@post/interfaces/post-interface";
import { JoiValidation } from "@global/decorators/joi-validator.decorators";
import { postSchema, postWithImageSchema } from "@post/joi-schemas/post";
import { Response, Request } from "express";
import HTTP_STATUS from "http-status-codes";
import { ObjectId } from "mongodb";
import { PostCache } from "@service/redis/post-cache";
import { socketIOPostServer } from "@socket/post-socket";
import { upload } from "@service/cloud/cloudinary";
import { UploadApiResponse } from "cloudinary";
import { config } from "@root/config";
import { BadRequestError } from "@global/helpers/error-handler";
import { IReactions } from "@reaction/interfaces/reaction-interface";

const log = config.LOG.getInstance("server");

export class Post {
  @JoiValidation(postSchema)
  public async post(req: Request, res: Response): Promise<void> {
    const { post, bgColor, privacy, gifUrl, profilePicture, feelings } =
      req.body;
    const postObjectId: ObjectId = new ObjectId();
    const createdPost: IPostDocument = {
      _id: postObjectId,
      userId: req.currentUser!.userId,
      username: req.currentUser!.username,
      email: req.currentUser!.email,
      avatarColor: req.currentUser!.avatarColor,
      profilePicture: profilePicture,
      post: post,
      bgColor: bgColor,
      commentsCount: 0,
      imgVersion: null,
      imgId: null,
      feelings: feelings,
      gifUrl: gifUrl,
      privacy: privacy,
      reactions: {
        like: 0,
        love: 0,
        happy: 0,
        wow: 0,
        sad: 0,
        angry: 0,
      } as IReactions,
      createdAt: new Date(),
    } as IPostDocument;

    const postCache: PostCache = new PostCache();
    await postCache.savePostToCache({
      key: postObjectId,
      currentUserId: req.currentUser!.userId,
      uId: req.currentUser!.uId,
      createdPost,
    });

    socketIOPostServer.emit("new-post", createdPost);

    postQueue.addPostJob("addPostToDB", {
      value: createdPost,
      key: req.currentUser!.userId,
    });
    res
      .status(HTTP_STATUS.CREATED)
      .json({ message: "Post created successfully" });
  }

  @JoiValidation(postWithImageSchema)
  public async postWithImage(req: Request, res: Response): Promise<void> {
    const { post, bgColor, privacy, gifUrl, profilePicture, feelings, image } =
      req.body;
    const postObjectId: ObjectId = new ObjectId();

    const result: UploadApiResponse = (await upload(
      image,
      `${req.currentUser!.userId}`
    )) as UploadApiResponse;
    if (!result?.public_id) {
      log.error("Error occurred", result.message);
      throw new BadRequestError(result.message);
    }

    const createdPost: IPostDocument = {
      _id: postObjectId,
      userId: req.currentUser!.userId,
      username: req.currentUser!.username,
      email: req.currentUser!.email,
      avatarColor: req.currentUser!.avatarColor,
      profilePicture: profilePicture,
      post: post,
      bgColor: bgColor,
      commentsCount: 0,
      imgVersion: result.version.toString(),
      imgId: result.public_id,
      feelings: feelings,
      gifUrl: gifUrl,
      privacy: privacy,
      reactions: {
        like: 0,
        love: 0,
        happy: 0,
        wow: 0,
        sad: 0,
        angry: 0,
      } as IReactions,
      createdAt: new Date(),
    } as IPostDocument;

    const postCache: PostCache = new PostCache();
    await postCache.savePostToCache({
      key: postObjectId,
      currentUserId: req.currentUser!.userId,
      uId: req.currentUser!.uId,
      createdPost,
    });

    socketIOPostServer.emit("new-post", createdPost);

    postQueue.addPostJob("addPostToDB", {
      value: createdPost,
      key: req.currentUser!.userId,
    });
    res
      .status(HTTP_STATUS.CREATED)
      .json({ message: "Post created successfully" });
  }
}
