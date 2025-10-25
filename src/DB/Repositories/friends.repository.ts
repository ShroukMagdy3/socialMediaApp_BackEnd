import {  Model } from "mongoose";
import { DbRepository } from "./db.repository";
import { IComment } from "../models/comment.model";
import { IFriend } from "../models/friends.model";

export class FriendRepository extends DbRepository<IFriend>{
    constructor(protected readonly model : Model<IFriend>){
        super(model)
    }


     
}