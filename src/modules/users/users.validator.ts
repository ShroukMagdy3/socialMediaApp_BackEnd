import { Type } from "@aws-sdk/client-s3";
import { Types } from "mongoose";
import z, { email } from "zod";
import { generalRules } from "../../utilities/generalRules";

export enum flagType {
  all="all",
  current = "current"
}

export const signInSchema = {
  body: z
    .strictObject({
      password: z
        .string()
        .regex(
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
        ),
      email: z.string().email(),
    })
    .required(),
};

export const signUpSchema = {
  body: signInSchema.body.extend({
      userName: z.string().min(2).max(10),
      password: z
        .string()
        .regex(
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
        ),
      email: z.string().email(),
      cPassword: z.string(),
      age: z.number(),
      address: z.string(),
      phone: z.string(),
      gender: z.string(),
    })
    .required()
    .superRefine((data, context) => {
      if (data.password !== data.cPassword) {
        context.addIssue({
          code: "custom",
          path: ["cPassword"],
        });
      }
    }),
};
export const confirmEmailSchema = {
  body: z
    .object({
      email: z.string().email(),
      otp: z.string().regex(/^\d{6}$/),
    })
    .required(),
};
export const LogOutSchema = {
  body:z.strictObject({
    flag:z.enum([flagType.all, flagType.current])
  }).required()
}
export const loginWithGmailSchema={
  body:z.strictObject({
    idToken :z.string()
  }).required()
}

export const forgetPassSchema ={
  body :z.strictObject ({
   
      email:z.string()
  }).required()
}
export const resetPassSchema={
  body :forgetPassSchema.body.extend({
    password :z.string().regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/),
    cPassword :z.string(),
    otp:z.string().regex(/^\d{6}$/),
  }).required().superRefine((data, context) => {
      if (data.password !== data.cPassword) {
        context.addIssue({
          code: "custom",
          path: ["cPassword"],
        });
      }
    }),
  
}
export const updatePasswordSchema ={
  body :z.strictObject({
    oldPassword:z.string().regex( /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/),
    newPassword:z.string().regex( /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/),
  }).required()
}

export const updateInfoSchema ={
  body :z.strictObject({
    userName:z.string().optional(),
    age:z.number().optional(),
    address:z.string().optional(),
    phone:z.string().optional(),
  })
}
export const confirmEnable2FASchema ={
 body :z.strictObject({
    otp:z.string()
  }).required()
}
export const confirmLoginSchema ={
 body :z.strictObject({
    otp:z.string(),
    email:z.email()
  }).required()
}

export const updateEmailSchema ={
  body:forgetPassSchema.body.extend({
  }).required()
}

export const freezeSchema ={
  params:z.strictObject({
    userId:z.string().optional()
  }).refine((value) =>{
    return value.userId ? Types.ObjectId.isValid(value.userId) :true
  },{
    message:"user ID is required",
    path: ["userId"]
  })
}
export const unfreezeSchema ={
  params:z.strictObject({
    userId:z.string()
  }).required().refine((value) =>{
    return value.userId ? Types.ObjectId.isValid(value.userId) :true
  },{
    message:"user ID is required",
    path: ["userId"]
  })
}

export const sendRequestSchema ={
  params:z.strictObject({
    userId:generalRules.id
  }).required()
}
export const acceptRequestSchema ={
  params:z.strictObject({
    requestId:generalRules.id
  }).required()
}






export type signUpSchemaType = z.infer<typeof signUpSchema.body>;
export type signInSchemaType = z.infer<typeof signInSchema.body>;
export type confirmEmailSchemaType = z.infer<typeof confirmEmailSchema.body>;
export type LogOutSchemaType = z.infer<typeof LogOutSchema.body>;
export type loginWithGmailSchemaType = z.infer<typeof loginWithGmailSchema.body>;
export type forgetPassSchemaType = z.infer<typeof forgetPassSchema.body>;
export type resetPassSchemaType = z.infer<typeof resetPassSchema.body>;
export type updatePasswordSchemaType = z.infer<typeof updatePasswordSchema.body>;
export type updateInfoSchemaType = z.infer<typeof updateInfoSchema.body>;
export type updateEmailSchemaType = z.infer<typeof updateEmailSchema.body>;
export type confirmLoginType = z.infer<typeof confirmLoginSchema.body>;
export type confirmEnable2FASchemaType = z.infer<typeof confirmEnable2FASchema.body>;
export type freezeSchemaType = z.infer<typeof freezeSchema.params>;
export type unfreezeSchemaType = z.infer<typeof unfreezeSchema.params>;
export type sendRequestSchemaType = z.infer<typeof sendRequestSchema.params>;
export type acceptRequestSchemaType = z.infer<typeof acceptRequestSchema.params>;
