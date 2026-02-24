import { z } from 'zod';

// ========== REQUEST SCHEMAS ==========

// Send friend request
export const ReqFriendRequestSchema = z.strictObject({
  receiverId: z.coerce.number().int().positive(),
});

// Get friend requests with pagination
export const ReqFriendRequestsGetAllSchema = z.strictObject({
  limit: z.coerce.number().int().positive().max(100).default(20),
  cursor: z.string().optional(),
});

// Get friends with pagination
export const ReqFriendsGetAllSchema = z.strictObject({
  limit: z.coerce.number().int().positive().max(100).default(20),
  cursor: z.string().optional(),
});

// ========== RESPONSE SCHEMAS ==========

// Friend request -> response schema
export const ResFriendRequestSchema = z.strictObject({
  id: z.string().uuid({}),
  requesterId: z.coerce.number().int().positive(),
  receiverId: z.coerce.number().int().positive(),
  createdAt: z.date(),
});

// List incoming/outgoing friend requests with pagination
export const ResListFriendRequestSchema = z.strictObject({
  data: z.array(ResFriendRequestSchema),
  pagination: z.object({
    nextCursor: z.string().nullable(),
    hasMore: z.boolean(),
  }),
});

// Friend -> response schema
export const ResFriendSchema = z.strictObject({
  id: z.string().uuid({}),
  userId: z.coerce.number().int().positive(),
  friendId: z.coerce.number().int().positive(),
  createdAt: z.date(),
});

// List friends with pagination
export const ResListFriendSchema = z.strictObject({
  data: z.array(ResFriendSchema),
  pagination: z.object({
    nextCursor: z.string().nullable(),
    hasMore: z.boolean(),
  }),
});
