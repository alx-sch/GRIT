import { z } from 'zod';

// Shared Location rules
export const LOCATION_CONFIG = {
  NAME_MIN_LENGTH: 1,
  NAME_MAX_LENGTH: 64,
};

export const ResLocationEventSchema = z.object({
  id: z.number().int().positive(),
  title: z.string().nullable(),
});

export const ResLocationBaseSchema = z.object({
  id: z.number().int().positive(),
  authorId: z.number().int().positive(),
  name: z.string().nullable(),
  city: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  longitude: z.number(),
  latitude: z.number(),
  isPublic: z.boolean(),
  address: z.string().nullable().optional(),
  postalCode: z.string().nullable().optional(),
  events: z.array(ResLocationEventSchema).default([]),
});

export type ResLocationBase = z.infer<typeof ResLocationBaseSchema>;

// Paginated response
export const ResLocationGetAllSchema = z.object({
  data: z.array(ResLocationBaseSchema),
  pagination: z.object({ nextCursor: z.string().nullable(), hasMore: z.boolean() }),
});
export type ResLocationGetAll = z.infer<typeof ResLocationGetAllSchema>;

// Shared location schema for creating a location
export const CreateLocationSchema = z.object({
  name: z
    .string()
    .min(LOCATION_CONFIG.NAME_MIN_LENGTH, 'Name is required')
    .max(
      LOCATION_CONFIG.NAME_MAX_LENGTH,
      `Name must be at most ${LOCATION_CONFIG.NAME_MAX_LENGTH} characters long`
    ),
  city: z.string().optional(),
  country: z.string().optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  isPublic: z.boolean().optional(),
  address: z.string().optional(),
  postalCode: z.string().optional(),
});

export type CreateLocationInput = z.infer<typeof CreateLocationSchema>;
