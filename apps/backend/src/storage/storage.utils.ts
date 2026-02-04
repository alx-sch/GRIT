import crypto from 'crypto';
import path from 'path';

export const generateS3Key = (originalName: string): string => {
  const fileHash = crypto.randomBytes(4).toString('hex');
  const timestamp = Date.now();
  return `${String(timestamp)}-${fileHash}${path.extname(originalName)}`;
};

export const getPublicS3Policy = (bucketName: string) =>
  JSON.stringify({
    Version: '2012-10-17',
    Statement: [
      {
        Effect: 'Allow',
        Principal: { AWS: ['*'] },
        Action: ['s3:GetObject'],
        Resource: [`arn:aws:s3:::${bucketName}/*`],
      },
    ],
  });
