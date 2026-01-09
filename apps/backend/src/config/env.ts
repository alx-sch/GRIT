import { z } from 'zod';
import { fromZodError } from 'zod-validation-error';

const baseSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

    // Explicit flag to skip validation during Docker builds (no env var provided)
    SKIP_ENV_VALIDATION: z
      .enum(['true', 'false', '1', '0'])
      .default('false')
      .transform((v) => v === 'true' || v === '1'),

    // Postgres
    POSTGRES_USER: z.string(),
    POSTGRES_PASSWORD: z.string().min(10),
    POSTGRES_DB: z.string(),
    POSTGRES_HOST: z.string().default('localhost'),

    // MinIO
    MINIO_USER: z.string(),
    MINIO_PASSWORD: z.string().min(10),
    MINIO_HOST: z.string().default('localhost'),
    MINIO_ENDPOINT: z.string().optional(),

    // Ports
    BE_PORT: z.coerce.number().default(3000),
    FE_PORT: z.coerce.number().default(5173),
    DB_PORT: z.coerce.number().default(5432),
    MINIO_PORT: z.coerce.number().default(9000),
    MINIO_DASHBOARD_PORT: z.coerce.number().default(9001),

    // Docker specific
    HTTP_PORT: z.coerce.number().default(80),
    HTTPS_PORT: z.coerce.number().default(443),
  })

  // Transform MinIO URL
  .transform((env) => {
    // If MINIO_ENDPOINT is defined in .env, use it.
    // Otherwise, construct it from HOST and PORT.
    const endpoint = env.MINIO_ENDPOINT || `http://${env.MINIO_HOST}:${env.MINIO_PORT}`;

    return {
      ...env,
      MINIO_ENDPOINT: endpoint,
    };
  })

  // Transform Postgres URL
  .transform((env) => {
    return {
      ...env,
      DATABASE_URL: `postgresql://${env.POSTGRES_USER}:${env.POSTGRES_PASSWORD}@${env.POSTGRES_HOST}:${env.DB_PORT}/${env.POSTGRES_DB}?schema=public`,
    };
  });

// Run Validation
const envValidation = baseSchema.safeParse(process.env);

// Prepare the variable that will be exported
type Env = z.infer<typeof baseSchema>;
let validatedEnv: Env;

if (envValidation.success) {
  validatedEnv = Object.freeze(envValidation.data);
} else {
  const isSkipValidation =
    process.env.SKIP_ENV_VALIDATION === 'true' || process.env.SKIP_ENV_VALIDATION === '1';

  if (isSkipValidation) {
    console.warn('⚠️  SKIP_ENV_VALIDATION detected: Using dummy values for build.');

    // Provide a mock object that satisfies the Env type
    // We cast this because these values are only for build-time (Prisma generation)
    validatedEnv = {
      ...process.env,
      NODE_ENV: 'production',
      DATABASE_URL: 'postgresql://build:build@localhost:5432/build',
    } as unknown as Env;
  } else {
    console.error('\n❌ Invalid Environment Variables:');
    console.error(fromZodError(envValidation.error).toString());
    process.exit(1);
  }
}

export const env = validatedEnv;
