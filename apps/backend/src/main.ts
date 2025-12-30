import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { env } from '@config/env';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(env.BE_PORT);
  console.log(`🚀 Server running on: http://localhost:${String(env.BE_PORT)}`);
}
bootstrap().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error('Fatal Error during startup:', message);
  process.exit(1);
});
