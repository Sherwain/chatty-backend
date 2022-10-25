import { UserCache } from "@service/redis/user.cache";
import { userService } from "@service/db/user.service";
import { DoneCallback, Job } from "bull";
import { config } from "@root/config";

const LOG = config.LOG.getInstance("userWorker");

class UserWorker {
  async addUserToDB(job: Job, done: DoneCallback): Promise<void> {
    try {
      const value = job.data.value;
      await userService.addUserData(value);
      job.progress(100);
      done(null, job.data);
    } catch (error) {
      LOG.error(error);
      done(error as Error);
    }
  }

  async getUserFromCache(job: Job, done: DoneCallback): Promise<void> {
    try {
      const value = job.data.value;
      UserCache;
    } catch (error) {}
  }
}

export const userWorker: UserWorker = new UserWorker();
