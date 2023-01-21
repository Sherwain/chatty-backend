import { config } from "@root/config";
import { Socket, Server } from "socket.io";

const log = config.LOG.getInstance("SocketIO");
let socketIOCommentServer: Server;

export class SocketIOCommentHandler {
  private io: Server;

  constructor(io: Server) {
    this.io = io;
    socketIOCommentServer = io;
  }

  public listen(): void {
    this.io.on("connection", (socket: Socket) => {
      log.info("Comment SocketIO handler");
    });
  }
}

export { socketIOCommentServer };
