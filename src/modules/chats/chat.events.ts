import { Socket } from "socket.io"


export class ChatEvents{
    constructor(){}


    sayHi = (socket:Socket)=>{
        socket.emit("sayHi" , "heeeeeeelllllllo")
    }








}