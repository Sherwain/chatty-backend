import HTTP_STATUS from "http-status-codes";
import {
  IReactionDocument,
  IReactionJob,
} from "@reaction/interfaces/reaction-interface";
import { ObjectId } from "mongodb";
import { Response, Request } from "express";
import { ReactionCache } from "@service/redis/reaction-cache";
import { reactionQueue } from "@service/queues/reaction-queue";

const reactionCache: ReactionCache = new ReactionCache();

export class DeleteReaction {
  public async delete(req: Request, res: Response): Promise<void> {
    const { postId, reaction } = req.params;

    const reactionDoc: IReactionDocument = {
      postId: new ObjectId(postId),
      reaction,
      postReactor: new ObjectId(req.currentUser!.userId),
    } as unknown as IReactionDocument;

    await reactionCache.deleteReactionFromCache(reactionDoc);
    const job: IReactionJob = { reactionDoc };
    reactionQueue.deleteReactionJob("deleteReactionFromDB", job);

    res
      .status(HTTP_STATUS.CREATED)
      .json({ message: "Reaction added successfully" });
  }
}
