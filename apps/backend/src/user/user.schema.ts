import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

/**
 * SHARED RESPONSE SCHEMAS
 */

// Response schema for the basic user info
export const ResUserBaseSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().optional(),
});

/**
 * REQ / RES SCHEMAS FOR ROUTES
 */

// Get all users
export const ReqUserGetAllSchema = z.strictObject({});
export class ReqUserGetAllDto extends createZodDto(ReqUserGetAllSchema) {}
export const ResUserGetAllSchema = z.array(ResUserBaseSchema);

// Post a new event draft
export const ReqUserPostSchema = z.object({
  name: z.string().optional(),
  email: z.email(),
});
export class ReqUserPostDto extends createZodDto(ReqUserPostSchema) {}
export const ResUserPostSchema = z.object({}).loose(); // return everything
