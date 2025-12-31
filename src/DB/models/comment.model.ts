import mongoose, { Types } from "mongoose";

export enum OnModelEnum  {
    Comment ="Comment",
     Post=  "Post",
}

export interface IComment {
  content?: string;
  attachments?: string[];
  assetFolderId?: string;
  createdBy: mongoose.Types.ObjectId | string;
  postId: mongoose.Types.ObjectId | string;

  refId: Types.ObjectId;
  onModel: OnModelEnum;

  tags?: mongoose.Types.ObjectId;
  likes?: mongoose.Types.ObjectId;

}

export const CommentSchema = new mongoose.Schema<IComment>(
  {
    content: {
      type: String,
      minlength: 5,
      maxlength: 10000,
      required: function () {
        return this.attachments?.length === 0;
      },
    },
    attachments: [{ type: String }],
    assetFolderId: { type: String },
    createdBy: 
      { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
     refId:{type : mongoose.Schema.Types.ObjectId , refPath:"onModel" , required:true},
    onModel:{type :String, enum:OnModelEnum , required:true},

    postId: 
      { type: mongoose.Schema.Types.ObjectId, ref: "Post", required: true },


    tags: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

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
CommentSchema.pre(["findOne", "find", "findOneAndUpdate"], function (next) {
  const query = this.getQuery();
  const { paranoid, ...rest } = query;
  if (paranoid === false) {
    this.setQuery({ ...rest });
  } else {
    this.setQuery({ ...rest, deletedBy: { $exists: false } });
  }
  next();
});

const CommentModel =
  mongoose.models.Comment || mongoose.model<IComment>("Comment", CommentSchema);
export default CommentModel;
