import { ResUserBaseSchema, ResUserEventsSchema } from '@grit/schema';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

// Response schema for creating new user
export const ResUserPostSchema = ResUserBaseSchema.extend({
  email: z.email(),
  message: z
    .string()
    .default('Registration successful. Please check your email to confirm your account.'),
});

// Schema for the email confirmation endpoint
export const ReqUserConfirmSchema = z.strictObject({
  token: z.string().min(1, 'Token is required'),
});

// Get all users
export const ReqUserGetAllSchema = z.strictObject({
  limit: z.coerce.number().int().positive().max(100).default(20),
  cursor: z.string().optional(),
});

// Post a new user draft
export const ReqUserPostSchema = z.object({
  name: z.string(),
  email: z.email(),
  password: z.string().min(8),
  avatarKey: z.string().optional(),
});

// Patch a user (password and email left out - need dedicated route for
// verifications)
export const ReqUserPatchSchema = z.strictObject({
  name: z.string().optional(),
  attending: z
    .strictObject({
      connect: z.array(z.number().int().positive()).optional(),
      disconnect: z.array(z.number().int().positive()).optional(),
    })
    .optional(),
});
export class ReqUserPatchDto extends createZodDto(ReqUserPatchSchema) {}
export const ResUserPatchSchema = ResUserBaseSchema;

// Get an individual user by id
export const ReqUserGetByIdSchema = z.strictObject({
  id: z.coerce.number().int().positive(),
});
export class ReqUserGetByIdDto extends createZodDto(ReqUserGetByIdSchema) {}
export const ResUserGetByIdSchema = ResUserBaseSchema;

// --- DTO classes ---
export class ResUserBaseDto extends createZodDto(ResUserBaseSchema) {}
export class ReqUserGetAllDto extends createZodDto(ReqUserGetAllSchema) {}
export class ResUserPostDto extends createZodDto(ResUserPostSchema) {}
export class ReqUserPostDto extends createZodDto(ReqUserPostSchema) {}
export class ResUserEventsDto extends createZodDto(ResUserEventsSchema) {}
export class ReqUserConfirmDto extends createZodDto(ReqUserConfirmSchema) {}
