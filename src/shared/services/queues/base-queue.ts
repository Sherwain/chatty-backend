import { IAuthJob } from "@auth/interfaces/auth-interface";
import { createAdapter } from "@socket.io/redis-adapter";
import Queue, { Job } from "bull";
import { config } from "@root/config";
import { createBullBoard } from "@bull-board/api";
import { BullAdapter } from "@bull-board/api/bullAdapter";
import { ExpressAdapter } from "@bull-board/express";
import Logger from "bunyan";
import { IEmailJob } from "@user/interfaces/user-interface";

let bullAdapters: BullAdapter[] = [];

export let serverAdapter: ExpressAdapter;

type IBaseJobData = IAuthJob | IEmailJob;

export abstract class BaseQueue {
  queue: Queue.Queue;
  LOG: Logger;

  constructor(queueName: string) {
    this.queue = new Queue(queueName, `${config.REDIS_HOST}`);
    bullAdapters.push(new BullAdapter(this.queue));
    bullAdapters = [...new Set(bullAdapters)];
    serverAdapter = new ExpressAdapter();
    serverAdapter.setBasePath("/queues");

    this.LOG = config.LOG.getInstance(`${queueName}Queue`);
    createBullBoard({
      queues: bullAdapters,
      serverAdapter,
    });

    this.queue.on("completed", (job: Job) => {
      job.remove();
    });

    this.queue.on("global:completed", (jobId: string) => {
      this.LOG.info(`Job ${jobId} completed`);
    });

    this.queue.on("global:stalled", (jobId: string) => {
      this.LOG.info(`Job ${jobId} is stalled`);
    });
  }

  protected addJob(name: string, data: IBaseJobData): void {
    this.queue.add(name, data, {
      attempts: 3,
      backoff: { type: "fixed", delay: 5000 },
    });
  }

  protected processJob(
    name: string,
    concurrency: number,
    callback: Queue.ProcessCallbackFunction<void>
  ): void {
    this.queue.process(name, concurrency, callback);
  }
}
