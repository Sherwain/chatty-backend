import { Login } from "./../controllers/login";
import { SignUp } from "../controllers/sign-up";
import express, { Router } from "express";
import { Logout } from "@auth/controllers/logout";
import { Password } from "@auth/controllers/password";

class AuthRoutes {
  private router: Router;

  constructor() {
    this.router = express.Router();
  }

  public routes(): Router {
    this.router.post("/auth/signup", SignUp.prototype.create);
    this.router.post("/auth/login", Login.prototype.login);
    this.router.post("/auth/forgot-password", Password.prototype.resetPassword);
    this.router.post(
      "/auth/reset-password/:token",
      Password.prototype.updatePassword
    );

    this.router.get("/auth/getData", SignUp.prototype.getData);
    return this.router;
  }

  public logoutRoute(): Router {
    this.router.get("/auth/logout", Logout.prototype.logout);
    return this.router;
  }
}

export const authRoutes: AuthRoutes = new AuthRoutes();
