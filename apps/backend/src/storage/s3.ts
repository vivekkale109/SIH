import { S3Client, ListBucketsCommand, CreateBucketCommand, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { config } from '../config';
import { Readable } from 'stream';

export const s3Client = new S3Client({
  endpoint: config.s3.endpoint,
  region: 'us-east-1',
  credentials: {
    accessKeyId: config.s3.accessKey,
    secretAccessKey: config.s3.secretKey,
  },
  forcePathStyle: true, // Required for MinIO
});

export async function ensureBucketExists(): Promise<boolean> {
  try {
    const listRes = await s3Client.send(new ListBucketsCommand({}));
    const exists = listRes.Buckets?.some((b) => b.Name === config.s3.bucket);

    if (!exists) {
      await s3Client.send(new CreateBucketCommand({ Bucket: config.s3.bucket }));
      console.log(`Bucket "${config.s3.bucket}" created successfully.`);
    }
    return true;
  } catch (error: any) {
    console.error('MinIO bucket check failed:', error.message || error);
    // If bucket already exists or list succeeds, return true
    if (error.name === 'BucketAlreadyOwnedByYou' || error.name === 'BucketAlreadyExists') {
      return true;
    }
    return false;
  }
}

export async function uploadFileToS3(key: string, buffer: Buffer, mimeType: string): Promise<void> {
  await s3Client.send(
    new PutObjectCommand({
      Bucket: config.s3.bucket,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
    })
  );
}

export async function getSignedDownloadUrl(key: string, expiresInSeconds = 900): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: config.s3.bucket,
    Key: key,
  });
  return getSignedUrl(s3Client, command, { expiresIn: expiresInSeconds });
}

export async function getFileStreamFromS3(key: string): Promise<Readable> {
  const response = await s3Client.send(
    new GetObjectCommand({
      Bucket: config.s3.bucket,
      Key: key,
    })
  );
  return response.Body as Readable;
}

export async function getFileBufferFromS3(key: string): Promise<Buffer> {
  const stream = await getFileStreamFromS3(key);
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}
