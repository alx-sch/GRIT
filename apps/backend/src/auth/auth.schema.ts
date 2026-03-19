import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { RegisterSchema, LoginSchema, ResUserBaseSchema } from '@grit/schema';

export const ResAuthMeSchema = z.object({
  id: z.number().int().positive(),
  email: z.email(),
  name: z.string().nullable(),
  displayName: z.string().nullable().optional(),
  avatarKey: z.string().nullable().optional(),
  isConfirmed: z.boolean().default(false),
  isAdmin: z.boolean().default(false),
});

export class ReqRegisterDto extends createZodDto(RegisterSchema) {}

export const ResRegisterSchema = ResUserBaseSchema.extend({
  message: z.string().default('Registration successful. Please check your email.'),
});
export class ResRegisterDto extends createZodDto(ResRegisterSchema) {}

export const ReqConfirmEmailSchema = z.strictObject({
  token: z.string().min(1, 'Token is required'),
});
export class ReqConfirmEmailDto extends createZodDto(ReqConfirmEmailSchema) {}

export class ReqLoginDto extends createZodDto(LoginSchema) {}

export const ResLoginSchema = z.object({
  accessToken: z.string(),
  user: ResAuthMeSchema,
});
export class ResLoginDto extends createZodDto(ResLoginSchema) {}

export class ResAuthMeDto extends createZodDto(ResAuthMeSchema) {}

export const GoogleProfileSchema = z.object({
  email: z.email(),
  firstName: z.string(),
  providerId: z.string(),
});
export type GoogleProfile = z.infer<typeof GoogleProfileSchema>;
