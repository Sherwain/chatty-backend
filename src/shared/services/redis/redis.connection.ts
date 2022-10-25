import Logger from "bunyan";
import { config } from "@root/config";
import { BaseCache } from "@service/redis/base.cache";

const LOG = config.LOG.getInstance("RedisConnection");

class RedisConnection extends BaseCache {
  constructor() {
    super("RedisConnection");
  }

  connect(): void {
    try {
      this.client
        .connect()
        .then((data) => {
          LOG.info("Connected to redis server!");
        })
        .catch((err) => {
          LOG.error("Error", err);
        });
    } catch (error) {
      LOG.error(error);
    }
  }
}

export const redisConnection: RedisConnection = new RedisConnection();
