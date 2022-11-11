import { IReactionDocument } from "@reaction/interfaces/reaction-interface";

import { DoneCallback, Job } from "bull";
import { config } from "@root/config";
import { reactionService } from "@service/db/reaction-service";

const log = config.LOG.getInstance("ReactionWorker");

class ReactionWorker {
  addReactionToDB(job: Job, done: DoneCallback): void {
    try {
      const reactionDoc: IReactionDocument = job.data.reactionDoc;
      reactionService.saveReactionToDB(reactionDoc);
      job.progress(100);
      done(null, job.data);
      log.info(`Written reaction: ${reactionDoc._id} to mongodb database`);
    } catch (error) {
      log.error(error);
      done(error as Error);
    }
  }

  deleteReactionFromDB(job: Job, done: DoneCallback) {
    try {
      const reactionDoc: IReactionDocument = job.data.reactionDoc;
      reactionService.deleteReactionFromDB(reactionDoc);
      job.progress(100);
      done(null, job.data);
    } catch (error) {
      log.error(error);
      done(error as Error);
    }
  }

  getReactionInDB(job: Job, done: DoneCallback) {
    try {
      const { postId } = job.data;
      reactionService.getReactionsFromDB(postId);
      job.progress(100);
      done(null, job.data);
    } catch (error) {
      log.error(error);
      done(error as Error);
    }
  }
}

export const reactionWorker: ReactionWorker = new ReactionWorker();
