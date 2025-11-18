import Fastify from "fastify";
import Database from "better-sqlite3";

const fastify = Fastify({ logger: true });
const db = new Database("./db/app.sqlite");

// Optional but recommended: better concurrency and faster writes
db.pragma("journal_mode = WAL");

// Routes
fastify.get("/users", (request, reply) => {
  const users = db.prepare("SELECT * FROM users").all();
  return users;
});

fastify.get("/", (request, reply) => {
  return { hello: "world" };
});

// Start the server
const start = async () => {
  try {
    await fastify.listen({ port: 3000 });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
