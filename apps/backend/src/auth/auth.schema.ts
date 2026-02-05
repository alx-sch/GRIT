import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { ResUserBaseSchema } from '@/user/user.schema';
import { RegisterSchema, LoginSchema } from '@grit/schema';

// --- Registration ---
export class ReqRegisterDto extends createZodDto(RegisterSchema) {}

export const ResRegisterSchema = ResUserBaseSchema.extend({
  message: z.string().default('Registration successful. Please check your email.'),
});
export class ResRegisterDto extends createZodDto(ResRegisterSchema) {}

// --- Confirmation (click link in email) ---
export const ReqConfirmEmailSchema = z.strictObject({
  token: z.string().min(1, 'Token is required'),
});
export class ReqConfirmEmailDto extends createZodDto(ReqConfirmEmailSchema) {}

// --- Login ---
export class ReqLoginDto extends createZodDto(LoginSchema) {}

export const ResLoginSchema = z.object({
  accessToken: z.string(),
  user: ResUserBaseSchema,
});
export class ResLoginDto extends createZodDto(ResLoginSchema) {}

// --- Me / Auth Status ---
export class ResAuthMeDto extends createZodDto(ResUserBaseSchema) {}
