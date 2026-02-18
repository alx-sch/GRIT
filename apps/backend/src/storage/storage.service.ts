import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadBucketCommand,
  CreateBucketCommand,
  PutBucketPolicyCommand,
} from '@aws-sdk/client-s3';
import { env } from '@/config/env';
import { generateS3Key, getPublicS3Policy } from './storage.utils';

// Define the error interface for the helper
interface S3Error {
  $metadata?: { httpStatusCode?: number };
}

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private s3 = new S3Client({
    region: 'us-east-1',
    endpoint: env.MINIO_ENDPOINT,
    credentials: {
      accessKeyId: env.MINIO_USER,
      secretAccessKey: env.MINIO_PASSWORD,
    },
    forcePathStyle: true,
  });

  // Automatically run when the application starts.
  // Ensures your environment is ready without manual MinIO configuration.
  async onModuleInit() {
    this.logger.log('Initializing Storage Buckets...');
    await this.ensureBucket('user-avatars');
    await this.ensureBucket('event-images');
  }

  // Raw buffer upload, used by to get avatas from Google (OAuth)
  async uploadBuffer(
    buffer: Buffer,
    bucket: string,
    originalName: string,
    mimetype = 'image/jpeg'
  ): Promise<string> {
    const s3Key = generateS3Key(originalName);

    try {
      await this.s3.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: s3Key,
          Body: buffer,
          ContentType: mimetype,
        })
      );
      return s3Key;
    } catch (error) {
      this.logger.error(`Upload failed for ${s3Key} in bucket ${bucket}:`, error);
      throw error;
    }
  }

  // Wrapper for Multer uploads
  async uploadFile(file: Express.Multer.File, bucket: string): Promise<string> {
    return this.uploadBuffer(file.buffer, bucket, file.originalname, file.mimetype);
  }

  // Delete a file from a bucket
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

  /// HELPER ///

  // Helper: Check if bucket exists, create if not
  private async ensureBucket(bucketName: string) {
    console.log(`Checking for bucket: ${bucketName}...`);
    try {
      await this.s3.send(new HeadBucketCommand({ Bucket: bucketName }));
      console.log(`✅ Bucket ' ${bucketName}' exists.`);
    } catch (error: unknown) {
      const isS3Error = (err: unknown): err is S3Error =>
        typeof err === 'object' && err !== null && '$metadata' in err;

      const isNotFound =
        error instanceof Error &&
        (error.name === 'NotFound' ||
          (isS3Error(error) && error.$metadata?.httpStatusCode === 404));

      if (isNotFound) {
        console.log(`Bucket not found. Creating '${bucketName}'...`);
        await this.s3.send(new CreateBucketCommand({ Bucket: bucketName }));
        await this.s3.send(
          new PutBucketPolicyCommand({
            Bucket: bucketName,
            Policy: getPublicS3Policy(bucketName),
          })
        );
        console.log(`✅ Bucket '${bucketName}' created.`);
      } else {
        throw error;
      }
    }
  }
}
