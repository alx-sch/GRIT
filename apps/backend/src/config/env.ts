import { z } from 'zod';
import { sharedPortsSchema, AUTH_CONFIG } from '@grit/schema';

// ---------- Base schema (raw env variables + MinIO transform) ----------
const backendBaseSchema = sharedPortsSchema
  .extend({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    APP_BASE_URL: z.url().optional(),

    // Authentication & Security
    JWT_SECRET: z
      .string()
      .min(
        AUTH_CONFIG.JWT_SECRET_MIN_LENGTH,
        `JWT_SECRET must be at least ${String(AUTH_CONFIG.JWT_SECRET_MIN_LENGTH)} characters long`
      ),
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

    // Google OAuth
    GOOGLE_CLIENT_ID: z.string().min(1, 'Google Client ID is required'),
    GOOGLE_CLIENT_SECRET: z.string().min(1, 'Google Client Secret is required'),

    // Ports (backend only)
    HTTP_PORT: z.coerce.number().default(80),
    HTTPS_PORT: z.coerce.number().default(443),
  })
  .transform((data) => {
    const cleanBaseUrl = data.APP_BASE_URL?.replace(/\/$/, '');
    const isBackendContainer = data.MINIO_HOST === 'minio';

    const frontendUrl = cleanBaseUrl ?? `http://localhost:${String(data.FE_PORT)}`;
    const apiBaseUrl = cleanBaseUrl
      ? `${cleanBaseUrl}/api`
      : `http://localhost:${String(data.BE_PORT)}`;

    const internalMinio = isBackendContainer ? `http://minio:9000` : `http://localhost:9000`;

    // If we have a public URL, we route through Caddy (/s3),
    // otherwise we hit the local MinIO port directly.
    const publicMinio = cleanBaseUrl
      ? isBackendContainer
        ? `${frontendUrl}/s3`
        : `http://localhost:${String(data.MINIO_PORT)}`
      : `http://localhost:${String(data.MINIO_PORT)}`;

    return {
      ...data,
      FRONTEND_URL: frontendUrl,
      API_BASE_URL: apiBaseUrl,
      MINIO_ENDPOINT: publicMinio,
      MINIO_INTERNAL_URL: internalMinio,
    };
  });

// ---------- Final schema (Postgres DATABASE_URL + test DB logic) ----------

const backendEnvSchema = backendBaseSchema.transform((data) => {
  let dbName = data.POSTGRES_DB;
  if (data.NODE_ENV === 'test') dbName = `${data.POSTGRES_DB}_test`;

  if (data.NODE_ENV === 'test' && !['localhost', '127.0.0.1'].includes(data.POSTGRES_HOST))
    throw new Error('Refusing to run tests against non-local Postgres');

  const dbUrl = `postgresql://${data.POSTGRES_USER}:${data.POSTGRES_PASSWORD}@${data.POSTGRES_HOST}:${String(data.DB_PORT)}/${dbName}?schema=public`;

  const googleCallback = `${data.API_BASE_URL}/auth/google/callback`;

  return {
    ...data,
    DATABASE_URL: dbUrl,
    GOOGLE_CALLBACK_URL: googleCallback,
  };
});

// ---------- Validate environment ----------
const envValidation = backendEnvSchema.safeParse(process.env);

type Env = z.infer<typeof backendEnvSchema>;
let validatedEnv: Env;

if (envValidation.success) {
  validatedEnv = Object.freeze(envValidation.data);
} else {
  const isSkipValidation =
    process.env.SKIP_ENV_VALIDATION === 'true' || process.env.SKIP_ENV_VALIDATION === '1';

  if (isSkipValidation) {
    console.warn('⚠️  SKIP_ENV_VALIDATION detected: Using dummy values for build.');
    validatedEnv = {
      ...process.env,
      NODE_ENV: 'production',
      DATABASE_URL: 'postgresql://build:build@localhost:5432/build',
    } as unknown as Env;
  } else {
    const pretty = z.prettifyError(envValidation.error);
    console.error('\n❌ Invalid Environment Variables:');
    console.error(pretty);
    process.exit(1);
  }
}

export const env = validatedEnv;
