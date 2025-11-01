import { Router } from "express";
import { Authentication } from "../../middleware/authentication";
import ChatS from "./chat.rest.service";
import { MulterCloud, validationFileType } from "../../middleware/multer.cloud";
import { validation } from "../../middleware/validation";
import { createGroupSchema, getChatSchema, getGroupSchema } from "./chat.validation";

const chatRouter = Router({ mergeParams: true });

chatRouter.get("/", Authentication(), validation(getChatSchema),ChatS.getChat);

chatRouter.post(
  "/createGroup",
  Authentication(),
  MulterCloud({ fileTypes: validationFileType.image }).single("attachment"),
  validation(createGroupSchema),
  ChatS.createGroup
);

chatRouter.get("/group/:groupId", Authentication(),validation(getGroupSchema), ChatS.getGroup);

export default chatRouter;
