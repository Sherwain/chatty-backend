import { Request, Response } from "express";
import { Server } from "socket.io";
import { authUserPayload } from "@root/mocks/auth.mock";
import * as postServer from "@socket/post-socket";
import {
  newPost,
  postMockRequest,
  postMockResponse,
} from "@root/mocks/post.mock";
import { postQueue } from "@service/queues/post-queue";
import { DeletePost } from "@post/controllers/delete-post";
import { PostCache } from "@service/redis/post-cache";

jest.useFakeTimers();
jest.mock("@service/queues/base-queue");
jest.mock("@service/redis/post-cache");

Object.defineProperties(postServer, {
  socketIOPostServer: {
    value: new Server(),
    writable: true,
  },
});

describe("Delete", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  it("should send correct json response", async () => {
    const req: Request = postMockRequest(newPost, authUserPayload, {
      postId: "12345",
    }) as Request;
    const res: Response = postMockResponse();
    jest.spyOn(postServer.socketIOPostServer, "emit");
    jest.spyOn(PostCache.prototype, "deletePostFromCache");
    jest.spyOn(postQueue, "deletePostJob");

    await DeletePost.prototype.deletePost(req, res);
    expect(postServer.socketIOPostServer.emit).toHaveBeenCalledWith(
      "delete-post",
      req.params.postId
    );
    const postId = req.params.postId;
    const userId = req.currentUser?.userId;
    expect(PostCache.prototype.deletePostFromCache).toHaveBeenCalledWith(
      userId,
      postId
    );
    expect(postQueue.deletePostJob).toHaveBeenCalledWith("deletePostFromDB", {
      userId,
      postId,
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: "Post deleted successfully",
    });
  });
});
