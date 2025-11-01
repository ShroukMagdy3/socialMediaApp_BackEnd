import { NextFunction, Request, Response } from "express";

import {
  acceptRequestSchemaType,
  confirmEmailSchemaType,
  flagType,
  forgetPassSchemaType,
  freezeSchemaType,
  loginWithGmailSchemaType,
  LogOutSchemaType,
  resetPassSchemaType,
  sendRequestSchemaType,
  signInSchemaType,
  signUpSchemaType,
  unfreezeSchemaType,
  updateEmailSchemaType,
  updateInfoSchemaType,
  updatePasswordSchemaType,
} from "./users.validator";
import userModel, { providerType, roleType } from "../../DB/models/users.model";
import { UserRepository } from "../../DB/Repositories/user.repository";
import { AppError } from "../../utilities/classError";
import { generateOtp } from "../../service/sendEmail";
import { eventEmitter } from "../../utilities/events";
import { generateToken } from "../../utilities/token";
import { v4 as uuidv4 } from "uuid";
import revokeTokenModel from "../../DB/models/revokeToken.model";
import { revokeTokenRepository } from "../../DB/Repositories/revokeToken.repository";
import { OAuth2Client, TokenPayload } from "google-auth-library";
import { Compare, Hash } from "../../utilities/hash";
import { uploadWithSignedUrl } from "../../utilities/s3.config";
import { PostRepository } from "../../DB/Repositories/posts.repository";
import PostModel from "../../DB/models/post.model";
import FriendModel, {
  friendSchema,
  IFriend,
} from "../../DB/models/friends.model";
import { FriendRepository } from "../../DB/Repositories/friends.repository";
import { HydratedDocument, Types } from "mongoose";
import { ChatModel } from "../../DB/models/chat.model";
import { ChatRepository } from "../../DB/Repositories/chat.repository";

class UserService {
  private _userModel = new UserRepository(userModel);
  private _revokeTokenModel = new revokeTokenRepository(revokeTokenModel);
  private _postModel = new PostRepository(PostModel);
  private _friendModel = new FriendRepository(FriendModel);
  private _chatModel = new ChatRepository(ChatModel);

  signUp = async (req: Request, res: Response, next: NextFunction) => {
    const {
      userName,
      email,
      password,
      age,
      gender,
      address,
      phone,
    }: signUpSchemaType = req.body;
    if (await this._userModel.findOne({ email })) {
      throw new AppError("email is already exist");
    }

    const otp = await generateOtp();
    const hashOtp = await Hash(String(otp), Number(process.env.SALT_ROUNDS));
    const user = await this._userModel.createOneUser({
      userName,
      email,
      password,
      age,
      address,
      gender,
      phone,
      otp: hashOtp,
    });

    eventEmitter.emit("confirmEmail", { email, otp });

    return res.status(200).json({ message: "success", user });
  };
  confirmEmail = async (req: Request, res: Response, next: NextFunction) => {
    const { email, otp }: confirmEmailSchemaType = req.body;
    const user = await this._userModel.findOne({
      email,
      confirmed: false,
    });
    if (!user) {
      throw new AppError("email not exist or confirmed !");
    }
    if (!(await Compare(otp, user?.otp!))) {
      throw new AppError("Invalid otp");
    }
    await this._userModel.updateOne(
      { email: user.email },
      { $set: { confirmed: true }, $unset: { otp: "" } }
    );
    return res.status(200).json({ message: "Confirmed" });
  };

  enable2FA = async (req: Request, res: Response, next: NextFunction) => {
    const user = await this._userModel.findOne(req.user._id);
    if (!user) throw new AppError("User not found", 404);

    const otp = await generateOtp();
    const hashOtp = await Hash(String(otp), Number(process.env.SALT_ROUNDS));
    user.verify_otp = hashOtp;
    user.verify_otp_expire = new Date(Date.now() + 5 * 60 * 1000);
    await user.save();

    eventEmitter.emit("verifyEmail", { email: user.email, otp });

    return res.status(200).json({ message: "OTP sent to email" });
  };
  confirmEnable2FA = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const { otp } = req.body;

    const user = await this._userModel.findOne({ _id: req.user._id });
    if (!user) throw new AppError("User not found", 404);

    if (user.verify_otp_expire! < new Date())
      throw new AppError("OTP expired", 400);

    const valid = await Compare(otp, user.verify_otp!);
    if (!valid) throw new AppError("Invalid OTP", 400);

    user.isTwoFAEnabled = true;
    user.verify_otp = undefined;
    user.verify_otp_expire = undefined;
    await user.save();

    return res.status(200).json({ message: "2FA enabled successfully" });
  };

  signIn = async (req: Request, res: Response, next: NextFunction) => {
    const { email, password }: signInSchemaType = req.body;
    const user = await this._userModel.findOne({
      email,
      provider: providerType.system,
      deletedAt: { $exists: false },
      deletedBy: { $exists: false },
    });
    if (!user) {
      throw new AppError("this user not found or freezed ", 404);
    }

    if (!user.confirmed) {
      throw new AppError("this user is not confirmed", 403);
    }
    if (!(await Compare(password, user.password))) {
      throw new AppError("invalid Password", 400);
    }

    if (user.isTwoFAEnabled) {
      const otp = await generateOtp();
      const hashOtp = await Hash(String(otp), Number(process.env.SALT_ROUNDS));
      user.login_otp = hashOtp;
      user.login_otp_expire = new Date(Date.now() + 5 * 60 * 1000);
      await user.save();
      eventEmitter.emit("verifyEmail", { email: user.email, otp });
      return res.status(200).json({ message: "OTP sent to email" });
    }

    const jwtId = uuidv4();
    const accessToken = await generateToken({
      payload: { id: user._id, email },
      signature:
        user.role == roleType.user
          ? process.env.SIGNATURE_access_USER!
          : process.env.SIGNATURE_access_ADMIN!,
      options: {
        expiresIn: "1d",
        jwtid: jwtId,
      },
    });
    const refresh_token = await generateToken({
      payload: { id: user._id, email },
      signature:
        user.role == roleType.admin
          ? process.env.SIGNATURE_REFRESH_ADMIN!
          : process.env.SIGNATURE_REFRESH_USER!,
      options: { expiresIn: "1y", jwtid: jwtId },
    });

    return res
      .status(200)
      .json({ message: "success", accessToken, refresh_token });
  };
  confirmLogin = async (req: Request, res: Response, next: NextFunction) => {
    const { email, otp } = req.body;

    const user = await this._userModel.findOne({ email });
    if (!user) throw new AppError("User not found", 404);
    if (!user.isTwoFAEnabled) throw new AppError("2FA not enabled", 400);

    if (user.login_otp_expire! < new Date())
      throw new AppError("OTP expired", 400);

    const valid = await Compare(otp, user.login_otp!);
    if (!valid) throw new AppError("Invalid OTP", 400);

    user.login_otp = undefined;
    user.login_otp_expire = undefined;
    await user.save();
    const jwtId = uuidv4();
    const accessToken = await generateToken({
      payload: { id: user._id, email },
      signature:
        user.role === roleType.user
          ? process.env.SIGNATURE_access_USER!
          : process.env.SIGNATURE_access_ADMIN!,
      options: { expiresIn: 60 * 60, jwtid: jwtId },
    });
    const refresh_token = await generateToken({
      payload: { id: user._id, email },
      signature:
        user.role === roleType.admin
          ? process.env.SIGNATURE_REFRESH_ADMIN!
          : process.env.SIGNATURE_REFRESH_USER!,
      options: { expiresIn: "1y", jwtid: jwtId },
    });
    return res
      .status(200)
      .json({ message: "Login confirmed", accessToken, refresh_token });
  };

  getProfile = async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user._id;

    const user = await this._userModel.findOne({ _id: userId }, undefined, {
      populate: { path: "friends", select: "fName lName profileImage" },
    });
    if (!user) {
      throw new AppError("there is no user", 404);
    }
    const groups = await this._chatModel.find({
      filter: {
        participant: { $in: [req.user._id] },
        group: { $exists: true },
      },
    });


    return res.status(200).json({ message: "success", user, groups });
  };
  LogOut = async (req: Request, res: Response, next: NextFunction) => {
    const { flag }: LogOutSchemaType = req.body;
    if (flag === flagType.all) {
      await this._userModel.updateOne(
        { _id: req.user._id },
        { changeCredentials: new Date() }
      );
      return res
        .status(200)
        .json({ message: "you are log out from all devices" });
    }

    await this._revokeTokenModel.create({
      tokenId: req.decoded.jti!,
      userId: req.user._id,
      expAt: new Date(req.decoded.exp! * 1000),
    });
    return res
      .status(200)
      .json({ message: "you are log out from this device only" });
  };
  refreshToken = async (req: Request, res: Response, next: NextFunction) => {
    const jwtId = uuidv4();
    const accessToken = await generateToken({
      payload: { id: req?.user?._id, email: req?.user?.email },
      signature:
        req.user.role == roleType.user
          ? process.env.SIGNATURE_access_USER!
          : process.env.SIGNATURE_access_ADMIN!,
      options: {
        expiresIn: 60 * 60,
        jwtid: jwtId,
      },
    });
    const refresh_token = await generateToken({
      payload: { id: req?.user?._id, email: req?.user?.email },
      signature:
        req?.user?.role == roleType.admin
          ? process.env.SIGNATURE_REFRESH_ADMIN!
          : process.env.SIGNATURE_REFRESH_USER!,
      options: { expiresIn: "1y", jwtid: jwtId },
    });

    await this._revokeTokenModel.create({
      tokenId: req.decoded.jti!,
      userId: req.user._id!,
      expAt: new Date(req?.decoded?.exp! * 1000),
    });

    return res
      .status(200)
      .json({ message: "success", accessToken, refresh_token });
  };
  loginWithGmail = async (req: Request, res: Response, next: NextFunction) => {
    const { idToken }: loginWithGmailSchemaType = req.body;
    const client = new OAuth2Client();
    async function verify() {
      const ticket = await client.verifyIdToken({
        idToken: idToken,
        audience: process.env.GOOGLE_CLIENT_ID!,
      });
      const payLoad = ticket.getPayload();

      console.log(process.env.GOOGLE_CLIENT_ID);

      return payLoad;
    }

    const { email, email_verified, name, picture } =
      (await verify()) as TokenPayload;

    let user = await this._userModel.findOne({ email });
    if (user?.provider == providerType.system) {
      throw new AppError(" you must signUp first");
    }
    if (!user) {
      user = await this._userModel.create({
        email: email!,
        userName: name!,
        confirmed: email_verified!,
        image: picture!,
        provider: providerType.google!,
        password: uuidv4()!,
      });
    }
    const jwtId = uuidv4();
    const accessToken = await generateToken({
      payload: { id: user._id, email },
      signature:
        user.role == roleType.user
          ? process.env.SIGNATURE_access_USER!
          : process.env.SIGNATURE_access_ADMIN!,
      options: {
        expiresIn: 60 * 60,
        jwtid: jwtId,
      },
    });
    const refresh_token = await generateToken({
      payload: { id: user._id, email },
      signature:
        user.role == roleType.admin
          ? process.env.SIGNATURE_REFRESH_ADMIN!
          : process.env.SIGNATURE_REFRESH_USER!,
      options: { expiresIn: "1y", jwtid: jwtId },
    });

    return res
      .status(200)
      .json({ message: "success", accessToken, refresh_token });
  };
  forgetPass = async (req: Request, res: Response, next: NextFunction) => {
    const { email }: forgetPassSchemaType = req.body;
    const user = await this._userModel.findOne({
      email,
    });
    if (!user) {
      throw new AppError("this user not exist or not confirmed yet ", 404);
    }
    const otp = await generateOtp();
    const hashOtp = await Hash(String(otp));
    eventEmitter.emit("forgetPass", { email, otp });
    await this._userModel.updateOne({ email: user?.email }, { otp: hashOtp });

    return res.status(200).json({ message: "success sent otp" });
  };
  resetPass = async (req: Request, res: Response, next: NextFunction) => {
    const { email, otp, password, cPassword }: resetPassSchemaType = req.body;
    const user = await this._userModel.findOne({
      email,
    });
    if (!user) {
      throw new AppError("this user not exist or not confirmed yet ", 404);
    }
    if (!(await Compare(otp, user?.otp!))) {
      throw new AppError("wrong otp");
    }
    const hashPass = await Hash(password);
    await this._userModel.updateOne(
      { email: email },
      {
        password: hashPass,
        $unset: { opt: "" },
      }
    );

    return res.status(200).json({ message: "success " });
  };
  updatePass = async (req: Request, res: Response, next: NextFunction) => {
    const { oldPassword, newPassword }: updatePasswordSchemaType = req.body;
    const user = await this._userModel.findOne({ email: req.user.email });
    if (!user) {
      throw new AppError("user not found", 404);
    }
    if (!(await Compare(oldPassword, user.password))) {
      throw new AppError("incorrect Password", 401);
    }
    user.password = newPassword;
    await user.save();
    return res.status(200).json({ message: "Updated Successfully" });
  };
  updateInfo = async (req: Request, res: Response, next: NextFunction) => {
    const { userName, phone, address, age }: updateInfoSchemaType = req.body;
    const user = await this._userModel.findOne({ email: req.user.email });
    if (!user) {
      throw new AppError("this user isn't exist", 404);
    }
    if (userName) {
      user.userName = userName;
    }
    if (phone) {
      user.phone = phone;
    }
    if (address) {
      user.address = address;
    }
    if (age) {
      user.age = age;
    }
    await user.save();

    return res.status(200).json({ message: "Updated Successfully" });
  };
  updateEmail = async (req: Request, res: Response, next: NextFunction) => {
    const { email }: updateEmailSchemaType = req.body;
    const user = await this._userModel.findOne({ email: req.user.email });
    if (!user) {
      throw new AppError("this user isn't exist", 404);
    }
    user.email = email;
    await user.save();
    return res.status(200).json({ message: "Updated Successfully" });
  };

  uploadProfileImage = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const { originalName, ContentType } = req.body;
    const { url, Key } = await uploadWithSignedUrl({
      originalName,
      ContentType,
      path: `users/${req.user._id}`,
    });
    const user = await this._userModel.findOneAndUpdate(
      {
        _id: req.user._id,
      },
      {
        profileImage: Key,
        tempProfileImage: req.user.profileImage,
      }
    );
    if (!user) {
      throw new AppError("this user not found", 404);
    }
    eventEmitter.emit("uploadProfile", {
      userId: req.user._id,
      oldKey: req.user.profileImage,
      Key,
      expiresIn: 60,
    });
    return res.status(200).json({ message: "uploaded success", url });
  };
  freezeAccount = async (req: Request, res: Response, next: NextFunction) => {
    const { userId }: freezeSchemaType = req.params as freezeSchemaType;
    if (userId && req.user.role !== roleType.admin) {
      throw new AppError("Unauthorized", 401);
    }
    const user = await this._userModel.findOneAndUpdate(
      {
        _id: userId || req.user._id,
        deletedBy: { $exists: false },
        deletedAt: { $exists: false },
      },
      {
        deletedBy: req.user._id,
        changeCredentials: Date.now(),
        deletedAt: Date.now(),
      }
    );
    if (!user) {
      throw new AppError("user Not found or already freezed", 404);
    }
    return res.status(200).json({ message: "Freezed" });
  };

  unfreezeAccount = async (req: Request, res: Response, next: NextFunction) => {
    const { userId }: unfreezeSchemaType = req.params as unfreezeSchemaType;
    if (req.user.role !== roleType.admin) {
      throw new AppError("Unauthorized", 401);
    }
    const user = await this._userModel.findOneAndUpdate(
      { _id: userId, deletedAt: { $exists: true }, deletedBy: req.user._id },
      {
        $unset: { deletedBy: "", deletedAt: "" },
        restoreBy: req.user._id,
        restoreAt: Date.now(),
      }
    );
    if (!user) {
      throw new AppError("user Not found or already unfreeze", 404);
    }
    return res.status(200).json({ message: "UnFreezed" });
  };
  dashBoard = async (req: Request, res: Response, next: NextFunction) => {
    const result = await Promise.allSettled([
      this._userModel.find({ filter: {} }),
      this._postModel.find({ filter: {} }),
    ]);

    return res.status(200).json({ message: "success", result });
  };
  updateRole = async (req: Request, res: Response, next: NextFunction) => {
    const { role: newRole } = req.body;
    const { userId } = req.params;
    // no one can update superAdmin
    // no one can update the same level
    const denyRoles = [newRole, roleType.superAdmin];
    if (req.user.role == roleType.admin) {
      denyRoles.push(roleType.admin);
      if (newRole === roleType.superAdmin) {
        throw new AppError("unauthorized", 401);
      }
    }
    const user = await this._userModel.findOneAndUpdate(
      { _id: req.user._id, role: { $nin: denyRoles } },
      { role: newRole },
      { new: true }
    );
    if (!user) {
      throw new AppError("unauthorized", 401);
    }
    return res.status(200).json({ message: "success", user });
  };
  sendRequest = async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = req.params as sendRequestSchemaType;

    if (userId == req?.user?._id.toString()) {
      throw new AppError("you can't send request to yourself", 400);
    }
    const user = await this._userModel.findOne({ _id: userId });
    if (!user) {
      throw new AppError("user not found", 404);
    }

    const checkFriend = await this._friendModel.findOne({
      sendBy: { $in: [req.user._id, userId] },
      sendTo: { $in: [req.user._id, userId] },
    });
    if (checkFriend) {
      throw new AppError("request already sent");
    }
    const friend = await this._friendModel.create({
      sendBy: req?.user._id,
      sendTo: userId as unknown as Types.ObjectId,
    });
    return res.status(200).json({ message: "sent successfully", friend });
  };

  acceptRequest = async (req: Request, res: Response, next: NextFunction) => {
    const { requestId } = req.params as acceptRequestSchemaType;

    const request = (await this._friendModel.findOneAndUpdate(
      {
        _id: requestId,
        sendTo: req.user._id,
        acceptedAt: { $exists: false },
      },
      {
        acceptedAt: Date.now(),
      },
      { new: true }
    )) as unknown as HydratedDocument<IFriend>;

    if (!request) {
      throw new AppError("you didn't send any request", 404);
    }

    await this._userModel.updateOne(
      { _id: request.sendTo },
      { $addToSet: { friends: request.sendBy } }
    );

    await this._userModel.updateOne(
      { _id: request.sendBy },
      { $addToSet: { friends: request.sendTo } }
    );

    return res.status(200).json({
      message: "Accepted successfully",
      request,
    });
  };
}

export default new UserService();
