import { z } from 'zod';

// Friend request schema
export const ReqFriendRequestSchema = z.strictObject({
  receiverId: z.coerce.number().int().positive(),
});

export const ResFriendRequestSchema = z.strictObject({
  id: z.string().uuid({}),
  requesterId: z.coerce.number().int().positive(),
  receiverId: z.coerce.number().int().positive(),
  createdAt: z.date(),
});

// List incoming/outgoing friend requests
export const ResListFriendRequestSchema = z.strictObject({
  data: z.array(ResFriendRequestSchema),
});

// Friend action (accept, delete, etc) schema
export const ReqFriendActionSchema = z.strictObject({
  id: z.string().uuid({}),
});

export const ResFriendSchema = z.strictObject({
  id: z.string().uuid({}),
  userId: z.coerce.number().int().positive(),
  friendId: z.coerce.number().int().positive(),
  createdAt: z.date(),
});
