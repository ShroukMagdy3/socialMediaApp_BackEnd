import jwt, {  JwtPayload } from "jsonwebtoken";
import { AppError } from "./classError";
import { UserRepository } from "../DB/Repositories/user.repository";
import userModel from "../DB/models/users.model";
import revokeTokenModel from "../DB/models/revokeToken.model";
import { revokeTokenRepository } from "../DB/Repositories/revokeToken.repository";

export const generateToken = async ({
  payload,
  signature,
  options,
}: {
  payload: Object;
  signature: string;
  options: jwt.SignOptions;
}): Promise<string> => {
  return jwt.sign(payload, signature, options);
};

export const verifyToken = async ({
  token,
  signature,
}: {
  token: string;
  signature: string;
}): Promise<JwtPayload> => {
  return jwt.verify(token, signature) as JwtPayload;
};

export enum TokenType {
  access = "access",
  refresh = "refresh",
}
const _userModel = new UserRepository(userModel);
const _revokeTokenModel = new revokeTokenRepository(revokeTokenModel);

export const getSignature = (tokenType: TokenType, prefix: string) => {
  if (tokenType === TokenType.access) {
    if (prefix === process.env.BEARER_USER) {
      return process.env.SIGNATURE_access_USER;
    } else if (prefix == process.env.BEARER_ADMIN) {
      return process.env.SIGNATURE_access_ADMIN;
    } else {
      return null;
    }
  } else if (tokenType == TokenType.refresh) {
    if (prefix === process.env.BEARER_USER) {
      return process.env.SIGNATURE_REFRESH_USER;
    } else if (prefix == process.env.BEARER_ADMIN) {
      return process.env.SIGNATURE_REFRESH_ADMIN;
    } else {
      return null;
    }
  }
  return null;
};

export const decodedTokenAndFetch = async (
  token: string,
  signature: string
) => {
  const decoded = await verifyToken({ token, signature });
  if (!decoded) {
    throw new AppError("invalid token", 400);
  }
  const user = await _userModel.findOne({
    email: decoded.email,
    confirmed: true,
  });
  if (!user) {
    throw new AppError("user not exist", 404);
  }
  if(!user.confirmed){
    throw new AppError("please confirm email");
  }
  
  if (await _revokeTokenModel.findOne({ tokenId: decoded.jti })) {
    throw new AppError("token has been revoked", 401);
  }
  if(user?.changeCredentials?.getTime()! > decoded.iat! * 1000){
    throw new AppError("token has been revoked , credentials has been changed  ", 401);
  }
  
  return { decoded, user };
};
