import { Injectable } from '@nestjs/common';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { env } from '@/config/env';
import crypto from 'crypto';
import path from 'path';

@Injectable()
export class StorageService {
  private s3 = new S3Client({
    region: 'us-east-1',
    endpoint: env.MINIO_ENDPOINT,
    credentials: {
      accessKeyId: env.MINIO_USER,
      secretAccessKey: env.MINIO_PASSWORD,
    },
    forcePathStyle: true,
  });

  async uploadFile(file: Express.Multer.File, bucket: string): Promise<string> {
    const fileHash = crypto.randomBytes(4).toString('hex');
    const timestamp = Date.now();
    const s3Key = `${String(timestamp)}-${fileHash}${path.extname(file.originalname)}`;

    await this.s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: s3Key,
        Body: file.buffer, // The raw binary data
        ContentType: file.mimetype,
      })
    );
    return s3Key;
  }

  async deleteFile(key: string, bucket: string): Promise<void> {
    try {
      await this.s3.send(
        new DeleteObjectCommand({
          Bucket: bucket,
          Key: key,
        })
      );
      console.log(`Successfully deleted ${key} from ${bucket}`);
    } catch (error) {
      console.error(`Failed to delete file ${key}:`, error);
      throw error;
    }
  }
}
