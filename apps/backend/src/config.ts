import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '4000', 10),
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  databaseUrl: process.env.DATABASE_URL || 'postgresql://sdms:sdms_password@127.0.0.1:5432/sdms?schema=public',
  jwt: {
    secret: process.env.JWT_SECRET || 'sdms_jwt_secret_key_sih_hackathon_prototype_26190',
    expiry: process.env.JWT_EXPIRY || '24h',
    cookieName: process.env.SESSION_COOKIE_NAME || 'sdms_session',
  },
  s3: {
    endpoint: process.env.S3_ENDPOINT || 'http://127.0.0.1:9005',
    accessKey: process.env.S3_ACCESS_KEY || 'minioadmin',
    secretKey: process.env.S3_SECRET_KEY || 'minioadmin',
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
