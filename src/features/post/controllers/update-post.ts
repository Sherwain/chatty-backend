import HTTP_STATUS from "http-status-codes";
import { PostCache } from "@service/redis/post-cache";
import { IPostDocument } from "@post/interfaces/post-interface";
import { postSchema, postWithImageSchema } from "@post/joi-schemas/post";
import { JoiValidation } from "@global/decorators/joi-validator.decorators";
import { Request, Response } from "express";
import { socketIOPostServer } from "@socket/post-socket";
import { upload } from "@service/cloud/cloudinary";
import { UploadApiResponse } from "cloudinary";
import { postQueue } from "@service/queues/post-queue";
import { config } from "@root/config";
import { BadRequestError } from "@global/helpers/error-handler";

const log = config.LOG.getInstance("server");

export class UpdatePost {
  @JoiValidation(postSchema)
  public async update(req: Request, res: Response): Promise<void> {
    const postId = req.params.postId;

    const postData = UpdatePost.prototype.getFields(req) as IPostDocument;
    await UpdatePost.prototype.addDataToStorage(postId, postData);
    res.status(HTTP_STATUS.OK).json({ message: "Post updated successfully" });
  }

  @JoiValidation(postWithImageSchema)
  public async updateWithImage(req: Request, res: Response): Promise<void> {
    const { imgId, imgVersion } = req.body;
    if (imgId && imgVersion) {
      UpdatePost.prototype.updatePost(req);
    } else {
      const result = await UpdatePost.prototype.addImageToPost(req);
      if (!result?.public_id) {
        log.error("Error occurred", result.message);
        throw new BadRequestError(result.message);
      }
    }

    res.status(HTTP_STATUS.OK).json({ message: "Post updated successfully" });
  }

  private async updatePost(req: Request): Promise<void> {
    const postId = req.params.postId;
    const postData = UpdatePost.prototype.getFields(req) as IPostDocument;

    await this.addDataToStorage(postId, postData);
  }

  private async addImageToPost(req: Request): Promise<UploadApiResponse> {
    let postData = UpdatePost.prototype.getFields(req) as IPostDocument;

    const { postId } = req.params;
    const result: UploadApiResponse = (await upload(
      req.body.image,
      `${req.currentUser!.userId}`
    )) as UploadApiResponse;
    if (!result?.public_id) {
      return result;
    }

    postData.imgVersion = result.version.toString();
    postData.imgId = result.public_id;

    await this.addDataToStorage(postId, postData);
    return result;
  }

  private getFields(req: Request): IPostDocument {
    const {
      post,
      bgColor,
      imgVersion,
      imgId,
      privacy,
      gifUrl,
      profilePicture,
      feelings,
    } = req.body;
    const postData = {
      post,
      bgColor,
      privacy,
      feelings,
      gifUrl,
      profilePicture,
      imgId,
      imgVersion,
    } as IPostDocument;
    return postData;
  }

  private async addDataToStorage(
    postId: string,
    postData: IPostDocument
  ): Promise<void> {
    const postCache = new PostCache();
    const updatedPostData = await postCache.updatePostInCache(postId, postData);
    socketIOPostServer.emit("updated-post", updatedPostData, "post");
    postQueue.updatePostJob("updatePostInDB", {
      postData: updatedPostData,
      postId,
    });
  }
}
