import { z } from 'zod';

const baseSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  POSTGRES_USER: z.string(),
  POSTGRES_PASSWORD: z.string().min(10),
  POSTGRES_DB: z.string(),
  POSTGRES_HOST: z.string().default('localhost'),
  BE_PORT: z.coerce.number().default(3000),
  FE_PORT: z.coerce.number().default(5173),
  DB_PORT: z.coerce.number().default(5432),
  // TEST_SECRET: z.string().min(10),
});

type BaseEnv = z.infer<typeof baseSchema>;

const envSchema = baseSchema.transform((data: BaseEnv) => {
  // building database url
  const url = `postgresql://${data.POSTGRES_USER}:${data.POSTGRES_PASSWORD}@${data.POSTGRES_HOST}:${data.DB_PORT.toString()}/${data.POSTGRES_DB}?schema=public`;
  return {
    ...data,
    DATABASE_URL: url,
  };
});

const envValidation = envSchema.safeParse(process.env);

if (!envValidation.success) {
  const pretty = z.prettifyError(envValidation.error);

  console.error('\n❌ Invalid Environment Variables:');
  console.error(pretty);

  console.error(''); // Extra spacing for the CLI
  process.exit(1);
}

export const env = Object.freeze(envValidation.data);
