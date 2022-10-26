import nodemailer from "nodemailer";
import Mail from "nodemailer/lib/mailer";
import sendGridMail from "@sendGrid/mail";
import { config } from "@root/config";

interface IMailOptions {
  from: string;
  to: string;
  subject: string;
  html: string;
}

const log = config.LOG.getInstance("MailServer");

sendGridMail.setApiKey(config.SENDGRID_API_KEY!);

class MailTransport {
  public async sendEmail(
    receiver: string,
    subject: string,
    body: string
  ): Promise<void> {
    if (config.NODE_ENV === "test" || config.NODE_ENV === "dev") {
      this.developmentEmailSender(receiver, subject, body);
    } else {
      this.productionEmailSender(receiver, subject, body);
    }
  }

  private async developmentEmailSender(
    receiveEmail: string,
    subject: string,
    body: string
  ): Promise<void> {
    // create reusable transporter object using the default SMTP transport
    let transporter: Mail = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: config.SENDER_EMAIL,
        pass: config.SENDER_EMAIL_PASSWORD,
      },
    });

    const mailOptions: IMailOptions = {
      from: `Chatty App <${config.SENDER_EMAIL}>`,
      to: receiveEmail,
      subject,
      html: body,
    };

    try {
      // send mail with defined transport object
      await transporter.sendMail(mailOptions);
      log.info("Development email sent successfully");
    } catch (error) {
      log.error("Sending email failed", error);
    }
  }

  private async productionEmailSender(
    receiveEmail: string,
    subject: string,
    body: string
  ): Promise<void> {
    const mailOptions: IMailOptions = {
      from: `Chatty App <${config.SENDER_EMAIL}>`,
      to: receiveEmail,
      subject,
      html: body,
    };

    // send mail with defined transport object
    try {
      // send mail with defined transport object
      await sendGridMail.send(mailOptions);
      log.info("Production email sent successfully");
    } catch (error) {
      log.error("Sending email failed", error);
    }
  }
}

export const mailTransport: MailTransport = new MailTransport();
