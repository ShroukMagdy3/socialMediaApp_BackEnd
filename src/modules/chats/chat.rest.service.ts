import { NextFunction, Request, Response } from "express";
import { ChatModel } from "../../DB/models/chat.model";
import { ChatRepository } from "../../DB/Repositories/chat.repository";
import { UserRepository } from "../../DB/Repositories/user.repository";
import userModel from "../../DB/models/users.model";
import { AppError } from "../../utilities/classError";
import mongoose, { Types } from "mongoose";
import { deleteFile, uploadFile } from "../../utilities/s3.config";
import { v4 as uuidv4 } from 'uuid';
import { createGroupSchemaType, getChatSchemaType, getGroupSchemaType } from "./chat.validation";

class ChatService {
  private _chatModel = new ChatRepository(ChatModel);
  private _userModel = new UserRepository(userModel);

  getChat = async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = req.params as getChatSchemaType;
    console.log(userId);

    const user = await this._userModel.findOne({
      _id: userId,
      friends: { $in: [req.user._id] },
    });
    if (!user) {
      throw new AppError("user not found");
    }
    let chat = await this._chatModel.findOne(
      {
        participant: {
          $all: [req.user._id, userId],
        },
        group: { $exists: false },
      },
      {
        message: {
          $slice: [-5, 5],
        },
      },
      {
        populate: "participant",
      }
    );    
    if (!chat) {
      throw new AppError("chat not found!");
    }
    return res.status(200).json({ message: "success", chat });
  };

  getGroup = async (req: Request, res: Response, next: NextFunction) => {
    const { groupId }   = req.params as getGroupSchemaType ;
    const user = await this._chatModel.findOne({
      _id:groupId,
      participant: { $in: [req.user._id] },
    });
    if (!user) {
      throw new AppError("user not found");
    }
    let chat = await this._chatModel.findOne(
      {
        participant: {
          $in: [req.user._id],
        },
        group: { $exists: true },
      },
      {
        message: {
          $slice: -5,
        },
      }
      ,{
        populate: "message.createdBy",
      }
    );    
    if (!chat) {
      throw new AppError("chat not found!");
    }
    return res.status(200).json({ message: "success", chat });
  };


  createGroup = async (req: Request, res: Response, next: NextFunction) => {
  let { participant, group, attachment } = req.body;
    const createdBy = req.user._id;

    const dbParticipant = participant.map((p: string) =>
      Types.ObjectId.createFromHexString(p)
    );

    const user = await this._userModel.find({
     filter:{
       _id: { $in: [dbParticipant] },
      friends: { $in: [createdBy] },
     }
    });

    if (user.length !== participant.length)
      throw new AppError("Some participants not found or not friends with the creator", 400);

    if (attachment) {
      attachment = await uploadFile({
        path: `chat`,
        file: attachment as Express.Multer.File,
      });
    }

    const roomId = group.replace(/\s+/g, "-") + "_" + uuidv4();
    dbParticipant.push(createdBy);

    const chatGroup = await this._chatModel.create({
      group,
      groupImage: attachment ,
      participant: dbParticipant,
      createdBy,
      roomId,
      message: [],
    });

    if (!chatGroup) {
      if (attachment) await deleteFile({ Key: attachment  });
      throw new AppError("Failed to create group", 500);
    }

    return res.status(201).json({ message: "success", chatGroup });
};




};







export default new ChatService();
