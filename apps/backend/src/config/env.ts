import { z } from 'zod';
import { sharedPortsSchema, AUTH_CONFIG } from '@grit/schema';

// ---------- Base schema (raw env variables + MinIO transform) ----------
const backendBaseSchema = sharedPortsSchema
  .extend({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    JWT_SECRET: z
      .string()
      .min(
        AUTH_CONFIG.JWT_SECRET_MIN_LENGTH,
        `JWT_SECRET must be at least ${String(AUTH_CONFIG.JWT_SECRET_MIN_LENGTH)} characters long`
      ),

    // Explicit flag to skip validation during Docker builds (no env var provided)
    SKIP_ENV_VALIDATION: z
      .enum(['true', 'false', '1', '0'])
      .default('false')
      .transform((v) => v === 'true' || v === '1'),

    // Postgres
    POSTGRES_USER: z.string(),
    POSTGRES_PASSWORD: z
      .string()
      .min(
        AUTH_CONFIG.PASSWORD_MIN_LENGTH,
        `POSTGRES_PASSWORD must be at least ${String(AUTH_CONFIG.PASSWORD_MIN_LENGTH)} characters long`
      ),
    POSTGRES_DB: z.string(),
    POSTGRES_HOST: z.string().default('localhost'),

    // MinIO
    MINIO_USER: z.string(),
    MINIO_PASSWORD: z
      .string()
      .min(
        AUTH_CONFIG.PASSWORD_MIN_LENGTH,
        `MINIO_PASSWORD must be at least ${String(AUTH_CONFIG.PASSWORD_MIN_LENGTH)} characters long`
      ),
    MINIO_HOST: z.string().default('localhost'),
    MINIO_ENDPOINT: z.string().optional(),

    // Email service
    MAIL_HOST: z.string().default('sandbox.smtp.mailtrap.io'),
    MAIL_PORT: z.coerce.number().default(2525),
    MAIL_USER: z.string(),
    MAIL_PASS: z.string(),
    MAIL_FROM: z.email().default('noreply@grit.social'),
    FRONTEND_URL: z.url().default('http://localhost:3000'),

    // Google OAuth
    GOOGLE_CLIENT_ID: z.string().min(1, 'Google Client ID is required'),
    GOOGLE_CLIENT_SECRET: z.string().min(1, 'Google Client Secret is required'),
    GOOGLE_CALLBACK_URL: z.url().default('http://localhost:3000/auth/google/callback'),

    // Ports (backend only)
    HTTP_PORT: z.coerce.number().default(80),
    HTTPS_PORT: z.coerce.number().default(443),
  })
  // Transform MinIO endpoint
  .transform((env) => {
    // If MINIO_ENDPOINT is defined in .env, use it.
    // Otherwise, construct it from HOST and PORT.
    const endpoint = env.MINIO_ENDPOINT ?? `http://${env.MINIO_HOST}:${String(env.MINIO_PORT)}`;

    return {
      ...env,
      MINIO_ENDPOINT: endpoint,
    };
  });

// ---------- Final schema (Postgres DATABASE_URL + test DB logic) ----------

const backendEnvSchema = backendBaseSchema.transform((data) => {
  let dbName = data.POSTGRES_DB;

  // Change database name if in test node env
  if (data.NODE_ENV === 'test') dbName = data.POSTGRES_DB + '_test';

  // Do not connect to test db unless on localhost
  if (data.NODE_ENV === 'test' && !['localhost', '127.0.0.1'].includes(data.POSTGRES_HOST))
    throw new Error('Refusing to run tests against non-local Postgres');

  // building database url
  const url = `postgresql://${data.POSTGRES_USER}:${data.POSTGRES_PASSWORD}@${data.POSTGRES_HOST}:${String(data.DB_PORT)}/${dbName}?schema=public`;
  return {
    ...data,
    DATABASE_URL: url,
  };
});

// ---------- Validate environment ----------
const envValidation = backendEnvSchema.safeParse(process.env);

// Prepare the variable that will be exported
type Env = z.infer<typeof backendEnvSchema>;
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
    const pretty = z.prettifyError(envValidation.error);
    console.error('\n❌ Invalid Environment Variables:');
    console.error(pretty);
    console.error(''); // Extra spacing for the CLI
    process.exit(1);
  }
}

export const env = validatedEnv;
