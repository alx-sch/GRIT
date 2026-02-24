import { z } from 'zod';

// Friend request -> request schema
export const ReqFriendRequestSchema = z.strictObject({
  receiverId: z.coerce.number().int().positive(),
});

// Friend request -> response schema
export const ResFriendRequestSchema = z.strictObject({
  id: z.string().uuid({}),
  requesterId: z.coerce.number().int().positive(),
  receiverId: z.coerce.number().int().positive(),
  createdAt: z.date(),
});

// List incoming/outgoing friend requests -> response schema
export const ResListFriendRequestSchema = z.strictObject({
  data: z.array(ResFriendRequestSchema),
});

// Friend action (accept, delete, etc) -> request schema
export const ReqFriendActionSchema = z.strictObject({
  id: z.string().uuid({}),
});

// Friend -> response schema
export const ResFriendSchema = z.strictObject({
  id: z.string().uuid({}),
  userId: z.coerce.number().int().positive(),
  friendId: z.coerce.number().int().positive(),
  createdAt: z.date(),
});

// List friends -> response schema
export const ResListFriendSchema = z.strictObject({
  data: z.array(ResFriendSchema),
});
