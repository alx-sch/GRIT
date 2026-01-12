import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { ResEventBaseSchema } from '@/event/event.schema';

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
  authorId: z.number().int().positive(),
  name: z.string().nullable(),
  city: z.string().nullable(),
  country: z.string().nullable(),
  longitude: z.string(),
  latitude: z.string(),
  events: z.array(ResLocationEventIdSchema).nullable().default([]),
  isPublic: z.boolean(),
});

/**
 * REQ / RES SCHEMAS FOR ROUTES
 */

// Get all locations
export const ReqLocationGetAllSchema = z.strictObject({});
export class ReqLocationGetAllDto extends createZodDto(ReqLocationGetAllSchema) {}
export const ResLocationGetAllSchema = z.array(ResLocationBaseSchema);

// Post a new location draft
export const ReqLocationPostSchema = z.strictObject({
  authorId: z.number().int().positive(),
  name: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  longitude: z.string(),
  latitude: z.string(),
  isPublic: z.boolean().optional().default(false),
});
export class ReqLocationPostDto extends createZodDto(ReqLocationPostSchema) {}
export const ResLocationPostSchema = z.object({}).loose(); // return everything
