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

//  ========== SUB-SCHEMAS ==========

const ResFriendUserSchema = z.object({
  id: z.number().int().positive(),
  name: z.string(),
  avatarKey: z.string().nullable().optional(),
  onlineStatus: z.boolean().nullable().optional(),
});
export type ResFriendUser = z.infer<typeof ResFriendUserSchema>;

// ========== RESPONSE SCHEMAS ==========

// Friend request -> response schema
export const ResFriendRequestSchema = z.strictObject({
  id: z.string().uuid({}),
  requesterId: z.coerce.number().int().positive(),
  receiverId: z.coerce.number().int().positive(),
  createdAt: z.date(),
  requester: ResFriendUserSchema,
  receiver: ResFriendUserSchema,
});

export type ResFriendRequest = z.infer<typeof ResFriendRequestSchema>;

// List incoming/outgoing friend requests with pagination
export const ResListFriendRequestSchema = z.strictObject({
  data: z.array(ResFriendRequestSchema),
  pagination: z.object({
    nextCursor: z.string().nullable(),
    hasMore: z.boolean(),
  }),
});

export type ResListFriendRequest = z.infer<typeof ResListFriendRequestSchema>;

// Friend -> response schema
export const ResFriendSchema = z.strictObject({
  id: z.string().uuid({}),
  userId: z.coerce.number().int().positive(),
  friendId: z.coerce.number().int().positive(),
  createdAt: z.date(),
  friend: ResFriendUserSchema,
});

export type ResFriendBase = z.infer<typeof ResFriendSchema>;

// List friends with pagination
export const ResListFriendSchema = z.strictObject({
  data: z.array(ResFriendSchema),
  pagination: z.object({
    nextCursor: z.string().nullable(),
    hasMore: z.boolean(),
    total: z.number().optional(),
  }),
});

export type ResListFriend = z.infer<typeof ResListFriendSchema>;

// Friendship status response
export const ResFriendshipStatusSchema = z.object({
  status: z.enum(['none', 'pending_sent', 'pending_received', 'friends', 'self']),
});
export type ResFriendshipStatus = z.infer<typeof ResFriendshipStatusSchema>;
