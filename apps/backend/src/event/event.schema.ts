import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { OpenAPIObject } from '@nestjs/swagger';

// Request schema for either getting all events or searching events
export const ReqEventGetPublishedSchema = z.strictObject({
  authorId: z.coerce.number().int().positive().optional(),
  search: z.string().min(1).optional(),
  startFrom: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .transform((val) => new Date(`${val}T00:00:00.000Z`))
    .optional(),
  startUntil: z
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

// Request schema to get an individual event by id
export const ReqEventGetByIdSchema = z.strictObject({
  id: z.coerce.number().int().positive(),
});
export class ReqEventGetByIdDto extends createZodDto(ReqEventGetByIdSchema) {}

// Helper: Response schema for the author object that can get sent as a subitem in the event response
const ResEventAuthorSchema = z.object({
  id: z.number(),
  name: z.string(),
});

// Response schema for the basic information we send regarding events
export const ResEventBaseSchema = z.object({
  id: z.number().int().positive(),
  author: ResEventAuthorSchema.nullable(),
  content: z.string().nullable(),
  createdAt: z.date(),
  endAt: z.date().nullable(),
  isPublished: z.boolean(),
  startAt: z.date().nullable(),
  title: z.string(),
});

// Mapping: Response schema for all events or single event by id
export const ResEventGetPublishedSchema = z.array(ResEventBaseSchema);
export const ResEventGetByIdSchema = ResEventBaseSchema.nullable();

// Request schema for posting a new event draft
export const ReqEventCreateDraftSchema = z.strictObject({
  authorId: z.number().int().positive(),
  content: z.string().optional(),
  endAt: z.iso.datetime(),
  isPublic: z.boolean(),
  startAt: z.iso.datetime(),
  title: z.string(),
});
export class ReqEventCreateDraftDto extends createZodDto(ReqEventCreateDraftSchema) {}

// Request schema for updating an event (patch)
export const ReqEventPatchSchema = z.strictObject({
  content: z.string().optional(),
  endAt: z.iso.datetime().optional(),
  isPublic: z.boolean().optional(),
  isPublished: z.boolean().optional(),
  startAt: z.iso.datetime().optional(),
  title: z.string().optional(),
});
export class ReqEventPatchDto extends createZodDto(ReqEventPatchSchema) {}
