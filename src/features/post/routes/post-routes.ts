import { UpdatePost } from "./../controllers/update-post";
import { Post } from "../controllers/create-post";
import express, { Router } from "express";
import { authMiddleware } from "@global/helpers/auth-middleware";
import { Posts } from "@post/controllers/posts";
import { DeletePost } from "@post/controllers/delete-post";

// const router = express.Router();

class PostRoutes {
  private router: Router;
  constructor() {
    this.router = express.Router();
  }
  routes(): Router {
    this.router.get(
      "/posts/:page",
      authMiddleware.checkAUthentication,
      Posts.prototype.posts
    );
    this.router.get(
      "/posts-image/:page",
      authMiddleware.checkAUthentication,
      Posts.prototype.postsWithImage
    );

    this.router.put(
      "/post/:postId",
      authMiddleware.checkAUthentication,
      UpdatePost.prototype.update
    );

    this.router.put(
      "/post-image/:postId",
      authMiddleware.checkAUthentication,
      UpdatePost.prototype.updateWithImage
    );

    this.router.post(
      "/post",
      authMiddleware.checkAUthentication,
      Post.prototype.post
    );
    this.router.post(
      "/post-image",
      authMiddleware.checkAUthentication,
      Post.prototype.postWithImage
    );

    this.router.delete(
      "/post-delete/:postId",
      authMiddleware.checkAUthentication,
      DeletePost.prototype.deletePost
    );
    return this.router;
  }
}

export const postRoutes: PostRoutes = new PostRoutes();
