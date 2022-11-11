import { reactionService } from "@service/db/reaction-service";
import HTTP_STATUS from "http-status-codes";
import { ReactionCache } from "@service/redis/reaction-cache";
import { Response, Request } from "express";
import {
  IQueryReaction,
  IReactionDocumentResponse,
} from "@reaction/interfaces/reaction-interface";
import mongoose from "mongoose";

const reactionCache: ReactionCache = new ReactionCache();

export class Reactions {
  public async index(req: Request, res: Response): Promise<void> {
    const { postId } = req.params;

    let reactions: IReactionDocumentResponse[] = [];
    reactions = await reactionCache.getReactionsFromCache(postId);
    const query: IQueryReaction = {
      postId: new mongoose.Types.ObjectId(postId),
    };

    if (!reactions.length)
      reactions = await reactionService.getReactionsFromDB(query);
    res
      .status(HTTP_STATUS.OK)
      .json({ message: "All reactions", reactions, total: reactions.length });
  }

  public async getReactionPost(req: Request, res: Response): Promise<void> {
    const { postId, userId } = req.params;

    let reactions: IReactionDocumentResponse[] = [];
    reactions = await reactionCache.getReactionFromCache(postId, userId);
    const query: IQueryReaction = {
      postId: new mongoose.Types.ObjectId(postId),
      postReactor: new mongoose.Types.ObjectId(userId),
    };

    if (!reactions.length)
      reactions = await reactionService.getReactionsFromDB(query);
    res.status(HTTP_STATUS.OK).json({
      message: `Reaction by postId`,
      reactions,
      total: reactions.length,
    });
  }

  public async getReactionsForUserPost(
    req: Request,
    res: Response
  ): Promise<void> {
    const { userId } = req.params;

    let reactions: IReactionDocumentResponse[] = [];
    reactions = await reactionCache.getReactionsByUserIdFromCache(userId);
    const query: IQueryReaction = {
      postReactor: new mongoose.Types.ObjectId(userId),
    };

    if (!reactions.length)
      reactions = await reactionService.getReactionsFromDB(query);
    res.status(HTTP_STATUS.OK).json({
      message: "Reaction by userId",
      reactions,
      total: reactions.length,
    });
  }
}
