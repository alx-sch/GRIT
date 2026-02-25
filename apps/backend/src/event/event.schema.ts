import {
  CreateEventSchema,
  ResEventBaseSchema,
  ReqEventGetBySlugSchema,
  ReqEventInviteSchema,
} from '@grit/schema';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

/**
 * REQ / RES SCHEMAS FOR ROUTES
 */

// Delete an event
export const ReqEventDeleteSchema = z.strictObject({
  id: z.coerce.number().int().positive(),
});
export class ReqEventDeleteDto extends createZodDto(ReqEventDeleteSchema) {}
export const ResEventDeleteSchema = ResEventBaseSchema;

// Get an individual event by id
export const ReqEventGetByIdSchema = z.strictObject({
  id: z.coerce.number().int().positive(),
});
export class ReqEventGetByIdDto extends createZodDto(ReqEventGetByIdSchema) {}
export const ResEventGetByIdSchema = ResEventBaseSchema;

// Get all published events or search published events
export const ReqEventGetPublishedSchema = z.strictObject({
  author_id: z.coerce.number().int().positive().optional(),
  search: z.string().min(1).optional(),
  start_from: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .transform((val) => new Date(`${val}T00:00:00.000Z`))
    .optional(),
  start_until: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .transform((val) => {
      const d = new Date(`${val}T00:00:00.000Z`);
      d.setUTCHours(23, 59, 59, 999);
      return d;
    })
    .optional(),
  location_id: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).default(20),
  cursor: z.string().optional(),
  sort: z.enum(['date-asc', 'date-dsc', 'alpha-asc', 'alpha-dsc', 'popularity']).optional(),
});
export class ReqEventGetPublishedDto extends createZodDto(ReqEventGetPublishedSchema) {}

// Patch an event (Update)
export const ReqEventPatchSchema = z.strictObject({
  content: z.string().optional(),
  endAt: z.iso.datetime().optional(),
  isPublic: z.boolean().optional(),
  isPublished: z.boolean().optional(),
  startAt: z.iso.datetime().optional(),
  title: z.string().optional(),
  imageKey: z.string().optional(),
  locationId: z.number().nullable().optional(),
});
export class ReqEventPatchDto extends createZodDto(ReqEventPatchSchema) {}
export const ResEventPatchSchema = ResEventBaseSchema;

export class ReqEventPostDraftDto extends createZodDto(CreateEventSchema) {}
export const ResEventPostDraftSchema = ResEventBaseSchema;

// Get an individual event by slug (for anonymous links)
export class ReqEventGetBySlugDto extends createZodDto(ReqEventGetBySlugSchema) {}
export const ResEventGetBySlugSchema = ResEventBaseSchema;

// Bulk invite users to an event
export class ReqEventInviteDto extends createZodDto(ReqEventInviteSchema) {}
export const ResEventInviteSchema = z.object({
  count: z.number().describe('The number of invites successfully sent'),
});
