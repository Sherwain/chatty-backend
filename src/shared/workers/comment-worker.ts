import { DoneCallback, Job } from "bull";
import { ObjectId } from "mongodb";
import { config } from "@root/config";
import { commentService } from "@service/db/comment-service";
import { ICommentDocument } from "@comment/interfaces/comment-interface";

const log = config.LOG.getInstance("CommentWorker");

class CommentWorker {
  addCommentToDB(job: Job, done: DoneCallback): void {
    try {
      const commentDoc: ICommentDocument = job.data.commentDoc;
      commentService.saveCommentToDB(commentDoc);
      job.progress(100);
      done(null, job.data);
      log.info(`Written comment: ${commentDoc._id} to mongodb database`);
    } catch (error) {
      log.error(error);
      done(error as Error);
    }
  }

  deleteCommentFromDB(job: Job, done: DoneCallback) {
    try {
      const commentDoc: ICommentDocument = job.data.commentDoc;
      commentService.deleteCommentFromDB(commentDoc);
      job.progress(100);
      done(null, job.data);
    } catch (error) {
      log.error(error);
      done(error as Error);
    }
  }

  updateCommentInDB(job: Job, done: DoneCallback) {
    try {
      const commentDoc: ICommentDocument = job.data.commentDoc;
      commentService.updateCommentInDB(
        new ObjectId(commentDoc._id!),
        commentDoc.comment!
      );
      job.progress(100);
      done(null, job.data);
    } catch (error) {
      log.error(error);
      done(error as Error);
    }
  }
}

export const commentWorker: CommentWorker = new CommentWorker();
