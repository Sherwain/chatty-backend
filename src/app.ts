import express, { Express } from "express";
import { ChattyServer } from "@root/setup-server";
import databaseConnection from "@root/setup-database";
import { config } from "@root/config";

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
    config.cloudinaryConfig();
  }
}

const application: Application = new Application();
application.initialize();
