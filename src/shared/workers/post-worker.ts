import { IPostDocument } from "@post/interfaces/post-interface";
import { postService } from "./../services/db/post-service";
import { DoneCallback, Job } from "bull";
import { config } from "@root/config";

const log = config.LOG.getInstance("PostWorker");

class PostWorker {
  addPostToDB(job: Job, done: DoneCallback): void {
    try {
      const postData: IPostDocument = job.data.value;
      const userId = job.data.key;
      postService.syncPostToDB(userId, postData);
      job.progress(100);
      done(null, job.data);
      log.info(`Written postId: ${postData._id} to mongodb database`);
    } catch (error) {
      log.error(error);
      done(error as Error);
    }
  }

  deletePostFromDB(job: Job, done: DoneCallback) {
    try {
      const userId = job.data.userId;
      const postId = job.data.postId;
      postService.deletePostFromDatabase(userId, postId);
      job.progress(100);
      done(null, job.data);
    } catch (error) {
      log.error(error);
      done(error as Error);
    }
  }

  updatePostInDB(job: Job, done: DoneCallback) {
    try {
      const { postId, postData } = job.data;
      postService.updatePost(postId, postData);
      job.progress(100);
      done(null, job.data);
    } catch (error) {
      log.error(error);
      done(error as Error);
    }
  }
}

export const postWorker: PostWorker = new PostWorker();
