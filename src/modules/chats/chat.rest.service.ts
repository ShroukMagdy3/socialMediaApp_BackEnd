import { NextFunction, Request, Response } from "express";
import { ChatModel } from "../../DB/models/chat.model";
import { ChatRepository } from "../../DB/Repositories/chat.repository";
import { UserRepository } from "../../DB/Repositories/user.repository";
import userModel from "../../DB/models/users.model";
import { AppError } from "../../utilities/classError";
import mongoose from "mongoose";

class ChatService {
  private _chatRepository = new ChatRepository(ChatModel);
  private _userRepository = new UserRepository(userModel);

  getChat = async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = req.params;
    const user = await this._userRepository.findOne({
      _id: userId,
      friends: { $in: [req.user._id] },
    });

    console.log(user);
    
    if (!user) {
      throw new AppError("user not found");
    }
    let chat = await this._chatRepository.findOne(
      {
        participants: {
          $all: [req.user._id, userId],
        },
        group: { $exists: false },
      },
      undefined,
      {
        populate: "participant",
      }
    );

    if (!chat) {
      chat = await this._chatRepository.create({
        participant: [req.user._id, new mongoose.Types.ObjectId(userId)],
        createdBy: req.user._id,
        message: [],
      });
    }
    console.log(chat);

    return res.status(200).json({ message: "success", chat });
  };







  
}

export default new ChatService();
