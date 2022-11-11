import HTTP_STATUS from "http-status-codes";
import {
  IReactionDocument,
  IReactionJob,
} from "@reaction/interfaces/reaction-interface";
import { ObjectId } from "mongodb";
import { JoiValidation } from "@global/decorators/joi-validator.decorators";
import { ReactionSchema } from "@reaction/joi-schemas/reactions";
import { Response, Request } from "express";
import { ReactionCache } from "@service/redis/reaction-cache";
import { reactionQueue } from "@service/queues/reaction-queue";
import { config } from "@root/config";

const reactionCache: ReactionCache = new ReactionCache();
const log = config.LOG.getInstance("server");

export class Reaction {
  @JoiValidation(ReactionSchema)
  public async create(req: Request, res: Response): Promise<void> {
    const { postCreator, postId, reaction } = req.body;
    const reactionDoc: IReactionDocument = {
      _id: new ObjectId(),
      reaction,
      postId: new ObjectId(postId),
      postCreator: new ObjectId(postCreator),
      postReactor: new ObjectId(req.currentUser!.userId),
      createdAt: Date.now(),
    } as unknown as IReactionDocument;

    await reactionCache.savePostReactionToCache(reactionDoc);
    const job: IReactionJob = { reactionDoc };
    reactionQueue.addReactionJob("addReactionToDB", job);

    res
      .status(HTTP_STATUS.CREATED)
      .json({ message: "Reaction added successfully" });
  }
}
