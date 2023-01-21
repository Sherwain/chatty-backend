import { ICommentJob } from "@comment/interfaces/comment-interface";
import { IReactionJob } from "@reaction/interfaces/reaction-interface";
import { BaseQueue } from "@service/queues/base-queue";
import { commentWorker } from "@worker/comment-worker";

class CommentQueue extends BaseQueue {
  constructor() {
    super("comment");
    this.processJob("addCommentToDB", 5, commentWorker.addCommentToDB);
    this.processJob(
      "deleteCommentFromDB",
      5,
      commentWorker.deleteCommentFromDB
    );
    this.processJob("updateCommentInDB", 5, commentWorker.updateCommentInDB);
  }

  public addCommentJob(name: string, data: ICommentJob): void {
    this.addJob(name, data);
  }

  public deleteCommentJob(name: string, data: any): void {
    this.addJob(name, data);
  }

  public updateCommentJob(name: string, data: any) {
    this.addJob(name, data);
  }
}

export const commentQueue: CommentQueue = new CommentQueue();
