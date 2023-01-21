import { Comment } from "@comment/controllers/comment";
import { authMiddleware } from "@global/helpers/auth-middleware";
import express, { Router } from "express";

class CommentRoutes {
  private router: Router;

  constructor() {
    this.router = express.Router();
  }

  routes(): Router {
    this.router.post(
      "/post/comment",
      authMiddleware.checkAUthentication,
      Comment.prototype.create
    );

    // this.router.delete(
    //   "/post/reaction/:postId/:reaction",
    //   authMiddleware.checkAUthentication,
    //   DeleteReaction.prototype.delete
    // );

    // get a single comment
    this.router.get(
      "/post/comment/:commentId",
      authMiddleware.checkAUthentication,
      Comment.prototype.getComment
    );

    // get comments from a post for a user
    this.router.get(
      "/post/comment/:postId/:userId",
      authMiddleware.checkAUthentication,
      Comment.prototype.getCommentsForUserPost
    );

    // all comments for a user
    this.router.get(
      "/post/comments/:userId",
      authMiddleware.checkAUthentication,
      Comment.prototype.getCommentsForUser
    );

    // // all comments for a post
    this.router.get(
      "/post/comments/all/:postId",
      authMiddleware.checkAUthentication,
      Comment.prototype.getCommentsForPost
    );

    return this.router;
  }
}

export const commentRoutes: CommentRoutes = new CommentRoutes();
