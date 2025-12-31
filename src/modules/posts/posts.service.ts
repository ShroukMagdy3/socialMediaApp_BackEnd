import { NextFunction, Response, Request } from "express";
import { UserRepository } from "../../DB/Repositories/user.repository";
import userModel from "../../DB/models/users.model";
import { PostRepository } from "../../DB/Repositories/posts.repository";
import PostModel, { AvailabilityEnum, IPost } from "../../DB/models/post.model";
import { AppError } from "../../utilities/classError";
import { deleteFiles, uploadFiles } from "../../utilities/s3.config";
import {
  actionEnum,
  freezeSchemaType,
  likePostSchemaType,
} from "./posts.validator";
import { UpdateQuery, UpdateWriteOpResult } from "mongoose";
import { GraphQLError } from "graphql";
import { v4 as uuidv4 } from "uuid";
import { AuthenticationGraphQl } from "../../middleware/authentication";
import { getIo } from "../gateway/gateway";

class PostService {
  private _userModel = new UserRepository(userModel);
  private _postModel = new PostRepository(PostModel);
  constructor() {}

  createPost = async (req: Request, res: Response, next: NextFunction) => {
    if (
      req.body.tags.length &&
      (await this._userModel.find({ filter: { _id: { $in: req.body.tags } } }))
        .length !== req.body.tags.length
    ) {
      throw new AppError("invalid Tags ID");
    }

    const assetFolderId = uuidv4();
    let attachments: string[] = [];
    if (req.files?.length) {
      attachments = await uploadFiles({
        path: `users/${req.user._id}/posts/${assetFolderId}`,
        files: req.files as unknown as Express.Multer.File[],
      });
    }

    const post = await this._postModel.create({
      ...req.body,
      attachments,
      assetFolderId,
      createdBy: req.user._id,
    });

    if (!post) {
      await deleteFiles({ urls: attachments });
      throw new AppError("Failed to create Post!");
    }
    return res.status(201).json({ message: "Created", post });
  };

  likePost = async (req: Request, res: Response, next: NextFunction) => {
    const { postId } = req.params as likePostSchemaType;
    const { action } = req.query;

    let updateQuery: UpdateQuery<IPost> = {
      $addToSet: { likes: req.user?._id },
    };

    if (action === actionEnum.unlike) {
      updateQuery = { $pull: { likes: req.user?._id } };
    }

    const post = await this._postModel.findOneAndUpdate(
      {
        _id: postId,
        $or: [
          { availability: AvailabilityEnum.public },
          { availability: AvailabilityEnum.private, createdBy: req.user._id },
          {
            availability: AvailabilityEnum.friends,
            createdBy: { $in: [req?.user?.friends || [], req.user._id] },
          },
        ],
      },
      updateQuery,
      { new: true }
    );

    if (!post) {
      throw new AppError("This post not found", 404);
    }

    return res.status(201).json({ message: "liked", post });
  };

  updatePost = async (req: Request, res: Response, next: NextFunction) => {
    const { postId } = req.params;
    const post = await this._postModel.findOne({
      _id: postId,
      createdBy: req.user._id,
    });

    if (!post) {
      throw new AppError("Post Not found or unauthorized", 404);
    }

    if (req.body.content) {
      post.content = req.body.content;
    }
    if (req.body.availability) {
      post.availability = req.body.availability;
    }

    if (req.body.allowComment) {
      post.allowComment = req.body.allowComment;
    }

    if (req.files?.length) {
      await deleteFiles({ urls: post.attachments || [] });
      post.attachments = await uploadFiles({
        path: `users/${req.user._id}/posts/${post.assetFolderId}`,
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
      req.body.tags = post.tags;
    }
    await post.save();
    return res.status(200).json({ message: "Updated", post });
  };

  getAllPost = async (req: Request, res: Response, next: NextFunction) => {
    let { page = 1, limit = 5 } = req.query as unknown as {
      page: number;
      limit: number;
    };

    if (page <= 0) page = 1;
    page = page * 1 || 1;
    const skip = (page - 1) * limit;
    const { docs, currentPage, numberOfDocument, numberOfPages } =
      await this._postModel.paginate({ filter: {}, query: { page, limit } });
    const posts = await this._postModel.find({
      filter: {},
      options: {
        populate: [{ path: "comments" }],
      },
    });
    return res.status(201).json({
      message: "Created",
      page: currentPage,
      numberOfPages,
      numberOfDocument,
      posts: posts,
    });
  };

  freezePost = async (req: Request, res: Response, next: NextFunction) => {
    const { postId } = req.params as freezeSchemaType;
    const post = await this._postModel.findOneAndUpdate(
      { _id: postId, createdBy: req.user._id, deletedAt: { $exists: false } },
      {
        $set: { deletedAt: new Date(), deletedBy: req.user._id },
        $unset: { restoreBy: "", restoreAt: "" },
      },
      { new: true }
    );
    if (!post) {
      throw new AppError(
        "No post or already freezed",
        404
      );
    }
    return res.status(200).json({ message: "freezed" });
  };

  unfreezePost = async (req: Request, res: Response, next: NextFunction) => {
    const { postId } = req.params as freezeSchemaType;
    const post = await this._postModel.findOneAndUpdate(
      { _id: postId, createdBy: req.user._id, deletedAt: { $exists: true } },
      {
        $set: { restoreAt: new Date(), restoreBy : req.user._id },
        $unset: { deletedBy: "", deletedAt: "" },
      },
      { new: true }
    );
    if (!post) {
      throw new AppError(
        "No post or already unfreezed",
        404
      );
    }
    return res.status(200).json({ message: "unfreezed" });
  };
  deletePost = async (req: Request, res: Response, next: NextFunction) => {
    const { postId } = req.params as freezeSchemaType;
    const post = await this._postModel.findOne(
     {_id :postId , createdBy:req.user._id});
    if (!post) {
      throw new AppError(
        "No post or already deleted or unauthorized",
        404
      );
    }
    await this._postModel.deleteOne({_id :postId , createdBy:req.user._id})

    return res.status(200).json({ message: "deleted"  });
  };
  getPost =async (req: Request, res: Response, next: NextFunction) => {
    const { postId } = req.params as freezeSchemaType;
    const post = await this._postModel.findOne(
     {_id :postId ,$or: [
      { createdBy: req.user._id },
      { availability:AvailabilityEnum.public },
      {
        availability: AvailabilityEnum.friends,
        createdBy: { $in: req.user.friends },
      },
    ], });
    if (!post) {
      throw new AppError(
        "No post or you are not authorized or freezed",
        404
      );
    }
    return res.status(200).json({ message: "success" , post  });
  };







  // =====graphQl ===========
  getPosts = async (parent: any, args: any) => {
    const posts = await this._postModel.find({ filter: {} });
    if (posts.length == 0) {
      throw new GraphQLError("no posts yet");
    }
    return posts;
  };

  likePostGQL = async (parent: any, args: any, context: any) => {
    const { user } = await AuthenticationGraphQl(
      context.req.headers.authorization
    );
    const { postId, action } = args;
    let updateQuery: UpdateQuery<IPost> = {
      $addToSet: { likes: user?._id },
    };

    if (action === actionEnum.unlike) {
      updateQuery = { $pull: { likes: user?._id } };
    }

    const post = await this._postModel.findOneAndUpdate(
      {
        _id: postId,
        $or: [
          { availability: AvailabilityEnum.public },
          { availability: AvailabilityEnum.private, createdBy: user._id },
          {
            availability: AvailabilityEnum.friends,
            createdBy: { $in: [user?.friends || [], user._id] },
          },
        ],
      },
      updateQuery,
      { new: true }
    );

    if (!post) {
      throw new GraphQLError("this not found", {
        extensions: { message: "this post not found", statusCode: 404 },
      });
    }
    getIo().emit("postLiked", {
      postId,
      likedBy: user._id,
    });

    return post;
  };
}

export default new PostService();
