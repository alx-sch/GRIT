// eslint-disable-next-line @typescript-eslint/no-require-imports
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

import { defineConfig } from 'prisma/config';

const { POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_HOST, DB_PORT, POSTGRES_DB } = process.env;
const DATABASE_URL = `postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST ?? 'localhost'}:${DB_PORT ?? '5432'}/${POSTGRES_DB}?schema=public`;

export default defineConfig({
  schema: './prisma/schema.prisma',
  datasource: {
    url: DATABASE_URL,
  },
  migrations: {
    path: './prisma/migrations',
    seed: 'tsx --tsconfig tsconfig.json prisma/seed.ts',
  },
});
