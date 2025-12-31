import { Router } from "express";
import US from './users.service'
import { validation } from "../../middleware/validation";
import { acceptRequestSchema, blockUserSchema, cancelRquestSchema, confirmEmailSchema, confirmEnable2FASchema, confirmLoginSchema, forgetPassSchema, freezeSchema, loginWithGmailSchema, LogOutSchema, resetPassSchema, sendRequestSchema, signInSchema, signUpSchema, unfreezeSchema, unfriendSchema, updateEmailSchema, updateInfoSchema, updatePasswordSchema } from "./users.validator";
import { Authentication } from "../../middleware/authentication";
import { TokenType } from "../../utilities/token";
import { Authorization } from "../../middleware/authorization";
import { roleType } from "../../DB/models/users.model";
import chatRouter from "../chats/chat.controller";
const userRouter = Router()
userRouter.use("/:userId/chat" , chatRouter)

userRouter.post("/signUp", validation(signUpSchema) , US.signUp )
userRouter.patch("/confirmEmail", validation(confirmEmailSchema) , US.confirmEmail )
userRouter.post("/signIn" ,validation(signInSchema) , US.signIn )
userRouter.get("/getProfile",Authentication(), US.getProfile )
userRouter.post("/logOut", validation(LogOutSchema) ,Authentication(), US.LogOut )
userRouter.get("/refreshToken" ,Authentication(TokenType.refresh), US.refreshToken )
userRouter.post("/loginWithGmail" ,validation(loginWithGmailSchema), US.loginWithGmail )
userRouter.patch("/forgetPass" ,validation(forgetPassSchema), US.forgetPass )
userRouter.patch("/resetPass" ,validation(resetPassSchema), US.resetPass )
userRouter.patch("/updatePass",Authentication() , validation(updatePasswordSchema), US.updatePass )
userRouter.put("/updateInfo",Authentication() , validation(updateInfoSchema), US.updateInfo )
userRouter.patch("/updateEmail",Authentication() , validation(updateEmailSchema), US.updateEmail )
userRouter.get("/dasBoard",Authentication() , Authorization({role:[roleType.admin , roleType.superAdmin]}) , US.dashBoard )
userRouter.patch("/updateRole/:userId",Authentication() , Authorization({role:[roleType.admin , roleType.superAdmin]}) , US.updateRole )
userRouter.patch("/block/:blockedUserId", Authentication() , validation(blockUserSchema),US.blockUser )
userRouter.patch("/unblock/:blockedUserId", Authentication() ,validation(blockUserSchema) , US.unblockUser )


// 2 step verification
userRouter.post("/enable-2fa",Authentication() ,US.enable2FA);
userRouter.post("/confirmEnable2FA" ,Authentication() ,validation(confirmEnable2FASchema), US.confirmEnable2FA);
userRouter.post("/confirmLogin" ,validation(confirmLoginSchema), US.confirmLogin);



userRouter.post("/upload" ,Authentication() , US.uploadProfileImage);
userRouter.delete("/freezeAccount{/:userId}", Authentication() , validation(freezeSchema) , US.freezeAccount )
userRouter.delete("/unFreezeAccount/:userId", Authentication() , Authorization({role:[roleType.admin , roleType.superAdmin]}) , validation(unfreezeSchema) , US.unfreezeAccount )
userRouter.post("/sendRequest/:userId" , Authentication() , validation(sendRequestSchema) , US.sendRequest)
userRouter.patch("/acceptRequest/:requestId" , Authentication() , validation(acceptRequestSchema) , US.acceptRequest)
userRouter.delete(
    "/friend-request/:requestId",
    Authentication(),
    validation(cancelRquestSchema),
    US.cancelFriendRequest
  );
userRouter.delete(
    "/unfriend/:friendId",
    Authentication(),
    validation(unfriendSchema),
    US.unfriend
  );






export default userRouter ;