import { Server, Socket } from "socket.io";
import { IUser } from "../../DB/models/users.model";
import { HydratedDocument } from "mongoose";
import { Server as httpServer } from "node:http";
import { AppError } from "../../utilities/classError";
import {
  decodedTokenAndFetch,
  getSignature,
  TokenType,
} from "../../utilities/token";
import { ChatGateway } from "../chats/chat.gateway";

export interface AuthenticationSocket extends Socket {
  user?: HydratedDocument<IUser>;
}
let connectionSockets = new Map<string, string[]>();

export const disconnect = (socket: AuthenticationSocket) => {
  socket.on("disconnect", () => {
    let currentSockets =
      connectionSockets.get(socket?.user?._id.toString() as string) || [];
    currentSockets = currentSockets?.filter((id) => {
      return id !== socket.id;
    });
    connectionSockets.set(socket?.user?._id.toString()!, currentSockets);
  });
};

export const connect = (socket: AuthenticationSocket) => {
  let currentSockets =
    connectionSockets.get(socket.user?._id.toString()!) || [];
  currentSockets.push(socket.id);
  connectionSockets.set(socket.user?._id.toString()! as string, currentSockets);
};

export const initialize = (httpServer: httpServer) => {

    const chatGateway = new ChatGateway();
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
    },
  });

  io.use(async (socket: AuthenticationSocket, next) => {
   try {
     const { authorization } = socket.handshake.auth;
    const [prefix, token] = authorization?.split(" ") || [];
    if (!prefix || !token) {
      next(new AppError("invalid token", 401));
    }
    const signature = await getSignature(TokenType.access, prefix);
    if (!signature) {
      next(new AppError("invalid signature", 401));
    }
    const { user, decoded } = await decodedTokenAndFetch(token, signature!);
    socket.user = user;
    next()
   } catch (error) {
       next(new AppError(error));
   }
  });

  io.on("connection", (socket: AuthenticationSocket) => {
    connect(socket);
    chatGateway.register(socket)
    disconnect(socket);
  });



};
