import { authMiddleware } from "./../../../shared/globals/helpers/auth-middleware";
import { Login } from "./../controllers/login";
import { SignUp } from "../controllers/sign-up";
import express, { Router } from "express";
import { Logout } from "@auth/controllers/logout";
import { CurrentUser } from "@auth/controllers/current-user";

class AuthRoutes {
  private router: Router;

  constructor() {
    this.router = express.Router();
  }

  public routes(): Router {
    this.router.post("/auth/signup", SignUp.prototype.create);
    this.router.post("/auth/login", Login.prototype.login);

    // this.router.get(
    //   "/auth/current-user",
    //   authMiddleware.verifyUser,
    //   authMiddleware.checkAUthentication,
    //   CurrentUser.prototype.currentUser
    // );

    this.router.get("/auth/getData", SignUp.prototype.getData);
    return this.router;
  }

  public logoutRoute(): Router {
    this.router.get("/auth/logout", Logout.prototype.logout);
    return this.router;
  }
}

export const authRoutes: AuthRoutes = new AuthRoutes();
