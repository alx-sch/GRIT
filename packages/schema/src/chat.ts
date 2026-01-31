import { z } from 'zod';

// Chat Message sent from client
export const ReqChatMessagePostSchema = z.object({
  text: z.string(),
});

// Chat Message sent from server
export const ResChatMessageSchema = z.object({
  eventId: z.number(),
  text: z.string(),
  sentAt: z.iso.datetime(),
  userId: z.number(),
  userName: z.string(),
  avatarKey: z.string(),
  id: z.string(),
});
export type ResChatMessage = z.infer<typeof ResChatMessageSchema>;

// Chat Join request sent from client
export const ReqChatJoinSchema = z.object({
  eventId: z.number().int().positive(),
});
