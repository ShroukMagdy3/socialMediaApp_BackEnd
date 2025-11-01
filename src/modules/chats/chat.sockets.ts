import { Server, Socket } from "socket.io";
import { AuthenticationSocket, connectionSockets } from "../gateway/gateway";
import { CreateSessionCommand } from "@aws-sdk/client-s3";
import { UserRepository } from "../../DB/Repositories/user.repository";
import userModel from "../../DB/models/users.model";
import { AppError } from "../../utilities/classError";
import { ChatRepository } from "../../DB/Repositories/chat.repository";
import { ChatModel } from "../../DB/models/chat.model";
import { Types } from "mongoose";

export class ChatSocketService {
  private _userModel = new UserRepository(userModel);
  private _chatModel = new ChatRepository(ChatModel);
  constructor() {}

  sendMessage = async (data: any, socket: AuthenticationSocket, io: Server) => {
    const { content, sendTo } = data;
    const createdBy = socket?.user?._id as Types.ObjectId;

    const user = await this._userModel.findOne({
      _id: sendTo,
      friends: { $in: [createdBy] },
    });
    if (!user) {
      throw new AppError("user not found");
    }

    const chat = await this._chatModel.findOneAndUpdate(
      {
        participant: { $all: [createdBy, sendTo] },
        group: { $exists: false },
      },
      {
        $push: {
          message: {
            content,
            createdBy,
          },
        },
      }
    );

    if (!chat) {
      const chat = await this._chatModel.create({
        participant: [createdBy, sendTo],
        message: [{createdBy, content}],
        createdBy,
      });
    }
    io.to(connectionSockets.get(createdBy.toString())!).emit("successMessage" , content);
    io.to(connectionSockets.get(sendTo.toString())!).emit("newMessage" , {content ,from: socket.user})

  };





  sendGroupMessage = async (data: any, socket: AuthenticationSocket, io: Server) => {

 const { content, groupId } = data;
 console.log(data);
 
 const createdBy = socket?.user?._id!
    const chat = await this._chatModel.findOneAndUpdate(
      {
        _id:groupId,
        participant: { $in:[createdBy]  },
        group: { $exists: true },
      },
      {
        $push: {
          message: {
            content,
            createdBy,
          },
        },
      }
    );
    console.log(chat);
    


    if (!chat) {
    throw new AppError("chat group not found")
    }
    io.to(connectionSockets.get(createdBy.toString())!).emit("successMessage" , content);
    io.to(chat?.roomId!).emit("newMessage" , {content ,from: socket.user, groupId})


    
  };

 
  join_room =async (data: any, socket: AuthenticationSocket, io: Server) => {
    const {roomId} = data;
    const group = await this._chatModel.findOne({
      roomId ,
       participant:{
        $in:[socket.user?._id]
       },
       group:{
        $exists:true
       }
    }) 
    if(!group){
      throw new AppError("not found" , 404)
    }

    socket.join(group.roomId)
  };
}
