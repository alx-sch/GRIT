import { z } from 'zod';

const envSchema = z.object({
  VITE_API_BASE_URL: z.url().default('http://localhost:5173/api'),
  VITE_APP_NAME: z.string().default('Grit'),
});

const envValidation = envSchema.safeParse(import.meta.env);

if (!envValidation.success) {
  const pretty = z.prettifyError(envValidation.error);
  console.error('❌ Invalid Frontend Environment Variables:');
  console.error(pretty);
  throw new Error('Invalid environment variables');
}

export const env = envValidation.data;
