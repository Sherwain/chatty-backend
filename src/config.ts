import dotenv from "dotenv";
import bunyan from "bunyan";
import Logger from "bunyan";
import log from "./shared/globals/logger";

dotenv.config({});

class Config {
  public MONGODB: string | undefined;
  public MONGODB_USER: string | undefined;
  public MONGODB_PWD: string | undefined;
  public JWT_TOKEN: string | undefined;
  public NODE_ENV: string | undefined;
  public NODE_SERVER_PORT: string | undefined;
  public SECRET_KEY_ONE: string | undefined;
  public SECRET_KEY_TWO: string | undefined;
  public CLIENT_URL: string | undefined;
  public REDIS_PASSWORD: string | undefined;
  public REDIS_HOST: string | undefined;
  public REDIS_PORT: string | undefined;
  public LOG = log;

  constructor() {
    this.MONGODB = process.env.MONGODB;
    this.MONGODB_USER = process.env.MONGODB_USER;
    this.MONGODB_PWD = process.env.MONGODB_PWD;
    this.JWT_TOKEN = process.env.JWT_TOKEN;
    this.NODE_ENV = process.env.NODE_ENV;
    this.NODE_SERVER_PORT = process.env.NODE_SERVER_PORT;
    this.SECRET_KEY_ONE = process.env.SECRET_KEY_ONE;
    this.SECRET_KEY_TWO = process.env.SECRET_KEY_TWO;
    this.CLIENT_URL = process.env.CLIENT_URL;

    this.REDIS_PASSWORD = process.env.REDIS_PASSWORD;
    this.REDIS_HOST = process.env.REDIS_HOST;
    this.REDIS_PORT = process.env.REDIS_PORT;
  }

  public validateConfig(): void {
    for (const [key, value] of Object.entries(this)) {
      if (value === undefined) {
        throw new Error(`Configure ${key} is undefined`);
      }
    }
  }

  // public log = (function (name: string) {
  //   let logger: Logger;

  //   function createInstance(name: string): Logger {
  //     console.log("Creating instance of logger");
  //     return bunyan.createLogger({ name, level: "debug" });
  //   }

  //   return {
  //     getInstance: function (name: string): Logger {
  //       if (!logger) {
  //         logger = createInstance(name);
  //       }
  //       return logger;
  //     },
  //   };
  // })("");
}

export const config: Config = new Config();
