import { z } from 'zod';
import { sharedPortsSchema, AUTH_CONFIG, EVENT_CONFIG } from '@grit/schema';

const frontendEnvSchema = sharedPortsSchema
  .pick({
    BE_PORT: true,
    MINIO_PORT: true,
  })
  .extend({
    VITE_APP_NAME: z.string().default('GRIT'),
    VITE_APP_BASE_URL: z.string().optional(),
    VITE_GOOGLE_MAPS_API: z.string(),
    VITE_BE_PORT: z.coerce.number().optional(),
    VITE_MINIO_PORT: z.coerce.number().optional(),
  })
  .transform((validatedData) => {
    const cleanBase = validatedData.VITE_APP_BASE_URL?.replace(/\/$/, '');
    const bePort = String(validatedData.VITE_BE_PORT ?? validatedData.BE_PORT);
    const minioPort = String(validatedData.VITE_MINIO_PORT ?? validatedData.MINIO_PORT);

    return {
      ...validatedData,
      VITE_CHAT_BASE_URL: cleanBase ?? `http://localhost:${bePort}`,

      VITE_API_BASE_URL: cleanBase ? `${cleanBase}/api` : `http://localhost:${bePort}/api`,

      API_URL: cleanBase ? `${cleanBase}/api` : `http://localhost:${bePort}/api`,

      MINIO_URL: `http://localhost:${minioPort}`,

      AUTH: AUTH_CONFIG,
      EVENTS: EVENT_CONFIG,
    };
  });

const isTest = import.meta.env.MODE === 'test' || process.env.NODE_ENV === 'test';
const metaEnv = import.meta.env as unknown as Record<string, string | undefined>;

// Explicitly pass the keys so Vite knows to bundle them
const envValidation = frontendEnvSchema.safeParse({
  BE_PORT: metaEnv.BE_PORT ?? (isTest ? '3000' : undefined),
  MINIO_PORT: metaEnv.MINIO_PORT ?? (isTest ? '9000' : undefined),
  VITE_BE_PORT: metaEnv.VITE_BE_PORT,
  VITE_MINIO_PORT: metaEnv.VITE_MINIO_PORT,
  VITE_APP_BASE_URL: metaEnv.VITE_APP_BASE_URL,
  VITE_GOOGLE_MAPS_API: metaEnv.VITE_GOOGLE_MAPS_API,
});

if (!envValidation.success) {
  const pretty = z.prettifyError(envValidation.error);
  console.error('❌ Invalid Frontend Environment Variables:');
  console.error(pretty);
  throw new Error('Invalid environment variables');
}

export const env = envValidation.data;
