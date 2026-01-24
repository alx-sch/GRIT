import { z } from 'zod/v4';

export const ResAuthMeSchema = z.object({
  id: z.number().int().positive(),
  email: z.email(),
  name: z
    .string()
    .nullable()
    .transform((v) => v ?? undefined),
  avatarKey: z
    .string()
    .nullable()
    .transform((v) => v ?? undefined),
});

export const ResAuthLoginSchema = z.object({
  accessToken: z.string(),
  user: ResAuthMeSchema,
});

export const FormAuthLoginSchema = z.object({
  email: z.email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});
