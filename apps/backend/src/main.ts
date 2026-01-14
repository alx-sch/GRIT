import { cleanupOpenApiDoc } from 'nestjs-zod';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { env } from '@/config/env';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const document = new DocumentBuilder()
    .setTitle('GRIT API')
    .setDescription('API description built with Zod and Swagger')
    .setVersion('1.0')
    .addTag('System', 'Infrastructure health and server status')
    .addTag('Auth', 'Token generation and security debugging')
    .addTag('Users', 'Authentication and profile customization')
    .addTag('Event', 'Social feed, event creation and participation tracking')
    .addBearerAuth()
    .build();

  // Create API Documentation Document with Swagger
  const openApiDoc = SwaggerModule.createDocument(app, document);
  SwaggerModule.setup('api', app, cleanupOpenApiDoc(openApiDoc));

  // Start Server and log relevant links
  await app.listen(env.BE_PORT);

  const baseBEUrl = `http://localhost:${String(env.BE_PORT)}`;
  const minioUrl = `http://localhost:${String(env.MINIO_DASHBOARD_PORT || 9001)}`;

  const c = {
    reset: '\x1b[0m',
    cyan: '\x1b[36m',
    yellow: '\x1b[33m',
    magenta: '\x1b[35m',
  };

  // Don't log links dashboard when project runs in containers (not accessible via browser)
  if (env.NODE_ENV !== 'production') {
    const url = (label: string, link: string) => `${c.cyan}${label}:${c.reset} ${link}`;
    const separator = `${c.magenta}-------------------------------------------${c.reset}`;

    console.log('');
    console.log(separator);
    console.log(url('[Backend ]', baseBEUrl));
    console.log(url('[Swagger ]', `${baseBEUrl}/api`));
    console.log(url('[Status  ]', `${baseBEUrl}/health`));
    console.log(url('[Frontend]', `http://localhost:${String(env.FE_PORT)}`));
    console.log(url('[MinIO   ]', minioUrl));
    console.log(separator);
    console.log(`View Postgres DB:   ${c.yellow}make view-db${c.reset}`);
    console.log(separator);
    console.log('');
  }
}

bootstrap().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error('Fatal Error during startup:', message);
  process.exit(1);
});
