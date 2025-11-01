import z from "zod";
import { generalRules } from "../../utilities/generalRules";

export const getGroupSchema = {
  params: z.strictObject({
    groupId: generalRules.id,
  }),
};
export const getChatSchema = {
  params: z.strictObject({
    userId: generalRules.id,
  }),
};
export const createGroupSchema = {
  body: z.strictObject({
    participant: z.array(generalRules.id).refine(
      (value) => {
        return new Set(value).size === value.length;
      },
      {
        message: "duplicate participant",
      }
    ),
    group: z.string(),
    attachment:generalRules.file.optional()
  }),
};

export type getGroupSchemaType = z.infer<typeof getGroupSchema.params>;
export type getChatSchemaType = z.infer<typeof getChatSchema.params>;
export type createGroupSchemaType = z.infer<typeof createGroupSchema.body>;
