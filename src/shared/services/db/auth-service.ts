import { AuthModel } from "@auth/models/auth-schema";
import { IAuthDocument } from "@auth/interfaces/auth-interface";
import mongoose from "mongoose";

class AuthService {
  public async createAuthUser(data: IAuthDocument): Promise<void> {
    await AuthModel.create(data);
  }

  public async getUserByUsernameOrEmail(
    username: string,
    email: string
  ): Promise<IAuthDocument> {
    const query = {
      $or: [{ username: username }, { email: email.toLowerCase() }],
    };
    const user: IAuthDocument = (await AuthModel.findOne(
      query
    )) as IAuthDocument;
    return user;
  }

  public async getUserByUsername(username: string): Promise<IAuthDocument> {
    const user: IAuthDocument = (await AuthModel.findOne({
      username: username,
    })) as IAuthDocument;
    return user;
  }

  public async getAuthUserByToken(token: string): Promise<IAuthDocument> {
    const user: IAuthDocument = (await AuthModel.findOne({
      passwordResetToken: token,
    })) as IAuthDocument;
    return user;
  }

  public async getAuthUserByEmail(email: string): Promise<IAuthDocument> {
    const user: IAuthDocument = (await AuthModel.findOne({
      email: email.toLowerCase(),
    })) as IAuthDocument;
    return user;
  }

  public async updatePasswordToken(
    authId: string,
    token: string,
    tokenExpiration: number
  ): Promise<void> {
    await AuthModel.updateOne(
      {
        _id: new mongoose.Types.ObjectId(authId),
      },
      {
        passwordResetToken: token,
        passwordResetExpires: tokenExpiration,
      }
    );
  }

  public async updatePassword(authId: string, password: string): Promise<void> {
    await AuthModel.updateOne(
      {
        _id: new mongoose.Types.ObjectId(authId),
      },
      {
        password: password,
      }
    );
  }
}

export const authService: AuthService = new AuthService();
