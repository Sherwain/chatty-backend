import { IPostJobData } from "@post/interfaces/post-interface";
import { BaseQueue } from "@service/queues/base-queue";
import { postWorker } from "@worker/post-worker";

class PostQueue extends BaseQueue {
  constructor() {
    super("post");
    this.processJob("addPostToDB", 5, postWorker.addPostToDB);
    this.processJob("deletePostFromDB", 5, postWorker.deletePostFromDB);
    this.processJob("updatePostInDB", 5, postWorker.updatePostInDB);
  }

  public addPostJob(name: string, data: IPostJobData): void {
    this.addJob(name, data);
  }

  public deletePostJob(name: string, data: any): void {
    this.addJob(name, data);
  }

  public updatePostJob(name: string, data: any) {
    this.addJob(name, data);
  }
}

export const postQueue: PostQueue = new PostQueue();
