import { z } from 'zod';

// Connection request from Client
export const ReqSocketAuthSchema = z.object({
  token: z.string(),
});

// Chat Message sent from client
export const ReqChatMessagePostSchema = z.object({
  text: z.string(),
});

// Chat Message sent from server
export const ResChatMessageSchema = z.object({
  id: z.uuid(),
  eventId: z.number().int().positive(),
  text: z.string(),
  createdAt: z.date(),
  author: z.object({
    id: z.number().int().positive(),
    name: z.string().nullable().optional(),
    avatarKey: z.string().nullable().optional(),
  }),
});
export type ResChatMessage = z.infer<typeof ResChatMessageSchema>;

// Chat Join request sent from client
export const ReqChatJoinSchema = z.object({
  eventId: z.number().int().positive(),
});
