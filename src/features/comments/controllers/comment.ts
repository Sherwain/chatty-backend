import { IQueryComment } from "./../interfaces/comment-interface";
import { ObjectId } from "mongodb";
import { Response, Request } from "express";
import HTTP_STATUS from "http-status-codes";
import { CommentSchema } from "@comment/joi-schemas/comment";
import { ICommentDocumentResponse } from "@comment/interfaces/comment-interface";
import { JoiValidation } from "@global/decorators/joi-validator.decorators";
import {
  ICommentDocument,
  ICommentJob,
} from "@comment/interfaces/comment-interface";
import { CommentCache } from "@service/redis/comment-cache";
import { commentQueue } from "@service/queues/comment-queue";
import mongoose from "mongoose";
import { commentService } from "@service/db/comment-service";
import { IUserDocument } from "@user/interfaces/user-interface";
import { UserCache } from "@service/redis/user-cache";
import { userService } from "@service/db/user-service";

const commentCache: CommentCache = new CommentCache();
const userCache: UserCache = new UserCache();

export class Comment {
  @JoiValidation(CommentSchema)
  public async create(req: Request, res: Response): Promise<void> {
    const { postCreator, postId, comment } = req.body;
    const commentDoc: ICommentDocument = {
      _id: new ObjectId(),
      postId: new ObjectId(postId),
      postCreator: new ObjectId(postCreator),
      postCommenter: new ObjectId(req.currentUser!.userId),
      comment,
      createdAt: Date.now(),
    } as unknown as ICommentDocument;

    await commentCache.savePostCommentToCache(commentDoc, req.currentUser!.uId);
    const job: ICommentJob = { commentDoc } as ICommentJob;
    commentQueue.addCommentJob("addCommentToDB", job);

    res
      .status(HTTP_STATUS.CREATED)
      .json({ message: "Comment added successfully" });
  }

  // get all comments for a post
  public async getCommentsForPost(req: Request, res: Response): Promise<void> {
    const { postId } = req.params;
    let comments: ICommentDocumentResponse[] = [];
    comments = await commentCache.getCommentsFromCache(postId);
    const query: IQueryComment = {
      postId: new mongoose.Types.ObjectId(postId),
    };

    if (!comments.length)
      comments = await commentService.getCommentsFromDB(query, {
        createdAt: -1,
      });
    res.status(HTTP_STATUS.OK).json({
      message: "All comments",
      comments: comments,
      total: comments.length,
    });
  }

  // get comments from a post for a user
  public async getCommentsForUserPost(
    req: Request,
    res: Response
  ): Promise<void> {
    const { postId, userId } = req.params;

    const cachedUser: IUserDocument =
      ((await userCache.getUserFromCache(
        req.currentUser!.userId
      )) as IUserDocument) ||
      ((await userService.getUserById(
        req.currentUser!.userId
      )) as IUserDocument);

    let comments: ICommentDocumentResponse[] = [];
    comments = await commentCache.getCommentsForUserPostFromCache(
      postId,
      cachedUser.uId!
    );
    const query: IQueryComment = {
      postId: new mongoose.Types.ObjectId(postId),
      postCommenter: new mongoose.Types.ObjectId(userId),
    };

    if (!comments.length)
      comments = await commentService.getCommentsFromDB(query, {
        createdAt: -1,
      });
    res.status(HTTP_STATUS.OK).json({
      message: `Comment by postId`,
      comments: comments,
      total: comments.length,
    });
  }

  // all comments for a user
  public async getCommentsForUser(req: Request, res: Response): Promise<void> {
    const { userId } = req.params;

    let comments: ICommentDocumentResponse[] = [];
    comments = await commentCache.getCommentsForUserFromCache(
      userId,
      req.currentUser!.uId
    );
    const query: IQueryComment = {
      postCommenter: new mongoose.Types.ObjectId(userId),
    };

    if (!comments.length)
      comments = await commentService.getCommentsFromDB(query, {
        createdAt: -1,
      });
    res.status(HTTP_STATUS.OK).json({
      message: "Comment by userId",
      comments,
      total: comments.length,
    });
  }

  // get single comment
  public async getComment(req: Request, res: Response): Promise<void> {
    const { commentId } = req.params;

    let comments: ICommentDocumentResponse[] = [];
    comments = await commentCache.getCommentFromCache(commentId);
    const query: IQueryComment = {
      _id: new mongoose.Types.ObjectId(commentId),
    };

    if (!comments.length)
      comments = await commentService.getCommentsFromDB(query, {
        createdAt: -1,
      });
    res.status(HTTP_STATUS.OK).json({
      message: "Single comment",
      comments,
      total: comments.length,
    });
  }

  public async delete(req: Request, res: Response): Promise<void> {
    const { commentId, postId } = req.params;

    const commentDoc: ICommentDocument = {
      _id: new ObjectId(commentId),
      postId: new ObjectId(postId),
    } as unknown as ICommentDocument;

    await commentCache.deleteCommentFromCache(commentDoc);
    const job: ICommentJob = { commentDoc };
    commentQueue.deleteCommentJob("deleteCommentFromDB", job);

    res
      .status(HTTP_STATUS.CREATED)
      .json({ message: "Comment deleted successfully" });
  }

  public async update(req: Request, res: Response): Promise<void> {
    const { commentId, comment } = req.params;

    const commentDoc: ICommentDocument = {
      _id: commentId,
      comment: comment,
    } as unknown as ICommentDocument;

    await commentCache.deleteCommentFromCache(commentDoc);
    const job: ICommentJob = { commentDoc };
    commentQueue.deleteCommentJob("deleteCommentFromDB", job);

    res
      .status(HTTP_STATUS.CREATED)
      .json({ message: "Comment updated successfully" });
  }
}
