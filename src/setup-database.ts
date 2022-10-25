import { redisConnection } from "./shared/services/redis/redis.connection";
import mongoose from "mongoose";
import { config } from "./config";

const LOG = config.LOG.getInstance("database");

export default () => {
  const DB_URL: string = `mongodb+srv://${config.MONGODB_USER}:${config.MONGODB_PWD}@mongodb-cluster.ltlxbyn.mongodb.net/${config.MONGODB}?retryWrites=true&w=majority`;
  const connect = () => {
    mongoose
      .connect(DB_URL)
      .then(() => {
        LOG.info("Connected to mongoDB database successfully!");
        redisConnection.connect();
      })
      .catch((e) => {
        LOG.error("Error connecting to database", e);
        return process.exit(1);
      });
  };
  connect();

  mongoose.connection.on("disconnected", connect);
};
