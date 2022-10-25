import { IUserDocument } from "@user/interfaces/user.interface";
import { userService } from "@service/db/user.service";
import { BadRequestError } from "@global/helpers/error-handler";
import { IAuthDocument } from "@auth/interfaces/auth.interface";
import { authService } from "@service/db/auth.service";
import HTTP_STATUS from "http-status-codes";
import { LoginSchema } from "@auth/joi-schemas/signin";
import { AuthModel } from "@auth/models/auth.schema";
import { JoiValidation } from "@global/decorators/joi-validator.decorators";
import { config } from "@root/config";
import { UserCache } from "@service/redis/user.cache";
import Logger from "bunyan";
import { Request, Response } from "express";
import JWT from "jsonwebtoken";

const LOG: Logger = config.LOG.getInstance("server");

export class Login {
  @JoiValidation(LoginSchema)
  async login(req: Request, res: Response): Promise<void> {
    const { username, password } = req.body;
    const authUser: IAuthDocument = await authService.getUserByUsername(
      username
    );
    if (!authUser) {
      throw new BadRequestError("Invalid credentials");
    }

    const matchedPassword: boolean = await authUser.comparePassword(password);
    if (!matchedPassword) throw new BadRequestError("Invalid credentials");

    const user: IUserDocument = await userService._getUserByAuthId(
      authUser._id.toString()
    );

    const userJWT: string = JWT.sign(
      {
        userId: user._id,
        uId: authUser.uId,
        username: authUser.username,
        email: authUser.email,
        avatarColor: authUser.avatarColor,
      },
      config.JWT_TOKEN!
    );

    req.session = { jwt: userJWT };
    res.status(HTTP_STATUS.OK).json({
      message: "User login successfully",
      user: user,
      token: userJWT,
    });
  }
}
