import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

/**
 * AUTH SNAPSHOT SCHEMA
 * This is the minimal user info returned for both Login and Rehydration (/auth/me)
 */
export const ResAuthMeSchema = z.object({
  id: z.number().int().positive(),
  email: z.email(),
  name: z.string().nullable(),
  avatarKey: z.string().nullable(),
});

/**
 * LOGIN REQUEST
 */
export const ReqAuthLoginSchema = z.object({
  email: z.email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

/**
 * LOGIN RESPONSE
 */
export const ResAuthLoginSchema = z.object({
  accessToken: z.string(),
  user: ResAuthMeSchema,
});

// --- DTO Classes ---
export class ReqAuthLoginDto extends createZodDto(ReqAuthLoginSchema) {}
export class ResAuthLoginDto extends createZodDto(ResAuthLoginSchema) {}
export class ResAuthMeDto extends createZodDto(ResAuthMeSchema) {}
