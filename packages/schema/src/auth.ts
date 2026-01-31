import { z } from 'zod';

// Auth Rules
export const AUTH_CONFIG = {
  JWT_SECRET_MIN_LENGTH: 16,
  PASSWORD_MIN_LENGTH: 8,
};

// Auth Schema
export const LoginSchema = z.object({
  email: z.string('Please enter a valid email address'),
  password: z.string().min(AUTH_CONFIG.PASSWORD_MIN_LENGTH, {
    message: `Password must be at least ${AUTH_CONFIG.PASSWORD_MIN_LENGTH} characters`,
  }),
});
export type LoginInput = z.infer<typeof LoginSchema>;
