import { z } from 'zod';
import { sharedPortsSchema, AUTH_CONFIG } from '@grit/schema';

// ---------- Base schema (raw env variables + MinIO transform) ----------
const backendBaseSchema = sharedPortsSchema
  .extend({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    VITE_API_BASE_URL: z.url().optional(),

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
  // Transform MinIO endpoint
  .transform((env) => {
    // Detect if in a "Public" (Codespace/Prod) or "Local" environment
    const isPublicEnv = !!env.VITE_API_BASE_URL;
    const isBackendContainer = env.MINIO_HOST === 'minio';

    // Derive FRONTEND_URL: Strip /api from the base URL
    const derivedFrontend = isPublicEnv
      ? env.VITE_API_BASE_URL.replace(/\/api$/, '')
      : `http://localhost:${String(env.FE_PORT)}`;

    const internalMinio = isBackendContainer ? `http://minio:9000` : `http://localhost:9000`;

    // Derive MINIO_ENDPOINT (Public Browser Access)
    // In Prod/Codespaces, we tunnel through Caddy /s3. In Dev, we hit the port directly.
    const publicMinio = isPublicEnv
      ? isBackendContainer
        ? `${derivedFrontend}/s3` // Inside Docker: Use Proxy
        : `http://localhost:${String(env.MINIO_PORT)}` // Outside Docker (Seeding): Use Localhost
      : `http://localhost:${String(env.MINIO_PORT)}`;

    return {
      ...env,
      FRONTEND_URL: derivedFrontend,
      MINIO_ENDPOINT: publicMinio,
      MINIO_INTERNAL_URL: internalMinio,
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
  const dbUrl = `postgresql://${data.POSTGRES_USER}:${data.POSTGRES_PASSWORD}@${data.POSTGRES_HOST}:${String(data.DB_PORT)}/${dbName}?schema=public`;

  const apiBase = data.VITE_API_BASE_URL
    ? data.VITE_API_BASE_URL.replace(/\/$/, '') // Entferne Slash am Ende, falls vorhanden
    : `http://localhost:${String(data.BE_PORT)}`;

  const googleCallback = `${apiBase}/auth/google/callback`;

  return {
    ...data,
    DATABASE_URL: dbUrl,
    GOOGLE_CALLBACK_URL: googleCallback,
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
