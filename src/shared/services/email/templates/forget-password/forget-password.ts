import fs from "fs";
import ejs from "ejs";

class ForgotPassword {
  public forgotPassword(username: string, resetLink: string): string {
    return ejs.render(
      fs.readFileSync(__dirname + "/forgot-password.ejs", "utf8"),
      {
        username,
        resetLink,
        imageUrl:
          "https://w7.pngwing.com/pngs/120/102/png-transparent-padlock-logo-computer-icons-padlock-technic-logo-password-lock.png",
      }
    );
  }
}

export const forgotPassword: ForgotPassword = new ForgotPassword();
