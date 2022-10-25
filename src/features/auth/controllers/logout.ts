import HTTP_STATUS from "http-status-codes";
import { Response, Request } from "express";

export class Logout {
  async logout(req: Request, res: Response): Promise<void> {
    req.session = null;
    res
      .status(HTTP_STATUS.OK)
      .json({ message: "Successfully logged out", user: {}, token: "" });
  }
}
