import { z } from 'zod';

export const conversationBaseSchema = z.object({
  id: z.uuid(),
  type: z.string(),
  title: z.string().nullable().optional(),
  eventId: z.uuid().nullable().optional(),
});
export type ConversationBase = z.infer<typeof conversationBaseSchema>;

export const conversationCreateReqSchema = z.object({
  type: z.string(),
  eventId: z.number().int().positive(),
  directId: z.number().int().positive(),
  groupIds: z.array(z.number().int().positive()),
});
export type ConversationCreateReq = z.infer<typeof conversationCreateReqSchema>;

export const conversationResSchema = conversationBaseSchema;
export type ConversationRes = z.infer<typeof conversationResSchema>;
