import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

/**
 * SHARED RESPONSE SCHEMAS
 */

// Response schema for the event object that can get sent as a subitem in the user response
export const ResEventUserSchema = z.object({
  title: z.string(),
});

export const ResUserEventsSchema = z.array(ResEventUserSchema);

// Response schema for the basic user info
export const ResUserBaseSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().nullable(),
  email: z.email(),
  avatarKey: z.string().nullable(),
  isConfirmed: z.boolean().default(false),
  attending: z.array(ResEventUserSchema).default([]),
});

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
export const ResUserGetAllSchema = z.object({
  data: z.array(ResUserBaseSchema),
  pagination: z.object({
    nextCursor: z.string().nullable(),
    hasMore: z.boolean(),
  }),
});

// Post a new user draft
export const ReqUserPostSchema = z.object({
  name: z.string().optional(),
  email: z.email(),
  password: z.string().min(8),
  avatarKey: z.string().optional(),
});

// Patch a user (to attend event)
export const ReqUserAttendSchema = z.strictObject({
  attending: z.number().int().positive(),
});
export class ReqUserAttendDto extends createZodDto(ReqUserAttendSchema) {}
export const ResUserAttendSchema = ResUserBaseSchema;

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
