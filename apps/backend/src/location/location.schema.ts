import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { ResLocationBaseSchema, CreateLocationSchema } from '@grit/schema';

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

export class ReqLocationPostDto extends createZodDto(CreateLocationSchema) {}
export const ResLocationPostSchema = z.object({}).loose(); // return everything

// Delete an event
export const ReqLocationDeleteSchema = z.strictObject({
  id: z.coerce.number().int().positive(),
});
export class ReqLocationDeleteDto extends createZodDto(ReqLocationDeleteSchema) {}
export const ResLocationDeleteSchema = ResLocationBaseSchema;
