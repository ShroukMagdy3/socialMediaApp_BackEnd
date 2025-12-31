import z, { parseAsync } from "zod";
import { generalRules } from "../../utilities/generalRules";
import { OnModelEnum } from "../../DB/models/comment.model";
import { Types } from "mongoose";

export const createCommentSchema = {
  params: z.strictObject({
    postId: generalRules.id,
    commentId: generalRules.id.optional(),
  }),
  body: z
    .strictObject({
      content: z.string().min(5).max(10000).optional(),
      attachments: z.array(generalRules.file).optional(),
      assetFolderId: z.string().optional(),
      onModel: z.enum(OnModelEnum),
      tags: z
        .array(generalRules.id)
        .refine(
          (value) => {
            return new Set(value).size === value.length;
          },
          {
            message: "duplicate tags",
          }
        )
        .optional(),
    })
    .superRefine((value, ctx) => {
      if (!value.content && value.attachments?.length == 0) {
        ctx.addIssue({
          code: "custom",
          path: ["content"],
          message: "content or attachment is required",
        });
      }
    }),
};
export const deleteSchema = {
  params: z
    .strictObject({
      postId: z.string(),
      commentId: z.string(),
    })
    .refine(
      (value) => {
        const isPostValid = Types.ObjectId.isValid(value.postId);
        const isCommentValid = Types.ObjectId.isValid(value.commentId);

        return isPostValid && isCommentValid;
      },
      {
        message: "Invalid ObjectId.",
        path: ["postId"],
      }
    ),
};
export const updateSchema = {
  body: z
    .strictObject({
      content: z.string().min(5).max(10000).optional(),
      attachments :z.array(generalRules.file).min(1).optional(),
      tags: z
        .array(generalRules.id)
        .refine(
          (value) => {
            return new Set(value).size === value.length;
          },
          {
            message: "duplicate tags",
          }
        )
        .optional(),
    })
    .superRefine((value, ctx) => {
      if (!Object.values(value).length) {
        ctx.addIssue({
          code: "custom",
          message: "at least one field is required",
        });
      }
    }),
  params: z
    .strictObject({
      commentId: z.string(),
      postId: z.string()
    })
    .refine(
      (value) => {
        return value.commentId ? Types.ObjectId.isValid(value.commentId) : true;
      },
      {
        message: "comment ID is required",
        path: ["commentId"],
      }
    ),
};


export type deleteSchemaType = z.infer<typeof deleteSchema.params>;
export type updateSchemaType = z.infer<typeof updateSchema.params>;
