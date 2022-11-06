import { postQueue } from "@service/queues/post-queue";
import HTTP_STATUS from "http-status-codes";
import { Request, Response } from "express";
import { PostCache } from "@service/redis/post-cache";
import { socketIOPostServer } from "@socket/post-socket";

const postCache: PostCache = new PostCache();

export class DeletePost {
  public deletePost(req: Request, res: Response): void {
    const { postId } = req.params;
    const userId = req.currentUser!.userId;
    socketIOPostServer.emit("delete-post", postId);
    postQueue.deletePostJob("deletePostFromDB", { userId, postId });
    postCache.deletePostFromCache(userId, postId);
    res.status(HTTP_STATUS.OK).json({ message: `Post deleted successfully` });
  }
}
