import { z } from 'zod';
import { ResEventLocationSchema } from './event.js';

export const ResUserEventSchema = z.object({
  id: z.number().int().positive(),
  title: z.string(),
  startAt: z.iso.datetime(),
  isOrganizer: z.boolean(),
  imageKey: z.string().nullable().optional(),
  location: ResEventLocationSchema.nullable().optional(),
});
export const ResUserEventsSchema = z.array(ResUserEventSchema);
export type ResUserEvents = z.infer<typeof ResUserEventsSchema>;

export const ResUserBaseSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().nullable(),
  email: z.email(),
  avatarKey: z.string().nullable().optional(),
  isConfirmed: z.boolean().default(false),
  attending: z.array(ResUserEventSchema).default([]),
  createdAt: z.iso.datetime(),
});
export type ResUserBase = z.infer<typeof ResUserBaseSchema>;

export const ResUserPublicSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().nullable(),
  avatarKey: z.string().nullable().optional(),
});
export type ResUserPublic = z.infer<typeof ResUserPublicSchema>;

// Paginated response
export const ResUserGetAllSchema = z.object({
  data: z.array(ResUserPublicSchema),
  pagination: z.object({ nextCursor: z.string().nullable(), hasMore: z.boolean() }),
});
export type ResUserGetAll = z.infer<typeof ResUserGetAllSchema>;
