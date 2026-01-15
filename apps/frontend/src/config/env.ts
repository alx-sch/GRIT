import { z } from 'zod';

const envSchema = z
  .object({
    BE_PORT: z.string().default('3000'),
    APP_NAME: z.string().default('GRIT'),
    VITE_API_BASE_URL: z.string().optional(),
  })
  .transform((ctx) => ({
    ...ctx,
    VITE_API_BASE_URL: ctx.VITE_API_BASE_URL ?? `http://localhost:${ctx.BE_PORT}/api`,
  }));

const envValidation = envSchema.safeParse(import.meta.env);

if (!envValidation.success) {
  const pretty = z.prettifyError(envValidation.error);
  console.error('❌ Invalid Frontend Environment Variables:');
  console.error(pretty);
  throw new Error('Invalid environment variables');
}

export const env = envValidation.data;
