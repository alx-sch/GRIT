import { z } from 'zod';

// Shared Event Rules
export const EVENT_CONFIG = {
  TITLE_MIN_LENGTH: 1,
  TITLE_MAX_LENGTH: 100,
  CONTENT_MAX_LENGTH: 2000,
};

// Sub-schemas for nested objects in event response
export const ResEventAuthorSchema = z.object({ id: z.number(), name: z.string() });
export const ResEventAttendeeSchema = z.object({ id: z.number(), name: z.string() });
export const ResEventLocationSchema = z.object({
  id: z.number().int().positive(),
  authorId: z.number().int().positive(),
  name: z.string().nullable(),
  city: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  longitude: z.number(),
  latitude: z.number(),
  isPublic: z.boolean(),
});

export const ResEventBaseSchema = z.object({
  id: z.number().int().positive(),
  authorId: z.number().int().positive().nullable(),
  author: ResEventAuthorSchema.nullable().optional(),
  content: z.string().nullable().optional(),
  conversation: z.object({ id: z.uuid() }).nullable().optional(),
  createdAt: z.date(),
  endAt: z.date(),
  imageKey: z.string().nullable().optional(),
  isPublished: z.boolean(),
  isPublic: z.boolean(),
  startAt: z.date(),
  title: z.string(),
  location: ResEventLocationSchema.nullable().optional(),
  attendees: z.array(ResEventAttendeeSchema).default([]),
});
export type ResEventBase = z.infer<typeof ResEventBaseSchema>;

// Paginated response
export const ResEventGetPublishedSchema = z.object({
  data: z.array(ResEventBaseSchema),
  pagination: z.object({ nextCursor: z.string().nullable(), hasMore: z.boolean() }),
});
export type ResEventGetPublished = z.infer<typeof ResEventGetPublishedSchema>;

// Shared event schema for creating an event
export const CreateEventSchema = z.object({
  isPublic: z.boolean(),
  isPublished: z.boolean(),
  title: z
    .string()
    .min(EVENT_CONFIG.TITLE_MIN_LENGTH, 'Name is required')
    .max(
      EVENT_CONFIG.TITLE_MAX_LENGTH,
      `Name must be at most ${EVENT_CONFIG.TITLE_MAX_LENGTH} characters
  long`
    )
    .trim(),
  content: z.string().max(EVENT_CONFIG.CONTENT_MAX_LENGTH).optional(),
  startAt: z.iso.datetime(),
  endAt: z.iso.datetime(),
  imageKey: z.string().optional(),
  locationId: z.number().int().positive().optional(),
});
export type CreateEventInput = z.infer<typeof CreateEventSchema>;
