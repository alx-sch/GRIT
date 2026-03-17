import {
  ResUserBaseSchema,
  ResUserEventsSchema,
  ResMyEventsPaginatedSchema,
  ResMyInvitedEventsPaginatedSchema,
} from '@grit/schema';
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
  search: z.string().min(1).optional(),
});

// Get user events with pagination
export const ReqUserEventsGetAllSchema = z.strictObject({
  limit: z.coerce.number().int().positive().max(100).default(20),
  cursor: z.string().optional(),
});

// Post a new user draft
export const ReqUserPostSchema = z.object({
  name: z.string(),
  email: z.email(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain an uppercase letter')
    .regex(/[a-z]/, 'Must contain a lowercase letter')
    .regex(/[0-9]/, 'Must contain a number'),
  avatarKey: z.string().optional(),
});

// Patch a user (password and email left out - need dedicated route for
// verifications)
export const ReqUserPatchSchema = z.strictObject({
  name: z.string().optional(),
  bio: z
    .string()
    .trim()
    .max(150)
    .transform((v) => (v === '' ? null : v))
    .optional(),
  city: z
    .string()
    .trim()
    .transform((v) => (v === '' ? null : v))
    .optional(),
  country: z
    .string()
    .trim()
    .transform((v) => (v === '' ? null : v))
    .optional(),
  isProfilePublic: z.boolean().optional(),
  attending: z
    .strictObject({
      connect: z.array(z.number().int().positive()).optional(),
      disconnect: z.array(z.number().int().positive()).optional(),
    })
    .optional(),
});

// Patch a user
export const ReqUserPatchByIdSchema = z.strictObject({
  id: z.coerce.number().int().positive(),
});
export const ResUserPatchSchema = ResUserBaseSchema;

// Get an individual user by id
export const ReqUserGetByIdSchema = z.strictObject({
  id: z.coerce.number().int().positive(),
});
export const ResUserGetByIdSchema = ResUserBaseSchema;

// Delete a user
export const ReqUserDeleteByIdSchema = z.strictObject({
  id: z.coerce.number().int().positive(),
});
export const ResUserDeleteSchema = ResUserBaseSchema;

// Delete a user's avatar
export const ReqUserDeleteAvatarSchema = z.strictObject({
  id: z.coerce.number().int().positive(),
});

// --- DTO classes ---
export class ResUserBaseDto extends createZodDto(ResUserBaseSchema) {}
export class ReqUserGetAllDto extends createZodDto(ReqUserGetAllSchema) {}
export class ResUserPostDto extends createZodDto(ResUserPostSchema) {}
export class ReqUserPostDto extends createZodDto(ReqUserPostSchema) {}
export class ResUserEventsDto extends createZodDto(ResUserEventsSchema) {}
export class ResMyEventsDto extends createZodDto(ResMyEventsPaginatedSchema) {}
export class ResMyInvitedEventsDto extends createZodDto(ResMyInvitedEventsPaginatedSchema) {}
export class ReqUserConfirmDto extends createZodDto(ReqUserConfirmSchema) {}
export class ReqUserGetByIdDto extends createZodDto(ReqUserGetByIdSchema) {}
export class ReqUserDeleteAvatarDto extends createZodDto(ReqUserDeleteAvatarSchema) {}
export class ReqUserDeleteByIdDto extends createZodDto(ReqUserDeleteByIdSchema) {}
export class ReqUserPatchDto extends createZodDto(ReqUserPatchSchema) {}
export class ReqUserPatchByIdDto extends createZodDto(ReqUserPatchByIdSchema) {}
export class ReqUserEventsGetAllDto extends createZodDto(ReqUserEventsGetAllSchema) {}
