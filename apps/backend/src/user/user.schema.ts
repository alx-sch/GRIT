import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

// --- Schemas ---
export const ResUserBaseSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().nullable(),
  avatarKey: z.string().nullable(),
});

export const ResUserPostSchema = ResUserBaseSchema.extend({
  email: z.email(),
});

export const ReqUserPostSchema = z.object({
  name: z.string().optional(),
  email: z.email(),
  avatarKey: z.string().optional(),
});

// --- DTO classes ---
export class ResUserBaseDto extends createZodDto(ResUserBaseSchema) {}
export class ResUserPostDto extends createZodDto(ResUserPostSchema) {}
export class ReqUserPostDto extends createZodDto(ReqUserPostSchema) {}
