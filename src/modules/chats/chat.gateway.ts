import { ChatEvents } from "./chat.events";
import { AuthenticationSocket } from "../gateway/gateway";

export class ChatGateway {
  private chatEvents = new ChatEvents();
  constructor() {}

  register = (socket: AuthenticationSocket) => {
    this.chatEvents.sayHi(socket);
  };



  
}
