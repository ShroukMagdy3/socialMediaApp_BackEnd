import mongoose, { models, Types } from "mongoose"






export interface IMessage {
    content : string
    createdBy:Types.ObjectId
     createdAt:Date,
     updatedAt:Date
}

const messageSchema = new mongoose.Schema<IMessage>({
    createdBy:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User" ,
        required:true
    },
    content:{
        type:String,
        required:true
    },


} ,{
    timestamps:true
})
export interface IChat {
    message: IMessage[]
    participant :Types.ObjectId[]


    group?:string
    groupImage:string
    roomId:string

    createdBy:Types.ObjectId
     createdAt:Date,
     updatedAt:Date
}

const chatSchema = new mongoose.Schema<IChat>({
    message:[messageSchema],
    group:{
        type:String
    },
    groupImage:{
        type:String
    },
    roomId:{
        type:String
    },
     createdBy:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User" ,
        required:true
    },
    participant : [{
         type:mongoose.Schema.Types.ObjectId,
        ref:"User" ,
        required:true
    }]

} ,{
    timestamps:true
})


export const ChatModel = models.Chat || mongoose.model<IChat>("Chat" , chatSchema)
