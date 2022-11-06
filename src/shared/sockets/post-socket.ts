import { config } from "@root/config";
import { Socket, Server } from "socket.io";

const log = config.LOG.getInstance("SocketIO");
let socketIOPostServer: Server;

export class SocketIOPostHandler {
  private io: Server;

  constructor(io: Server) {
    this.io = io;
    socketIOPostServer = io;
  }

  public listen(): void {
    this.io.on("connection", (socket: Socket) => {
      log.info("Post SocketIO handler");
    });
  }
}

export { socketIOPostServer };
