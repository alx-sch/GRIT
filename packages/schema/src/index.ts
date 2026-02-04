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
  PASSWORD_MIN_LENGTH: 8,
};

// Shared Auth Schema
export const LoginSchema = z.object({
  email: z.email('Please enter a valid email address'),
  password: z.string().min(AUTH_CONFIG.PASSWORD_MIN_LENGTH, {
    message: `Password must be at least ${AUTH_CONFIG.PASSWORD_MIN_LENGTH} characters`,
  }),
});
export type LoginInput = z.infer<typeof LoginSchema>;

export const RegisterSchema = LoginSchema.extend({
  name: z.string().optional(),
});
export type RegisterInput = z.infer<typeof RegisterSchema>;

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
