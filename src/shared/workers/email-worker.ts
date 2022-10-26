import { DoneCallback, Job } from "bull";
import { config } from "@root/config";
import { mailTransport } from "@service/email/mail-transport";

const LOG = config.LOG.getInstance("EmailWorker");

class EmailWorker {
  async sendEmail(job: Job, done: DoneCallback): Promise<void> {
    try {
      const { receiver, subject, body } = job.data;
      await mailTransport.sendEmail(receiver, subject, body);
      job.progress(100);
      done(null, job.data);
    } catch (error) {
      LOG.error(error);
      done(error as Error);
    }
  }
}

export const emailWorker: EmailWorker = new EmailWorker();
