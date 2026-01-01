import { cleanupOpenApiDoc } from 'nestjs-zod';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { env } from '@config/env';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Create API Documentation Document with Swagger
  const openApiDoc = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle('GRIT API')
      .setDescription('API description built with Zod and Swagger')
      .setVersion('1.0')
      .build()
  );
  SwaggerModule.setup('api', app, cleanupOpenApiDoc(openApiDoc));

  // Start Server
  await app.listen(env.BE_PORT);
  console.log(`🚀 Server running on: http://localhost:${String(env.BE_PORT)}`);
}

bootstrap().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error('Fatal Error during startup:', message);
  process.exit(1);
});
