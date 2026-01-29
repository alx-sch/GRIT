import { z } from 'zod';

// Shared Port Schema
export const sharedPortsSchema = z.object({
  BE_PORT: z.coerce.number().default(3000),
  FE_PORT: z.coerce.number().default(5173),
  DB_PORT: z.coerce.number().default(5432),
  MINIO_PORT: z.coerce.number().default(9000),
  MINIO_DASHBOARD_PORT: z.coerce.number().default(9001),
});

// Shared Auth Rules
export const AUTH_CONFIG = {
  JWT_SECRET_MIN_LENGTH: 16,
  PASSWORD_MIN_LENGTH: 10,
};

// Shared Auth Schema
export const LoginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginInput = z.infer<typeof LoginSchema>;

export const RegisterSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  password: z.string().min(AUTH_CONFIG.PASSWORD_MIN_LENGTH, {
    message: `Password must be at least ${AUTH_CONFIG.PASSWORD_MIN_LENGTH} characters`,
  }),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;
