import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

/**
 * SHARED RESPONSE SCHEMAS
 */

// Response schema for the basic Auth info
export const ResAuthBaseSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().nullable(),
  accessToken: z.string().nullable(),
});

/**
 * REQ / RES SCHEMAS FOR ROUTES
 */

// Login credentials
export const ReqAuthPostSchema = z.strictObject({
  email: z.email(),
  password: z.string().min(8),
});
export class ReqAuthPostDto extends createZodDto(ReqAuthPostSchema) {}
export const ResAuthPostSchema = ResAuthBaseSchema;
