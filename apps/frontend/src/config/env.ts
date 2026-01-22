import { z } from 'zod';
import { sharedPortsSchema } from '@grit/schema';

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
  .transform((ctx) => ({
    ...ctx,
    VITE_API_BASE_URL: ctx.VITE_API_BASE_URL ?? `http://localhost:${String(ctx.BE_PORT)}/api`,
    VITE_MINIO_URL: ctx.VITE_MINIO_URL ?? `http://localhost:${String(ctx.MINIO_PORT)}`,
  }));

const envValidation = frontendEnvSchema.safeParse(import.meta.env);

if (!envValidation.success) {
  const pretty = z.prettifyError(envValidation.error);
  console.error('❌ Invalid Frontend Environment Variables:');
  console.error(pretty);
  throw new Error('Invalid environment variables');
}

export const env = envValidation.data;
