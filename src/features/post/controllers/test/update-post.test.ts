import { Request, Response } from "express";
import { Server } from "socket.io";
import { authUserPayload } from "@root/mocks/auth.mock";
import * as postServer from "@socket/post-socket";
import {
  postMockData,
  postMockRequest,
  postMockResponse,
  updatedPost,
  updatedPostWithImage,
} from "@root/mocks/post.mock";
import { PostCache } from "@service/redis/post-cache";
import { postQueue } from "@service/queues/post-queue";
import { UpdatePost } from "@post/controllers/update-post";
import * as cloudinaryUploads from "@service/cloud/cloudinary";

jest.useFakeTimers();
jest.mock("@service/queues/base-queue");
jest.mock("@service/redis/post-cache");
jest.mock("@service/cloud/cloudinary");

Object.defineProperties(postServer, {
  socketIOPostServer: {
    value: new Server(),
    writable: true,
  },
});

describe("Update", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  describe("posts", () => {
    it("should send correct json response", async () => {
      const req: Request = postMockRequest(updatedPost, authUserPayload, {
        postId: `${postMockData._id}`,
      }) as Request;
      const res: Response = postMockResponse();
      const postSpy = jest
        .spyOn(PostCache.prototype, "updatePostInCache")
        .mockResolvedValue(postMockData);
      jest.spyOn(postServer.socketIOPostServer, "emit");
      jest.spyOn(postQueue, "updatePostJob");

      await UpdatePost.prototype.update(req, res);
      expect(postSpy).toHaveBeenCalledWith(`${postMockData._id}`, updatedPost);
      expect(postServer.socketIOPostServer.emit).toHaveBeenCalledWith(
        "updated-post",
        postMockData,
        "post"
      );
      expect(postQueue.updatePostJob).toHaveBeenCalledWith("updatePostInDB", {
        postData: postMockData,
        postId: postMockData._id!.toString(),
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Post updated successfully",
      });
    });
  });

  describe("postWithImage", () => {
    it("should send correct json response if imgId and imgVersion exists", async () => {
      updatedPostWithImage.imgId = "1234";
      updatedPostWithImage.imgVersion = "1234";
      updatedPost.imgId = "1234";
      updatedPost.imgVersion = "1234";
      updatedPost.post = updatedPostWithImage.post;
      updatedPostWithImage.image =
        "data:text/plain;base64,SGVsbG8sIFdvcmxkIQ==";
      const req: Request = postMockRequest(
        updatedPostWithImage,
        authUserPayload,
        { postId: `${postMockData._id}` }
      ) as Request;
      const res: Response = postMockResponse();
      const postSpy = jest.spyOn(PostCache.prototype, "updatePostInCache");
      jest.spyOn(postServer.socketIOPostServer, "emit");
      jest.spyOn(postQueue, "updatePostJob");

      await UpdatePost.prototype.updateWithImage(req, res);
      expect(PostCache.prototype.updatePostInCache).toHaveBeenCalledWith(
        `${postMockData._id}`,
        postSpy.mock.calls[0][1]
      );
      expect(postServer.socketIOPostServer.emit).toHaveBeenCalledWith(
        "updated-post",
        postMockData,
        "post"
      );
      expect(postQueue.updatePostJob).toHaveBeenCalledWith("updatePostInDB", {
        postData: postMockData,
        postId: postMockData._id?.toString(),
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Post updated successfully",
      });
    });

    it("should send correct json response if no imgId and imgVersion", async () => {
      updatedPostWithImage.imgId = "1234";
      updatedPostWithImage.imgVersion = "1234";
      updatedPost.imgId = "1234";
      updatedPost.imgVersion = "1234";
      updatedPost.post = updatedPostWithImage.post;
      updatedPostWithImage.image =
        "data:text/plain;base64,SGVsbG8sIFdvcmxkIQ==";
      const req: Request = postMockRequest(
        updatedPostWithImage,
        authUserPayload,
        { postId: `${postMockData._id}` }
      ) as Request;
      const res: Response = postMockResponse();
      const postSpy = jest.spyOn(PostCache.prototype, "updatePostInCache");
      jest
        .spyOn(cloudinaryUploads, "upload")
        .mockImplementation((): any =>
          Promise.resolve({ version: "1234", public_id: "123456" })
        );
      jest.spyOn(postServer.socketIOPostServer, "emit");
      jest.spyOn(postQueue, "updatePostJob");

      await UpdatePost.prototype.updateWithImage(req, res);
      expect(PostCache.prototype.updatePostInCache).toHaveBeenCalledWith(
        `${postMockData._id}`,
        postSpy.mock.calls[0][1]
      );
      expect(postServer.socketIOPostServer.emit).toHaveBeenCalledWith(
        "updated-post",
        postMockData,
        "post"
      );
      expect(postQueue.updatePostJob).toHaveBeenCalledWith("updatePostInDB", {
        postData: postMockData,
        postId: `${postMockData._id}`,
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Post updated successfully",
      });
    });
  });
});
