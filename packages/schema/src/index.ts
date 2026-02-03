export * from './env.js';
export * from './auth.js';
export * from './chat.js';
import { z } from 'zod';

// Shared Event Rules
export const EVENT_CONFIG = {
  TITLE_MIN_LENGTH: 1,
  TITLE_MAX_LENGTH: 100,
  CONTENT_MAX_LENGTH: 2000,
};

//Shared event schema for creating an event
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
