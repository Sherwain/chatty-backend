import {
  CustomerError,
  IErrorResponse,
} from "./shared/globals/helpers/error-handler";
import {
  Application,
  json,
  urlencoded,
  Response,
  Request,
  NextFunction,
} from "express";
import http from "http";
import hpp from "hpp";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import cookieSession from "cookie-session";
import HTTP_STATUS from "http-status-codes";
import { Server } from "socket.io";
import { createClient } from "redis";
import { createAdapter } from "@socket.io/redis-adapter";
import "express-async-errors";
import { config } from "./config";
import AppRoutes from "./routes";

const LOG = config.LOG.getInstance("server");
const SERVER_PORT = 3000;

export class ChattyServer {
  private app: Application;

  constructor(app: Application) {
    this.app = app;
  }

  public start(): void {
    this.securityMiddleware();
    this.standardMiddleware();
    this.routeMiddleware();
    this.globalHandler();
    this.startServer();
  }

  private securityMiddleware(): void {
    this.app.use(
      cookieSession({
        name: "session",
        keys: [config.SECRET_KEY_ONE!, config.SECRET_KEY_TWO!],
        maxAge: 1000 * 60 * 60 * 24 * 7,
        secure: config.NODE_ENV !== "dev",
      })
    );

    this.app.use(hpp());
    this.app.use(helmet());
    this.app.use(
      cors({
        origin: config.CLIENT_URL,
        credentials: true,
        optionsSuccessStatus: 200,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTION"],
      })
    );
  }

  private standardMiddleware(): void {
    this.app.use(compression());
    this.app.use(json({ limit: "50mb" }));
    this.app.use(urlencoded({ extended: true, limit: "50mb" }));
  }

  private routeMiddleware(): void {}

  private globalHandler(): void {
    this.app.all("*", (req: Request, res: Response) => {
      res
        .status(HTTP_STATUS.NOT_FOUND)
        .json({ message: `${req.originalUrl} not found` });
    });
    this.app.use(
      (
        error: IErrorResponse,
        req: Request,
        res: Response,
        next: NextFunction
      ) => {
        LOG.error(error);
        if (error instanceof CustomerError)
          return res.status(error.statusCode).json(error.serializeErrors());
      }
    );
  }

  private async startServer(): Promise<void> {
    try {
      const httpServer: http.Server = new http.Server(this.app);
      const socketIO: Server = await this.createSocketIO(httpServer);
      this.startHttpServer(new http.Server(this.app));
      this.socketIOConnections(socketIO);
    } catch (e) {
      LOG.error("Error starting http server", e);
      throw e;
    }
  }

  private async createSocketIO(httpServer: http.Server): Promise<Server> {
    const io: Server = new Server(httpServer, {
      cors: {
        origin: config.CLIENT_URL,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTION"],
      },
    });
    const pubClient = createClient({ url: config.REDIS_HOST }); //config.REDIS_HOST
    const subClient = pubClient.duplicate();

    await Promise.all([pubClient.connect(), subClient.connect()]).then(() => {
      io.adapter(createAdapter(pubClient, subClient));
    });
    return io;
  }

  private startHttpServer(httpServer: http.Server): void {
    LOG.info(`Server has started with process id ${process.pid}`);
    httpServer.listen(SERVER_PORT, () => {
      LOG.info("Listening on port on port", SERVER_PORT);
    });
  }

  private socketIOConnections(io: Server): void {}
}
