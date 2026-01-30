import { z } from 'zod';

// Port Schema
export const sharedPortsSchema = z.object({
  BE_PORT: z.coerce.number().default(3000),
  FE_PORT: z.coerce.number().default(5173),
  DB_PORT: z.coerce.number().default(5432),
  MINIO_PORT: z.coerce.number().default(9000),
  MINIO_DASHBOARD_PORT: z.coerce.number().default(9001),
});

// Auth Rules
export const AUTH_CONFIG = {
  JWT_SECRET_MIN_LENGTH: 16,
  PASSWORD_MIN_LENGTH: 8,
};

// Auth Schema
export const LoginSchema = z.object({
  email: z.string('Please enter a valid email address'),
  password: z.string().min(AUTH_CONFIG.PASSWORD_MIN_LENGTH, {
    message: `Password must be at least ${AUTH_CONFIG.PASSWORD_MIN_LENGTH} characters`,
  }),
});
export type LoginInput = z.infer<typeof LoginSchema>;

// Chat Message sent from client
export const ChatMessageCreateSchema = z.object({
  eventId: z.number(),
  text: z.string(),
});
export type ChatMessageCreate = z.infer<typeof ChatMessageCreateSchema>;

// Chat Message sent from server
export const ChatMessageSchema = z.object({
  eventId: z.number(),
  text: z.string(),
  time: z.iso.datetime(),
  userId: z.number(),
  userName: z.string(),
});

export type ChatMessage = z.infer<typeof ChatMessageSchema>;
