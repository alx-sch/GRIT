import { z } from 'zod';

const baseSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  // Postgres
  POSTGRES_USER: z.string(),
  POSTGRES_PASSWORD: z.string().min(10),
  POSTGRES_DB: z.string(),
  // in dev (run in host), this needs to be 'localhost;'
  // in production (Docker network; backend (Node) running in container), this needs to be the container's service name: 'postgres-db'
  POSTGRES_HOST: z.string().default('localhost'),

  // MinIO
  MINIO_USER: z.string(),
  MINIO_PASSWORD: z.string().min(10),
  MINIO_HOST: z.string().default('localhost'),

  // Ports
  BE_PORT: z.coerce.number().default(3000),
  FE_PORT: z.coerce.number().default(5173),
  DB_PORT: z.coerce.number().default(5432),
  MINIO_PORT: z.coerce.number().default(9000),
  MINIO_DASHBOARD_PORT: z.coerce.number().default(9001),

  // Docker specific
  HTTP_PORT: z.coerce.number().default(80),
  HTTPS_PORT: z.coerce.number().default(443),
});

type BaseEnv = z.infer<typeof baseSchema>;

const envSchema = baseSchema.transform((data: BaseEnv) => {
  // Default to localhost, BUT if we are in production AND no host was
  // explicitly provided in .env, force it to 'postgres-db' (name Docker service)
  let host = data.POSTGRES_HOST;
  if (data.NODE_ENV === 'production' && !process.env.POSTGRES_HOST) {
    host = 'postgres-db';
  }

  // building database url
  const url = `postgresql://${data.POSTGRES_USER}:${data.POSTGRES_PASSWORD}@${host}:${data.DB_PORT.toString()}/${data.POSTGRES_DB}?schema=public`;
  return {
    ...data,
    DATABASE_URL: url,
    POSTGRES_HOST: host,
  };
});

// Run Validation
const envValidation = envSchema.safeParse(process.env);

// Prepare the variable that will be exported
type Env = z.infer<typeof envSchema>;
let validatedEnv: Env;

if (!envValidation.success) {
  // During 'docker build', Docker runs commands like 'pnpm prisma generate'.
  // At this stage, the image is a "sealed box" and does not have access to your
  // .env file or the environment variables defined in docker-compose.yaml.s
  // Detect this by checking if POSTGRES_USER is missing AND we aren't in a normal home directory (in Container, $HOME is 'root')
  const isDockerBuild = !process.env.POSTGRES_USER && !process.env.HOME?.includes('home');
  if (isDockerBuild) {
    console.warn('🏗️  Docker Build detected: Using fallback environment.');
    // Without this fallback, Zod would fail the image build here because variables are missing
    // (these are nowhere added, as the image should never include sensitive envars, but only contains this placeholder).
    // We provide Prisma with a "Dummy URL" so it can successfully generate the
    // TypeScript types (Prisma Client) during the image creation phase.
    validatedEnv = {
      ...process.env,
      DATABASE_URL: 'postgresql://build:build@localhost:5432/build',
      NODE_ENV: 'production',
    } as unknown as Env;
  } else {
    // FOR LOCAL DEV: Show the Zod Error and STOP
    const pretty = z.prettifyError(envValidation.error);
    console.error('\n❌ Invalid Environment Variables:');
    console.error(pretty);
    process.exit(1);
  }
} else {
  validatedEnv = Object.freeze(envValidation.data);
}

export const env = validatedEnv as BaseEnv & { DATABASE_URL: string };
