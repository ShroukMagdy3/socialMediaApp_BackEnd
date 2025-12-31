import { Router } from "express";
import { Authentication } from "../../middleware/authentication";
import { validation } from "../../middleware/validation";
import { MulterCloud, validationFileType } from "../../middleware/multer.cloud";
import CS from "./comments.service";
import { createCommentSchema, deleteSchema, updateSchema } from "./comment.validator";

const commentRouter = Router({ mergeParams: true });

commentRouter.post(
  "/",
  Authentication(),
  MulterCloud({ fileTypes: validationFileType.image }).array("attachments"),
  validation(createCommentSchema),
  CS.createComment
);
commentRouter.delete(
  "/delete/:commentId",
  Authentication(),
  validation(deleteSchema),
  CS.deleteComment
);
commentRouter.put(
  "/update/:commentId",
  Authentication(),
  MulterCloud({fileTypes:validationFileType.image}).array("attachments" , 1),  
  validation(updateSchema),
  CS.updateComment
);
commentRouter.get("/getComment/:commentId" , Authentication() ,CS.getComment )


export default commentRouter;
