import { Request, Response } from "express";
import { authUserPayload } from "@root/mocks/auth.mock";
import {
  newPost,
  postMockData,
  postMockRequest,
  postMockResponse,
} from "@root/mocks/post.mock";
import { PostCache } from "@service/redis/post-cache";
import { Posts } from "@post/controllers/posts";
import { postService } from "@service/db/post-service";

jest.useFakeTimers();
jest.mock("@service/queues/base-queue");
jest.mock("@service/redis/post-cache");

describe("Get", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  describe("posts", () => {
    it("should send correct json response if posts exist in cache", async () => {
      const req: Request = postMockRequest(newPost, authUserPayload, {
        page: "1",
      }) as Request;
      const res: Response = postMockResponse();
      jest
        .spyOn(PostCache.prototype, "getPostsFromCache")
        .mockResolvedValue([postMockData]);
      jest
        .spyOn(PostCache.prototype, "getTotalPostsInCache")
        .mockResolvedValue(1);

      await Posts.prototype.posts(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "All posts",
        posts: [postMockData],
        totalPosts: 1,
      });
    });

    it("should send correct json response if posts exist in database", async () => {
      const req: Request = postMockRequest(newPost, authUserPayload, {
        page: "1",
      }) as Request;
      const res: Response = postMockResponse();
      jest
        .spyOn(PostCache.prototype, "getPostsFromCache")
        .mockResolvedValue([]);
      jest
        .spyOn(PostCache.prototype, "getTotalPostsInCache")
        .mockResolvedValue(0);
      jest.spyOn(postService, "getPosts").mockResolvedValue([postMockData]);
      jest.spyOn(postService, "postCounts").mockResolvedValue(1);

      await Posts.prototype.posts(req, res);
      expect(postService.getPosts).toHaveBeenCalledWith({}, 0, 2, {
        createdAt: -1,
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "All posts",
        posts: [postMockData],
        totalPosts: 1,
      });
    });

    it("should send empty posts", async () => {
      const req: Request = postMockRequest(newPost, authUserPayload, {
        page: "1",
      }) as Request;
      const res: Response = postMockResponse();
      jest
        .spyOn(PostCache.prototype, "getPostsFromCache")
        .mockResolvedValue([]);
      jest
        .spyOn(PostCache.prototype, "getTotalPostsInCache")
        .mockResolvedValue(0);
      jest.spyOn(postService, "getPosts").mockResolvedValue([]);
      jest.spyOn(postService, "postCounts").mockResolvedValue(0);

      await Posts.prototype.posts(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "All posts",
        posts: [],
        totalPosts: 0,
      });
    });
  });

  describe("postWithImages", () => {
    it("should send correct json response if posts exist in cache", async () => {
      const req: Request = postMockRequest(newPost, authUserPayload, {
        page: "1",
      }) as Request;
      const res: Response = postMockResponse();
      jest
        .spyOn(PostCache.prototype, "getPostsWithImagesFromCache")
        .mockResolvedValue([postMockData]);

      await Posts.prototype.postsWithImage(req, res);
      expect(
        PostCache.prototype.getPostsWithImagesFromCache
      ).toHaveBeenCalledWith("posts", 0, 2);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "All posts with images",
        posts: [postMockData],
        totalPosts: 1,
      });
    });

    it("should send correct json response if posts exist in database", async () => {
      const req: Request = postMockRequest(newPost, authUserPayload, {
        page: "1",
      }) as Request;
      const res: Response = postMockResponse();
      jest
        .spyOn(PostCache.prototype, "getPostsWithImagesFromCache")
        .mockResolvedValue([]);
      jest.spyOn(postService, "getPosts").mockResolvedValue([postMockData]);

      await Posts.prototype.postsWithImage(req, res);
      expect(postService.getPosts).toHaveBeenCalledWith(
        { imgId: "$ne", gifUrl: "$ne" },
        0,
        2,
        { createdAt: -1 }
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "All posts with images",
        posts: [postMockData],
        totalPosts: 1,
      });
    });

    it("should send empty posts", async () => {
      const req: Request = postMockRequest(newPost, authUserPayload, {
        page: "1",
      }) as Request;
      const res: Response = postMockResponse();
      jest
        .spyOn(PostCache.prototype, "getPostsWithImagesFromCache")
        .mockResolvedValue([]);
      jest.spyOn(postService, "getPosts").mockResolvedValue([]);

      await Posts.prototype.postsWithImage(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "All posts with images",
        posts: [],
        totalPosts: 0,
      });
    });
  });
});
