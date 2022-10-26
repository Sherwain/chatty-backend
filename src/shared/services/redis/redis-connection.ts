import { config } from "@root/config";
import { BaseCache } from "@service/redis/base-cache";

const log = config.LOG.getInstance("RedisConnection");

class RedisConnection extends BaseCache {
  constructor() {
    super("RedisConnection");
  }

  connect(): void {
    try {
      this.client
        .connect()
        .then((data) => {
          log.info("Connected to redis server!");
        })
        .catch((err) => {
          log.error("Error", err);
        });
    } catch (error) {
      log.error(error);
    }
  }
}

export const redisConnection: RedisConnection = new RedisConnection();
