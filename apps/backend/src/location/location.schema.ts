import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

/**
 * SHARED RESPONSE SCHEMAS
 */

const ResLocationEventIdSchema = z.object({
  id: z.number().int().positive(),
  title: z.string().nullable(),
});

// Response schema for the basic location info
export const ResLocationBaseSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().nullable(),
  events: z.array(ResLocationEventIdSchema).nullable().default([]),
});

/**
 * REQ / RES SCHEMAS FOR ROUTES
 */

// Get all locations
export const ReqLocationGetAllSchema = z.strictObject({
  limit: z.coerce.number().int().positive().max(100).default(20),
  cursor: z.string().optional(),
});
export class ReqLocationGetAllDto extends createZodDto(ReqLocationGetAllSchema) {}
export const ResLocationGetAllSchema = z.object({
  data: z.array(ResLocationBaseSchema),
  pagination: z.object({
    nextCursor: z.string().nullable(),
    hasMore: z.boolean(),
  }),
});

// Post a new location draft
export const ReqLocationPostSchema = z.strictObject({
  authorId: z.number().int().positive(),
  name: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  isPublic: z.boolean().optional().default(false),
});
export class ReqLocationPostDto extends createZodDto(ReqLocationPostSchema) {}
export const ResLocationPostSchema = z.object({}).loose(); // return everything

// Delete an event
export const ReqLocationDeleteSchema = z.strictObject({
  id: z.coerce.number().int().positive(),
});
export class ReqLocationDeleteDto extends createZodDto(ReqLocationDeleteSchema) {}
export const ResLocationDeleteSchema = ResLocationBaseSchema;
