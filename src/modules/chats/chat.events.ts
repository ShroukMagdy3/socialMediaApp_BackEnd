import { Server, Socket } from "socket.io"
import { ChatSocketService } from "./chat.sockets"


export class ChatEvents{

    private _chatSocketService = new ChatSocketService();
    constructor(){}


    sayHi = (socket:Socket)=>{
    }

    sendMessage = (socket:Socket , io:Server )=>{

        return socket.on("sendMessage" , (data)=>{
            this._chatSocketService.sendMessage(data , socket ,io)
        })
    }


    
    join_room = (socket:Socket , io:Server )=>{

        return socket.on("join_room" , (data)=>{
            this._chatSocketService.join_room(data , socket ,io)
        })
    }

    sendGroupMessage = (socket:Socket , io:Server )=>{

        return socket.on("sendGroupMessage" , (data)=>{
            this._chatSocketService.sendGroupMessage(data , socket ,io)
        })
    }








}