import publicIP from "ip";
import HTTP_STATUS from "http-status-codes";
import { Response, Request } from "express";
import { config } from "@root/config";
import { JoiValidation } from "@global/decorators/joi-validator.decorators";
import { EmailSchema, PasswordSchema } from "@auth/joi-schemas/password";
import { authService } from "@service/db/auth-service";
import { BadRequestError } from "@global/helpers/error-handler";
import crypto from "crypto";
import { emailQueue } from "@service/queues/email-queue";
import { forgotPassword } from "@service/email/templates/forget-password/forget-password";
import { IAuthDocument } from "@auth/interfaces/auth-interface";
import moment from "moment";
import { IResetPasswordParams } from "@user/interfaces/user-interface";
import { resetPassword } from "@service/email/templates/reset-password/reset-password";

export class Password {
  @JoiValidation(EmailSchema)
  public async resetPassword(req: Request, res: Response): Promise<void> {
    const { email } = req.body;
    const user: IAuthDocument = await authService.getAuthUserByEmail(email);
    if (!user) throw new BadRequestError("User does not exist!");

    const token: string = (
      await Promise.resolve(crypto.randomBytes(20))
    ).toString("hex");
    await authService.updatePasswordToken(
      user._id.toString(),
      token,
      Date.now() * 60 * 60 * 1000 // 1 hr
    );
    const resetLink = `${config.CLIENT_URL}/reset-password?token=${token}`;
    const body: string = forgotPassword.forgotPassword(
      user.username!,
      resetLink
    );
    emailQueue.addEmailJob("ForgotPasswordEmail", {
      body,
      receiver: "astrid.bode76@ethereal.email",
      subject: "Reset your password",
    });

    res
      .status(HTTP_STATUS.OK)
      .json({ message: "Reset email sent successfully" });
  }

  @JoiValidation(PasswordSchema)
  public async updatePassword(req: Request, res: Response): Promise<void> {
    const { password, confirmPassword } = req.body;
    const { token } = req.params;
    const user: IAuthDocument = await authService.getAuthUserByToken(token);
    if (!user) throw new BadRequestError("Invalid token");

    if (Date.now() > user.passwordResetExpires!) {
      throw new BadRequestError("Token expired");
    }

    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.password = password;
    await user.save();

    const templateParams: IResetPasswordParams = {
      username: user.username!,
      email: user.email!,
      ipAddress: publicIP.address(),
      date: moment().format("MM/DD/YYYY HH:mm"),
    };

    const body: string = resetPassword.resetPassword(templateParams);

    emailQueue.addEmailJob("ForgotPasswordEmail", {
      body: body,
      receiver: user.email,
      subject: "Reset password Confirmation",
    });

    res
      .status(HTTP_STATUS.OK)
      .json({ message: "Password successfully updated." });
  }
}
