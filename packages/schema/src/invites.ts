import { z } from 'zod';

export enum InviteStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  DECLINED = 'DECLINED',
}

// ========== REQUEST SCHEMAS ==========

// Send event invite
export const ReqInviteSchema = z.strictObject({
  eventId: z.coerce.number().int().positive(),
  receiverId: z.coerce.number().int().positive(),
});

// Accept/decline invite
export const ReqUpdateInviteSchema = z.strictObject({
  status: z.nativeEnum(InviteStatus),
});

//  ========== SUB-SCHEMAS ==========

// User info in invite
const ResInviteUserSchema = z.object({
  id: z.number().int().positive(),
  name: z.string(),
  avatarKey: z.string().nullable().optional(),
  onlineStatus: z.boolean().nullable().optional(),
});
export type ResInviteUser = z.infer<typeof ResInviteUserSchema>;

// Event info in invite
const ResInviteEventSchema = z.object({
  id: z.number().int().positive(),
  title: z.string(),
  imageKey: z.string().nullable().optional(),
});
export type ResInviteEvent = z.infer<typeof ResInviteEventSchema>;

// ========== RESPONSE SCHEMAS ==========

// Event invite -> response schema
export const ResInviteSchema = z.strictObject({
  id: z.string().uuid({}),
  eventId: z.coerce.number().int().positive(),
  senderId: z.coerce.number().int().positive(),
  receiverId: z.coerce.number().int().positive(),
  status: z.nativeEnum(InviteStatus),
  createdAt: z.date(),
  updatedAt: z.date(),
  event: ResInviteEventSchema,
  sender: ResInviteUserSchema,
  receiver: ResInviteUserSchema,
});

export type ResInvite = z.infer<typeof ResInviteSchema>;

// List event invites
export const ResListInvitesSchema = z.object({
  data: z.array(ResInviteSchema),
  pagination: z.object({
    nextCursor: z.string().nullable(),
    hasMore: z.boolean(),
  }),
});
export type ResListInvites = z.infer<typeof ResListInvitesSchema>;
