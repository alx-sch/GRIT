import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import * as Minio from 'minio';
import { env } from '@/config/env';

export interface HealthStatus {
  postgres: string;
  minio: string;
}

@Injectable()
export class AppService {
  private readonly minioClient = new Minio.Client({
    endPoint: env.MINIO_HOST,
    port: env.MINIO_PORT,
    useSSL: false,
    accessKey: env.MINIO_USER,
    secretKey: env.MINIO_PASSWORD,
  });

  constructor(private readonly prisma: PrismaService) {}

  getHello(): string {
    return 'Hello World!';
  }

  async getHealth(): Promise<HealthStatus> {
    const [pgStatus, minioStatus] = await Promise.all([this.checkPostgres(), this.checkMinio()]);

    return {
      postgres: pgStatus,
      minio: minioStatus,
    };
  }

  private async checkPostgres(): Promise<string> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return 'UP';
    } catch (e) {
      const error = e as Error;
      console.error('Postgres Health Check Failed:', error.message);
      return 'DOWN';
    }
  }

  private async checkMinio(): Promise<string> {
    try {
      await this.minioClient.listBuckets();
      return 'UP';
    } catch (e) {
      const error = e as Error;
      console.error('MinIO Health Check Failed:', error.message);
      return 'DOWN';
    }
  }
}
