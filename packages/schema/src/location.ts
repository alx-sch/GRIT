import { z } from 'zod';

// Shared Location rules
export const LOCATION_CONFIG = {
  NAME_MIN_LENGTH: 1,
  NAME_MAX_LENGTH: 64,
};

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
