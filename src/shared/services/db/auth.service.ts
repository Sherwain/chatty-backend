import { AuthModel } from "@auth/models/auth.schema";
import { IAuthDocument } from "@auth/interfaces/auth.interface";

class AuthService {
  public async createAuthUser(data: IAuthDocument): Promise<void> {
    await AuthModel.create(data);
  }

  public async getUserByUsernameOrEmail(
    username: string,
    email: string
  ): Promise<IAuthDocument> {
    const query = {
      $or: [{ username: username }, { email: email.toLocaleLowerCase }],
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
}

export const authService: AuthService = new AuthService();
