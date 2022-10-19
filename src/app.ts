import express, { Express } from "express";
import { ChattyServer } from "./setup-server";
import databaseConnection from "./setup-database";
import { config } from "./config";

class Application {
  public initialize(): void {
    this.loadConfig();
    databaseConnection();
    const app: Express = express();
    const chattyServer: ChattyServer = new ChattyServer(app);
    chattyServer.start();
  }

  private loadConfig(): void {
    config.validateConfig();
  }
}

const application: Application = new Application();
application.initialize();
