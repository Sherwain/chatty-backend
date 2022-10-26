import { AuthPayload } from "@auth/interfaces/auth-interface";
import { NotAuthorizedError } from "./error-handler";
import { config } from "@root/config";
import { Request, Response, NextFunction } from "express";
import JWT from "jsonwebtoken";

export class AuthMiddleware {
  public verifyUser(req: Request, res: Response, next: NextFunction): void {
    if (!req.session?.jwt) {
      throw new NotAuthorizedError(
        "Token is not available. Please log in again"
      );
    }
    try {
      const jwtData: AuthPayload = JWT.verify(
        req.session.jwt,
        config.JWT_TOKEN!
      ) as AuthPayload;
      req.currentUser = jwtData;
    } catch (error) {
      throw new NotAuthorizedError("Token is invalid. Please log in again");
    }
    next();
  }

  public checkAUthentication(
    req: Request,
    res: Response,
    next: NextFunction
  ): void {
    if (!req.currentUser) {
      throw new NotAuthorizedError(
        "Authentication is required to access this resource. Please log in!"
      );
    }
    next();
  }
}

export const authMiddleware: AuthMiddleware = new AuthMiddleware();
