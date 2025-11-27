import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Fastify from 'fastify';
import Database from 'better-sqlite3';
import { info, warn, error } from './utils/logger.js';

// __filename and __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const fastify = Fastify({ logger: true });

const isDev = process.env.NODE_ENV === 'development';

const rootDir = process.cwd();
const dbDir = path.join(rootDir, isDev ? 'db' : 'dist/db');
const dbFile = path.join(dbDir, 'app.sqlite');

// Delete old dev database if in dev-mode
if (isDev && fs.existsSync(dbFile)) {
  fs.unlinkSync(dbFile);
  info('Old dev database deleted.');
}

// Open database (creates file if missing)
const db = new Database(dbFile);

// Optional but recommended: better concurrency and faster writes
db.pragma('journal_mode = WAL');

// Load scheme (CREATE TABLE IF NOT EXISTS ...)
const schemaPath = path.join(dbDir, 'schema.sql');
if (fs.existsSync(schemaPath)) {
  const schemaSQL = fs.readFileSync(schemaPath, 'utf-8');
  db.exec(schemaSQL);
  info('Dev database created with schema.');
} else {
  warn('schema.sql not found, database tables not created.');
}

// Seed demo users only if table is empty
const retObj = db.prepare('SELECT COUNT(*) AS count FROM users').get() as {
  count: number;
};
const userCount = retObj.count;

if (userCount === 0) {
  const seedPath = path.join(dbDir, 'seed.sql');
  if (fs.existsSync(seedPath)) {
    const seedSQL = fs.readFileSync(seedPath, 'utf-8');
    db.exec(seedSQL);
    info('Demo users seeded.');
  } else {
    warn('No seed.sql found, skipping seed.');
  }
} else {
  info('Users table already populated, skipping seed.');
}

// Routes
fastify.get('/users', (request, reply) => {
  const users = db.prepare('SELECT * FROM users').all();
  return users;
});

fastify.get('/', (request, reply) => {
  return { hello: 'world' };
});

// Start the server
const start = async () => {
  try {
    await fastify.listen({ port: 3000 });
    info('Server listening at http://localhost:3000');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
