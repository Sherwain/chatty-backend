import { IReactionJob } from "@reaction/interfaces/reaction-interface";
import { BaseQueue } from "@service/queues/base-queue";
import { reactionWorker } from "@worker/reaction-worker";

class ReactionQueue extends BaseQueue {
  constructor() {
    super("reaction");
    this.processJob("addReactionToDB", 5, reactionWorker.addReactionToDB);
    this.processJob(
      "deleteReactionFromDB",
      5,
      reactionWorker.deleteReactionFromDB
    );
    this.processJob("getReactionInDB", 5, reactionWorker.getReactionInDB);
  }

  public addReactionJob(name: string, data: IReactionJob): void {
    this.addJob(name, data);
  }

  public deleteReactionJob(name: string, data: any): void {
    this.addJob(name, data);
  }

  public getReactionJob(name: string, data: any) {
    this.addJob(name, data);
  }
}

export const reactionQueue: ReactionQueue = new ReactionQueue();
