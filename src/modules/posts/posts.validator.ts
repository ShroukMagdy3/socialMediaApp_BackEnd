
import z from "zod";
import { AllowCommentEnum, AvailabilityEnum } from "../../DB/models/post.model";
import { generalRules } from "../../utilities/generalRules";
import { Types } from "mongoose";


export enum actionEnum {
    like = "like" ,
    unlike ="unlike"
}
export const createPostSchema ={
    body:z.strictObject({
        content:z.string().min(5).max(10000).optional(),
        attachments :z.array(generalRules.file).min(1).optional(),
        assetFolderId :z.string().optional(),

        AllowComment:z.enum(AllowCommentEnum).default(AllowCommentEnum.allow).optional(),
        Availability:z.enum(AvailabilityEnum).default(AvailabilityEnum.public).optional(),

        // not allowed to duplicate mention
        tags:z.array(generalRules.id).refine((value) =>{
            return new Set(value).size === value.length
        } ,{
            message:"duplicate tags"
        }).optional()
    }).superRefine((value , ctx) =>{
        if(!value.content && value.attachments?.length==0){
            ctx.addIssue({
                code:"custom",
                path:["content"],
                message:"content is empty"
            })
        }
    })
}

export const likePostSchema ={
    params :z.strictObject({
        postId:generalRules.id
    }).required(),
    query:z.strictObject({
        action:z.enum(actionEnum).default(actionEnum.like)
    }).required()
}

export const updateSchema ={
    body:z.strictObject({
        content:z.string().min(5).max(10000).optional(),
        attachments :z.array(generalRules.file).optional(),
        AllowComment:z.enum(AllowCommentEnum).default(AllowCommentEnum.allow).optional(),
        Availability:z.enum(AvailabilityEnum).default(AvailabilityEnum.public).optional(),

        // not allowed to duplicate mention
        tags:z.array(generalRules.id).refine((value) =>{
            return new Set(value).size === value.length
        } ,{
            message:"duplicate tags"
        }).optional()
    }).superRefine((value , ctx) =>{
        if(!Object.values(value).length ){
            ctx.addIssue({
                code:"custom",
                message:"at least one field is required"
            })
        }
    })
}
export const freezeSchema ={
    params:z.strictObject({
        postId:z.string()
      }).refine((value) =>{
        return value.postId ? Types.ObjectId.isValid(value.postId) :true
      },{
        message:"post ID is required",
        path: ["PostId"]
      })
}


export type likePostSchemaType = z.infer<typeof likePostSchema.params>;
export type updateSchemaType = z.infer<typeof updateSchema.body>;
export type freezeSchemaType = z.infer<typeof freezeSchema.params>;
