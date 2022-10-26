import { config } from "@root/config";
import Logger from "bunyan";
import { createClient } from "redis";

export type RedisClient = ReturnType<typeof createClient>;

export abstract class BaseCache {
  client: RedisClient;
  LOG: Logger;
  constructor(cacheName: string) {
    this.client = createClient({ url: config.REDIS_HOST });
    this.LOG = config.LOG.getInstance(cacheName);
  }

  private cacheError(): void {
    this.client.on("error", (error: unknown) => {
      this.LOG.error(error);
    });
  }
}
