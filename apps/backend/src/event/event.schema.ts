import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

/**
 * SHARED RESPONSE SCHEMAS
 */

// Response schema for the author object that can get sent as a subitem in the event response
const ResEventAuthorSchema = z.object({
  id: z.number(),
  name: z.string(),
});

// Response schema for the basic information we send regarding events
export const ResEventBaseSchema = z.object({
  id: z.number().int().positive(),
  authorId: z.number().int().positive().nullable(),
  author: ResEventAuthorSchema.nullable(),
  content: z.string().nullable(),
  createdAt: z.date(),
  endAt: z.date().nullable(),
  isPublished: z.boolean(),
  isPublic: z.boolean(),
  startAt: z.date().nullable(),
  title: z.string(),
});

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
});
export class ReqEventGetPublishedDto extends createZodDto(ReqEventGetPublishedSchema) {}
export const ResEventGetPublishedSchema = z.array(ResEventBaseSchema);

// Patch an event (Update)
export const ReqEventPatchSchema = z.strictObject({
  content: z.string().optional(),
  endAt: z.iso.datetime().optional(),
  isPublic: z.boolean().optional(),
  isPublished: z.boolean().optional(),
  startAt: z.iso.datetime().optional(),
  title: z.string().optional(),
});
export class ReqEventPatchDto extends createZodDto(ReqEventPatchSchema) {}
export const ResEventPatchSchema = ResEventBaseSchema;

// Post a new event draft
export const ReqEventPostDraftSchema = z.strictObject({
  authorId: z.number().int().positive(),
  content: z.string().optional(),
  endAt: z.iso.datetime(),
  isPublic: z.boolean(),
  startAt: z.iso.datetime(),
  title: z.string(),
});
export class ReqEventPostDraftDto extends createZodDto(ReqEventPostDraftSchema) {}
export const ResEventPostDraftSchema = ResEventBaseSchema;
