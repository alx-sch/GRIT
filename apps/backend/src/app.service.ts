import { Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import * as Minio from 'minio';
import { env } from '@config/env';

@Injectable()
export class AppService {
  // Initialize PG client
  private pgPool = new Pool({
    connectionString: env.DATABASE_URL,
  });

  // Initialize MiniIO client
  private minioClient = new Minio.Client({
    endPoint: env.MINIO_HOST, // status is checked via health checked in production / container mode
    port: env.MINIO_PORT,
    useSSL: false,
    accessKey: env.MINIO_USER,
    secretKey: env.MINIO_PASSWORD,
  });

  getHello(): string {
    return 'Hello World!';
  }

  async getHealth() {
    const status = {
      postgres: 'unknown',
      minio: 'unknown',
    };

    // Check Postgres
    try {
      await this.pgPool.query('SELECT 1');
      status.postgres = 'UP';
    } catch (e) {
      status.postgres = 'DOWN';
      console.error('Postgres Health Check Failed:', e);
    }

    // Check MinIO
    try {
      await this.minioClient.listBuckets();
      status.minio = 'UP';
    } catch (e) {
      status.minio = 'DOWN';
      console.error('MinIO Health Check Failed:', e);
    }

    return status;
  }
}
