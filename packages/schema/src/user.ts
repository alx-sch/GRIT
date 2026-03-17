import { z } from 'zod';
import { ResEventLocationSchema } from './event.js';

export const ResUserEventSchema = z.object({
  id: z.number().int().positive(),
  title: z.string(),
  slug: z.string(),
  startAt: z.iso.datetime(),
  isOrganizer: z.boolean(),
  imageKey: z.string().nullable().optional(),
  location: ResEventLocationSchema.nullable().optional(),
});
export const ResUserEventsSchema = z.array(ResUserEventSchema);
export type ResUserEvents = z.infer<typeof ResUserEventsSchema>;

export const ResMyEventSchema = z.object({
  id: z.number().int().positive(),
  title: z.string(),
  slug: z.string(),
  startAt: z.iso.datetime(),
  endAt: z.iso.datetime(),
  isOrganizer: z.boolean(),
  imageKey: z.string().nullable().optional(),
  location: ResEventLocationSchema.nullable().optional(),
  conversationId: z.string().optional(),
  isPublished: z.boolean(),
  isPublic: z.boolean(),
});
export const ResMyEventsSchema = z.array(ResMyEventSchema);
export type ResMyEvents = z.infer<typeof ResMyEventsSchema>;

export const ResMyEventsPaginatedSchema = z.object({
  data: z.array(ResMyEventSchema),
  pagination: z.object({ nextCursor: z.string().nullable(), hasMore: z.boolean() }),
});
export type ResMyEventsPaginated = z.infer<typeof ResMyEventsPaginatedSchema>;

export const ResMyInvitedEventSchema = z.object({
  id: z.number().int().positive(),
  title: z.string(),
  slug: z.string(),
  startAt: z.iso.datetime(),
  endAt: z.iso.datetime(),
  isOrganizer: z.boolean(),
  imageKey: z.string().nullable().optional(),
  location: ResEventLocationSchema.nullable().optional(),
  conversationId: z.string().optional(),
  isPublished: z.boolean(),
  isPublic: z.boolean(),
  author: z.object({
    id: z.number().int().positive(),
    name: z.string(),
    avatarKey: z.string().nullable().optional(),
  }),
  invite: z
    .object({
      id: z.string(),
      status: z.string(),
    })
    .nullable()
    .optional(),
});
export const ResMyInvitedEventsSchema = z.array(ResMyInvitedEventSchema);
export type ResMyInvitedEvents = z.infer<typeof ResMyInvitedEventsSchema>;

export const ResMyInvitedEventsPaginatedSchema = z.object({
  data: z.array(ResMyInvitedEventSchema),
  pagination: z.object({ nextCursor: z.string().nullable(), hasMore: z.boolean() }),
});
export type ResMyInvitedEventsPaginated = z.infer<typeof ResMyInvitedEventsPaginatedSchema>;

export const ResUserBaseSchema = z.object({
  id: z.number().int().positive(),
  name: z.string(),
  email: z.email(),
  avatarKey: z.string().nullable().optional(),
  bio: z.string().max(150).nullable().optional(),
  city: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  isConfirmed: z.boolean().default(false),
  isProfilePublic: z.boolean().default(true),
  attending: z.array(ResUserEventSchema).default([]),
  isAdmin: z.boolean().default(false),
  createdAt: z.iso.datetime(),
});
export type ResUserBase = z.infer<typeof ResUserBaseSchema>;

export const ResUserPublicSchema = z.object({
  id: z.number().int().positive(),
  name: z.string(),
  avatarKey: z.string().nullable().optional(),
  bio: z.string().max(150).nullable().optional(),
  city: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  createdAt: z.iso.datetime(),
  isProfilePublic: z.boolean().optional(),
});
export type ResUserPublic = z.infer<typeof ResUserPublicSchema>;

// Schema for public events (hosted by user) - excludes context-dependent fields like isOrganizer
export const ResUserPublicEventSchema = z.object({
  id: z.number().int().positive(),
  title: z.string(),
  slug: z.string(),
  startAt: z.iso.datetime(),
  imageKey: z.string().nullable().optional(),
  location: ResEventLocationSchema.nullable().optional(),
});
export const ResUserPublicEventsSchema = z.array(ResUserPublicEventSchema);
export type ResUserPublicEvents = z.infer<typeof ResUserPublicEventsSchema>;

export const FriendshipStatusSchema = z.enum([
  'none',
  'pending_sent',
  'pending_received',
  'friends',
  'self',
]);
export type FriendshipStatus = z.infer<typeof FriendshipStatusSchema>;

// Paginated response
export const ResUserGetAllSchema = z.object({
  data: z.array(ResUserPublicSchema),
  pagination: z.object({ nextCursor: z.string().nullable(), hasMore: z.boolean() }),
});
export type ResUserGetAll = z.infer<typeof ResUserGetAllSchema>;

// Admin get all users
export const ResUserAdminGetAllSchema = z.array(ResUserBaseSchema);
export type ResUserAdminGetAll = z.infer<typeof ResUserAdminGetAllSchema>;
