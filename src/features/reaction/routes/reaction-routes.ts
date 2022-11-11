// import {  } from 'express';
import { authMiddleware } from "@global/helpers/auth-middleware";
import { Reaction } from "@reaction/controllers/add-reaction";
import { DeleteReaction } from "@reaction/controllers/delete-reaction";
import { Reactions } from "@reaction/controllers/reactions";
import express, { Router } from "express";

class ReactionRoutes {
  private router: Router;

  constructor() {
    this.router = express.Router();
  }

  routes(): Router {
    this.router.post(
      "/post/reaction",
      authMiddleware.checkAUthentication,
      Reaction.prototype.create
    );

    this.router.delete(
      "/post/reaction/:postId/:reaction",
      authMiddleware.checkAUthentication,
      DeleteReaction.prototype.delete
    );

    // single reaction single post
    this.router.get(
      "/post/reaction/:postId/:userId",
      authMiddleware.checkAUthentication,
      Reactions.prototype.getReactionPost
    );

    // all reactions for a user
    this.router.get(
      "/post/reactions/:userId",
      authMiddleware.checkAUthentication,
      Reactions.prototype.getReactionsForUserPost
    );

    // all reactions for a post
    this.router.get(
      "/post/reactions/all/:postId",
      authMiddleware.checkAUthentication,
      Reactions.prototype.index
    );

    return this.router;
  }
}

export const reactionRoute: ReactionRoutes = new ReactionRoutes();
