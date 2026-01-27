import { z } from 'zod';

// Shared Port Schema
export const sharedPortsSchema = z.object({
  BE_PORT: z.coerce.number().default(3000),
  FE_PORT: z.coerce.number().default(5173),
  DB_PORT: z.coerce.number().default(5432),
  MINIO_PORT: z.coerce.number().default(9000),
  MINIO_DASHBOARD_PORT: z.coerce.number().default(9001),
});

// Shared Auth Rules
export const AUTH_CONFIG = {
  JWT_SECRET_MIN_LENGTH: 16,
  PASSWORD_MIN_LENGTH: 10,
};

// Shared Auth Schema
export const LoginSchema = z.object({
  email: z.string('Please enter a valid email address'),
  password: z.string().min(AUTH_CONFIG.PASSWORD_MIN_LENGTH, {
    message: `Password must be at least ${AUTH_CONFIG.PASSWORD_MIN_LENGTH} characters`,
  }),
});

export type LoginInput = z.infer<typeof LoginSchema>;

// Shared Event Rules
export const EVENT_CONFIG = {
  TITLE_MIN_LENGTH: 1,
  TITLE_MAX_LENGTH: 100,
  DESCRIPTION_MAX_LENGTH: 2000,
};

export const CreateEventSchema = z.object({
  isPublic: z.boolean(),
  isPublished: z.boolean(),
  title: z
    .string()
    .min(EVENT_CONFIG.TITLE_MIN_LENGTH, 'Name is required')
    .max(
      EVENT_CONFIG.TITLE_MAX_LENGTH,
      `Name must be at most ${EVENT_CONFIG.TITLE_MAX_LENGTH} characters long`
    )
    .trim(),
  content: z.string().max(EVENT_CONFIG.DESCRIPTION_MAX_LENGTH).optional(),
  startAt: z.date({ error: 'Start date is required' }),
  endAt: z.date({ error: 'End date is required' }),
  locationId: z.string().optional(),
});

export type CreateEventInput = z.infer<typeof CreateEventSchema>;
