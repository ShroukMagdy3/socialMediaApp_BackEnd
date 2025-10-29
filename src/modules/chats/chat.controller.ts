import { Router } from "express";
import { Authentication } from "../../middleware/authentication";
import ChatS    from "./chat.rest.service";

const chatRouter = Router({mergeParams:true})




chatRouter.get("/" , Authentication() , ChatS.getChat)










export default chatRouter;