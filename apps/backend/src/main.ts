import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { config } from './config';
import { checkDatabaseConnection } from './db/prisma';
import { ensureBucketExists } from './storage/s3';
import { errorHandler } from './common/errors';

import { authRouter } from './auth/auth.router';
import { casesRouter } from './cases/cases.router';
import { documentsRouter } from './documents/documents.router';
import { auditRouter } from './audit/audit.router';
import { sharingRouter } from './sharing/sharing.router';
import { searchRouter } from './search/search.router';
import { timelineRouter } from './timeline/timeline.router';
import { notificationsRouter } from './notifications/notifications.router';

const app = express();

app.use(
  cors({
    origin: config.frontendUrl,
    credentials: true,
  })
);
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

// Health Check Endpoint (Phase 0)
app.get('/api/v1/health', async (req, res) => {
  const dbStatus = await checkDatabaseConnection();
  const minioStatus = await ensureBucketExists();

  const isHealthy = dbStatus && minioStatus;

  return res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'OK' : 'DEGRADED',
    timestamp: new Date().toISOString(),
    services: {
      database: dbStatus ? 'HEALTHY' : 'UNHEALTHY',
      objectStorage: minioStatus ? 'HEALTHY' : 'UNHEALTHY',
    },
    system: {
      uptime: process.uptime(),
      nodeVersion: process.version,
    },
  });
});

// API v1 Routes
app.use('/api/v1/auth', authRouter);
app.use('/api/v1', authRouter); // Covers /admin/users, /roles
app.use('/api/v1/cases', casesRouter);
app.use('/api/v1', casesRouter); // Covers case-scoped routes
app.use('/api/v1', documentsRouter); // Covers /cases/:caseId/documents, /documents/:id, /documents/:versionId/verify, etc.
app.use('/api/v1/audit', auditRouter);
app.use('/api/v1', sharingRouter); // Covers /documents/:versionId/share, /shared/:token, /shares/:id/revoke
app.use('/api/v1/search', searchRouter);
app.use('/api/v1', timelineRouter); // Covers /cases/:caseId/timeline, /cases/:caseId/evidence
app.use('/api/v1/notifications', notificationsRouter);

app.use(errorHandler);

if (require.main === module) {
  app.listen(config.port, () => {
    console.log(`SDMS Backend API listening on port ${config.port} (${config.env})`);
  });
}

export default app;
