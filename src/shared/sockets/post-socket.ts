import { ICommentDocument } from "@comment/interfaces/comment-interface";
import { IReactionDocument } from "@reaction/interfaces/reaction-interface";
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
      socket.on("reaction", (reaction: IReactionDocument) => {
        this.io.emit("updated-reaction", reaction);
      });

      socket.on("comment", (comment: ICommentDocument) => {
        this.io.emit("updated-comment", comment);
      });
    });
  }
}

export { socketIOPostServer };
