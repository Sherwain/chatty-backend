import { authService } from "@service/db/auth.service";
import { DoneCallback, Job } from "bull";
import { config } from "@root/config";

const LOG = config.LOG.getInstance("authWorker");

class AuthWorker {
  async addAuthUserToDB(job: Job, done: DoneCallback): Promise<void> {
    try {
      const value = job.data.value;
      await authService.createAuthUser(value);
      job.progress(100);
      done(null, job.data);
    } catch (error) {
      LOG.error(error);
      done(error as Error);
    }
  }
}

export const authWorker: AuthWorker = new AuthWorker();
