import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

/**
 * SHARED RESPONSE SCHEMAS
 */

// Response schema for the event object that can get sent as a subitem in the user response
export const ResEventUserSchema = z.object({
  content: z.string().nullable(),
  createdAt: z.date(),
  endAt: z.date().nullable(),
  isPublished: z.boolean(),
  isPublic: z.boolean(),
  startAt: z.date().nullable(),
  title: z.string(),
  imageKey: z.string().nullable(),
  locationId: z.number().int().positive().nullable(),
});

// Response schema for the basic user info
export const ResUserBaseSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().nullable(),
  attending: z.array(ResEventUserSchema).default([]),
});

/**
 * REQ / RES SCHEMAS FOR ROUTES
 */

// Get all users
export const ReqUserGetAllSchema = z.strictObject({});
export class ReqUserGetAllDto extends createZodDto(ReqUserGetAllSchema) {}
export const ResUserGetAllSchema = z.array(ResUserBaseSchema);

// Post a new user draft
export const ReqUserPostSchema = z.object({
  name: z.string().optional(),
  email: z.email(),
});
export class ReqUserPostDto extends createZodDto(ReqUserPostSchema) {}
export const ResUserPostSchema = z.object({}).loose(); // return everything

// Patch a user (to attend event)
export const ReqUserAttendSchema = z.strictObject({
  attending: z.number().int().positive().optional(),
});
export class ReqUserAttendDto extends createZodDto(ReqUserAttendSchema) {}
export const ResUserAttendSchema = ResUserBaseSchema;

// Get an individual user by id
export const ReqUserGetByIdSchema = z.strictObject({
  id: z.coerce.number().int().positive(),
});
export class ReqUserGetByIdDto extends createZodDto(ReqUserGetByIdSchema) {}
export const ResUserGetByIdSchema = ResUserBaseSchema;
