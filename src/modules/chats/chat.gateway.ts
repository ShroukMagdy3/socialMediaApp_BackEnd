import { ChatEvents } from "./chat.events";
import { AuthenticationSocket } from "../gateway/gateway";
import { Server } from "socket.io";

export class ChatGateway {
  private chatEvents = new ChatEvents();
  constructor() {}

  register = (socket: AuthenticationSocket , io:Server ) => {
    this.chatEvents.sayHi(socket);
    this.chatEvents.sendMessage(socket , io);
    this.chatEvents.join_room(socket, io)
    this.chatEvents.sendGroupMessage(socket, io)






  };



  
}
