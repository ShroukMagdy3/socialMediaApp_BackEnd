import { Request, NextFunction, Response } from "express";
import { roleType } from "../DB/models/users.model";
import { AppError } from "../utilities/classError";
import { GraphQLError } from "graphql";

export const Authorization = ({ role = [] }: { role: roleType[] }) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!role.includes(req.user?.role! as roleType)) {
      throw new AppError("Unauthorized", 401);
    }
    return next();
  };
};
export const AuthorizationGraphQl = ({ role  , accessRole=[]  }: { role: roleType  , accessRole: roleType[]}) => {
  if (!accessRole.includes(role)) {
    throw new GraphQLError("unauthorized", {
      extensions: { message: "unauthorized", statusCode: 401 },
    });
  }
  return true;
};
