import mongoose, { mongo } from "mongoose";
import CommentModel from "./comment.model";

export enum AvailabilityEnum {
  friends = "friends",
  private = "private",
  public = "public",
}
export enum AllowCommentEnum {
  deny = "deny",
  allow = "allow",
}
export interface IPost {
  content?: string;
  attachments?: string[];
  assetFolderId?: string;
  createdBy: mongoose.Schema.Types.ObjectId;

  tags?: mongoose.Schema.Types.ObjectId;
  likes?: mongoose.Schema.Types.ObjectId;

  allowComment: AllowCommentEnum;
  availability: AvailabilityEnum;

  deletedAt: Date;
  deletedBy: mongoose.Schema.Types.ObjectId;

  restoreAt: Date;
  restoreBy: mongoose.Schema.Types.ObjectId;
}

export const postSchema = new mongoose.Schema<IPost>(
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
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    tags: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    allowComment: {
      type: String,
      enum: AllowCommentEnum,
      default: AllowCommentEnum.allow,
    },
    availability: {
      type: String,
      enum: AvailabilityEnum,
      default: AvailabilityEnum.public,
    },

    deletedAt: { type: Date },
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    restoreAt: { type: Date },
    restoreBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
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
postSchema.pre(["findOne", "find"], function (next) {
  const query = this.getQuery();
  const { paranoid, ...rest } = query;
  if (paranoid === false) {
    this.setQuery({ ...rest });
  } else {
    this.setQuery({ ...rest, deletedBy: { $exists: false } });
  }
  next();
});
postSchema.pre(["deleteOne" , "deleteMany"  ] , async function(next) {
  const query = this.getQuery();

  const post = await this.model.findOne(query);
  if (!post) return next();

  await CommentModel.deleteMany({ postId: post._id });

  next();
})


postSchema.virtual("comments", {
  ref: "Comment",
  localField: "_id",
  foreignField: "postId",
});

const PostModel =
  mongoose.models.Post || mongoose.model<IPost>("Post", postSchema);

export default PostModel;
