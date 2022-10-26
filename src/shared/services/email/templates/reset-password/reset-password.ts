import fs from "fs";
import ejs from "ejs";
import { IResetPasswordParams } from "@user/interfaces/user-interface";

class ResetPassword {
  public resetPassword(templateParams: IResetPasswordParams): string {
    return ejs.render(
      fs.readFileSync(__dirname + "/reset-password.ejs", "utf8"),
      {
        username: templateParams.username,
        email: templateParams.email,
        ipAddress: templateParams.ipAddress,
        date: templateParams.date,
        imageUrl:
          "https://w7.pngwing.com/pngs/120/102/png-transparent-padlock-logo-computer-icons-padlock-technic-logo-password-lock.png",
      }
    );
  }
}

export const resetPassword: ResetPassword = new ResetPassword();
