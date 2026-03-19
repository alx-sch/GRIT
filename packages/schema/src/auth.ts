import { z } from 'zod';

// Shared Auth Rules
export const AUTH_CONFIG = {
  JWT_SECRET_MIN_LENGTH: 16,
  PASSWORD_MIN_LENGTH: 8,
};

// Shared Auth Schema
export const LoginSchema = z.object({
  emailOrUsername: z.string().min(1, 'Email or username is required'),
  password: z.string().min(AUTH_CONFIG.PASSWORD_MIN_LENGTH, {
    message: `Password must be at least ${AUTH_CONFIG.PASSWORD_MIN_LENGTH} characters`,
  }),
});
export type LoginInput = z.infer<typeof LoginSchema>;

export const RegisterSchema = z.object({
  email: z.email('Please enter a valid email address'),
  password: z.string().min(AUTH_CONFIG.PASSWORD_MIN_LENGTH, {
    message: `Password must be at least ${AUTH_CONFIG.PASSWORD_MIN_LENGTH} characters`,
  }),
  name: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be less than 30 characters')
    .regex(
      /^[a-zA-Z0-9][a-zA-Z0-9_-]*$/,
      'Username must start with a letter or number and can only contain letters, numbers, hyphens, and underscores'
    ),
});
export type RegisterInput = z.infer<typeof RegisterSchema>;
