import { IComment, OnModelEnum } from "./../../DB/models/comment.model";
import { NextFunction, Response, Request } from "express";
import { UserRepository } from "../../DB/Repositories/user.repository";
import userModel from "../../DB/models/users.model";
import { PostRepository } from "../../DB/Repositories/posts.repository";
import PostModel, {
  AllowCommentEnum,
  AvailabilityEnum,
  IPost,
} from "../../DB/models/post.model";
import CommentModel from "../../DB/models/comment.model";
import { CommentRepository } from "../../DB/Repositories/comment.repository";
import { deleteFiles, uploadFiles } from "../../utilities/s3.config";
import { AppError } from "../../utilities/classError";
import { v4 as uuidv4 } from "uuid";
import { HydratedDocument, Types } from "mongoose";
import { deleteSchemaType, updateSchemaType } from "./comment.validator";

class CommentService {
  private _userModel = new UserRepository(userModel);
  private _postModel = new PostRepository(PostModel);
  private _commentModel = new CommentRepository(CommentModel);
  constructor() {}

  createComment = async (req: Request, res: Response, next: NextFunction) => {
    const { postId, commentId } = req.params;
    if (!postId) {
      throw new AppError("post Id is required!!");
    }
    let { content, attachments = [], tags = [], onModel } = req.body;

    let doc: HydratedDocument<IPost | IComment> | null = null;

    if (onModel === OnModelEnum.Comment) {
      if (!commentId) {
        throw new AppError("commentId is required", 404);
      }
      const comment = await this._commentModel.findOne({
        _id: commentId,
        refId: postId,
        allowComment: AllowCommentEnum.allow,
        $or: [
          { availability: AvailabilityEnum.public },
          { createdBy: req.user._id },
          {
            $and: [
              { availability: AvailabilityEnum.friends },
              { createdBy: { $in: req.user.friends } },
            ],
          },
        ],
      });
      if (!comment) {
        throw new AppError("This comment not found or unauthorized");
      }
      doc = comment;
    } else if (onModel === OnModelEnum.Post) {
      if (commentId) {
        throw new AppError("commentId not allowed");
      }
      const post = await this._postModel.findOne({
        _id: postId,
        allowComment: AllowCommentEnum.allow,
        $or: [
          { availability: AvailabilityEnum.public },
          { createdBy: req.user._id },
          {
            $and: [
              { availability: AvailabilityEnum.friends },
              { createdBy: { $in: req.user.friends } },
            ],
          },
        ],
      });

      if (!post) {
        throw new AppError("This post not found or unauthorized");
      }

      doc = post;
    }
    if (
      req.body?.tags?.length &&
      (await this._userModel.find({ filter: { _id: { $in: req.body.tags } } }))
        .length !== req.body.tags.length
    ) {
      throw new AppError("invalid Tags ID");
    }
    const assetFolderId = uuidv4();
    if (req.files && (req.files as Express.Multer.File[]).length > 0) {
      attachments = await uploadFiles({
        path: `users/${req.user._id}/posts/${doc?.assetFolderId}/comments/${assetFolderId}`,
        files: req.files as unknown as Express.Multer.File[],
      });
    }

    const comment = await this._commentModel.create({
      content,
      tags,
      attachments,
      assetFolderId,
      refId: doc?._id as Types.ObjectId,
      onModel,
      postId,
      createdBy: req.user._id,
    });

    if (!comment) {
      await deleteFiles({ urls: attachments });
      throw new AppError("Failed to create comment");
    }
    console.log(comment);

    return res.status(201).json({ message: "Created", comment });
  };

  deleteComment = async (req: Request, res: Response, next: NextFunction) => {
    const { postId, commentId } = req.params as deleteSchemaType;
    const userId = req.user._id;

    const comment = await this._commentModel.findOne({
      _id: commentId,
      postId,
    });

    if (!comment) {
      return res.status(404).json({
        message: "Comment not found or does not belong to this post.",
      });
    }

    const post = await this._postModel.findOne({ _id: postId });

    if (!post) {
      return res.status(404).json({
        message: "Post not found.",
      });
    }

    const isCommentOwner = comment.createdBy.toString() === userId.toString();
    const isPostOwner = post.createdBy.toString() === userId.toString();

    if (!isCommentOwner && !isPostOwner) {
      return res.status(403).json({
        message: "You are not allowed to delete this comment.",
      });
    }

    await this._commentModel.deleteOne({ _id: commentId });

    return res.status(200).json({
      message: "Comment deleted successfully.",
    });
  };

  updateComment = async (req: Request, res: Response, next: NextFunction) => {
    const { commentId, postId } = req.params as updateSchemaType;
    const comment = await this._commentModel.findOne({
      _id: commentId,
      createdBy: req.user._id,
      postId,
    });

    if (!comment) {
      throw new AppError("comment Not found or unauthorized", 404);
    }
    if (req.body.content) {
      comment.content = req.body.content;
    }

    if (req.files?.length) {
      if (comment?.attachments!.length > 0) {
        await deleteFiles({ urls: comment.attachments || [] });
      }
      comment.attachments = await uploadFiles({
        path: `users/${req.user._id}/comments/${comment.assetFolderId}`,
        files: req.files as unknown as Express.Multer.File[],
      });
    }

    if (req?.body?.tags?.length) {
      if (
        req?.body?.tags?.length &&
        (
          await this._userModel.find({
            filter: { _id: { $in: req.body.tags } },
          })
        ).length !== req.body.tags.length
      ) {
        throw new AppError("invalid Tags ID");
      }
      comment.tags = req.body.tags;
    }
    await comment.save();
    return res.status(200).json({ message: "Updated", comment });
  };

  getComment = async (req: Request, res: Response, next: NextFunction) => {
    const { commentId, postId } = req.params as updateSchemaType;

    const userId = req.user._id;
    const friends = req.user.friends ?? [];
    const post = await this._postModel.findOne({
      _id: postId,
      $or: [
        { createdBy: userId },
        { availability: AvailabilityEnum.public },
        {
          availability: AvailabilityEnum.friends,
          createdBy: { $in: friends },
        },
      ],
    });

    if (!post) {
      throw new AppError("Post not found or not authorized or freezed ", 403);
    }

    const comment = await this._commentModel.findOne({
      _id: commentId,
      postId,
    });

    if (!comment) {
      throw new AppError("Comment not found", 404);
    }
    return res.status(200).json({message :"sucess" , comment });
  };





  
}

export default new CommentService();
