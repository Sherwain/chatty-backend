import { IGetPostsQuery } from "@post/interfaces/post-interface";
import { Response, Request } from "express";
import HTTP_STATUS from "http-status-codes";
import { PostCache } from "@service/redis/post-cache";
import { config } from "@root/config";
import { postService } from "@service/db/post-service";

const log = config.LOG.getInstance("server");
const PAGE_SIZE = 2;

export class Posts {
  public async posts(req: Request, res: Response): Promise<void> {
    const { page } = req.params;
    const start = (parseInt(page) - 1) * PAGE_SIZE;
    const end = PAGE_SIZE * parseInt(page);
    const redisStart = start === 0 ? start : start + 1;
    const postCache: PostCache = new PostCache();
    const query = {} as IGetPostsQuery;
    let posts = await postCache.getPostsFromCache("posts", redisStart, end);
    if (!posts.length)
      posts = await postService.getPosts(query, start, end, { createdAt: -1 });

    res
      .status(HTTP_STATUS.OK)
      .json({ message: "All posts", posts, totalPosts: posts.length });
  }

  public async postsWithImage(req: Request, res: Response): Promise<void> {
    const { page } = req.params;
    const start = (parseInt(page) - 1) * PAGE_SIZE;
    const end = PAGE_SIZE * parseInt(page);
    const redisStart = start === 0 ? start : start + 1;
    const postCache: PostCache = new PostCache();
    const query = { imgId: "$ne", gifUrl: "$ne" } as IGetPostsQuery;
    let posts = await postCache.getPostsWithImagesFromCache(
      "posts",
      redisStart,
      end
    );
    if (!posts.length)
      posts = await postService.getPosts(query, start, end, { createdAt: -1 });

    res.status(HTTP_STATUS.OK).json({
      message: "All posts with images",
      posts,
      totalPosts: posts.length,
    });
  }
}
