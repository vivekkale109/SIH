import dotenv from 'dotenv';
import path from 'path';
import crypto from 'crypto';

dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

const env = process.env.NODE_ENV || 'development';
const isProduction = env === 'production';

let jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
  if (isProduction) {
    throw new Error('JWT_SECRET environment variable is required in production');
  }
  jwtSecret = crypto.randomBytes(32).toString('hex');
  console.warn('[SECURITY WARNING] JWT_SECRET is not set. Generated random ephemeral secret for development.');
}

let s3AccessKey = process.env.S3_ACCESS_KEY;
let s3SecretKey = process.env.S3_SECRET_KEY;

if (isProduction) {
  if (!s3AccessKey) {
    throw new Error('S3_ACCESS_KEY environment variable is required in production');
  }
  if (!s3SecretKey) {
    throw new Error('S3_SECRET_KEY environment variable is required in production');
  }
} else {
  s3AccessKey = s3AccessKey || 'minioadmin';
  s3SecretKey = s3SecretKey || 'minioadmin';
}

export const config = {
  env,
  port: parseInt(process.env.PORT || '4000', 10),
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  databaseUrl: process.env.DATABASE_URL || 'postgresql://sdms:sdms_password@127.0.0.1:5432/sdms?schema=public',
  jwt: {
    secret: jwtSecret,
    expiry: process.env.JWT_EXPIRY || '24h',
    cookieName: process.env.SESSION_COOKIE_NAME || 'sdms_session',
  },
  s3: {
    endpoint: process.env.S3_ENDPOINT || 'http://127.0.0.1:9005',
    accessKey: s3AccessKey,
    secretKey: s3SecretKey,
    bucket: process.env.S3_BUCKET || 'sdms-documents',
    useSSL: process.env.S3_USE_SSL === 'true',
  },
  ocr: {
    engine: process.env.OCR_ENGINE || 'tesseract',
  },
  ai: {
    apiKey: process.env.AI_PROVIDER_API_KEY || '',
  },
  logLevel: process.env.LOG_LEVEL || 'info',
};

