import { z } from 'zod';
import { sharedPortsSchema, AUTH_CONFIG, EVENT_CONFIG } from '@grit/schema';

const frontendEnvSchema = sharedPortsSchema
  .pick({
    BE_PORT: true,
    MINIO_PORT: true,
  })
  .extend({
    APP_NAME: z.string().default('GRIT'),
    VITE_API_BASE_URL: z.string().optional(),
    VITE_MINIO_URL: z.string().optional(),
  })
  .transform((validatedData) => ({
    ...validatedData,
    VITE_CHAT_BASE_URL:
      validatedData.VITE_API_BASE_URL ?? `http://localhost:${String(validatedData.BE_PORT)}`,
    VITE_API_BASE_URL:
      validatedData.VITE_API_BASE_URL ?? `http://localhost:${String(validatedData.BE_PORT)}/api`,
    API_URL:
      validatedData.VITE_API_BASE_URL ?? `http://localhost:${String(validatedData.BE_PORT)}/api`,
    MINIO_URL:
      validatedData.VITE_MINIO_URL ?? `http://localhost:${String(validatedData.MINIO_PORT)}`,
    MINIO_URL:
      validatedData.VITE_MINIO_URL ?? `http://localhost:${String(validatedData.MINIO_PORT)}`,
    AUTH: AUTH_CONFIG,
    EVENTS: EVENT_CONFIG,
  }));

const isTest = import.meta.env.MODE === 'test' || process.env.NODE_ENV === 'test';
const metaEnv = import.meta.env as unknown as Record<string, string | undefined>;

// Explicitly pass the keys so Vite knows to bundle them
const envValidation = frontendEnvSchema.safeParse({
  BE_PORT: metaEnv.BE_PORT ?? (isTest ? '3000' : undefined),
  MINIO_PORT: metaEnv.MINIO_PORT ?? (isTest ? '9000' : undefined),
  VITE_APP_NAME: metaEnv.VITE_APP_NAME ?? (isTest ? 'GRIT-TEST' : undefined),
  VITE_API_BASE_URL: metaEnv.VITE_API_BASE_URL,
  VITE_MINIO_URL: metaEnv.VITE_MINIO_URL,
});

if (!envValidation.success) {
  const pretty = z.prettifyError(envValidation.error);
  console.error('❌ Invalid Frontend Environment Variables:');
  console.error(pretty);
  throw new Error('Invalid environment variables');
}

export const env = envValidation.data;
