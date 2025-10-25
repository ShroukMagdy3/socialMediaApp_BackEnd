import mongoose, { Types } from "mongoose";



export interface IFriend {
  
  sendBy: Types.ObjectId 
  sendTo: Types.ObjectId
  acceptedAt:Date
}

export const friendSchema = new mongoose.Schema<IFriend>(
  {

    sendBy:{
        type:mongoose.Schema.Types.ObjectId ,
        ref:"User",
        required:true
    },
    sendTo:{
        type:mongoose.Schema.Types.ObjectId ,
        ref:"User",
        required:true
    },
    acceptedAt:{
        type:Date
    }
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
    },
    toObject: {
      virtuals: true,
    },
    strictQuery: true,
  }
);
// paranoid => false (freeze or unfreeze)
friendSchema.pre(["findOne", "find", "findOneAndUpdate"], function (next) {
  const query = this.getQuery();
  const { paranoid, ...rest } = query;
  if (paranoid === false) {
    this.setQuery({ ...rest });
  } else {
    this.setQuery({ ...rest, deletedBy: { $exists: false } });
  }
  next();
});

const FriendModel =
  mongoose.models.Friend || mongoose.model<IFriend>("Friend", friendSchema);
export default FriendModel;
