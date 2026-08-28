import { Router, Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { prisma } from '../db/prisma';
import { authGuard, checkCaseAccess } from '../common/auth.middleware';
import { getSignedDownloadUrl } from '../storage/s3';
import { AuditService } from '../audit/audit.service';
import { AppError, ForbiddenError, NotFoundError } from '../common/errors';

export const sharingRouter = Router();

// POST /api/v1/documents/:versionId/share
sharingRouter.post('/documents/:versionId/share', authGuard, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { versionId } = req.params;
    const { recipientUserId, scope = 'VIEW_ONLY', expiryHours = 48 } = req.body;

    const version = await prisma.documentVersion.findUnique({
      where: { id: versionId },
      include: { document: true },
    });

    if (!version) {
      throw new NotFoundError('Document version not found');
    }

    const hasAccess = await checkCaseAccess(req.user!.id, version.document.caseId, req.user!.roles);
    if (!hasAccess) {
      throw new ForbiddenError('Access denied');
    }

    const externalToken = crypto.randomBytes(24).toString('hex');
    const expiresAt = expiryHours ? new Date(Date.now() + expiryHours * 60 * 60 * 1000) : null;

    const grant = await prisma.permissionGrant.create({
      data: {
        documentVersionId: versionId,
        grantedBy: req.user!.id,
        grantedToUser: recipientUserId || null,
        externalToken,
        scope,
        expiresAt,
      },
      include: {
        granter: { select: { id: true, fullName: true, email: true } },
        recipient: { select: { id: true, fullName: true, email: true } },
      },
    });

    if (recipientUserId) {
      await prisma.notification.create({
        data: {
          userId: recipientUserId,
          title: 'Document Shared With You',
          message: `${req.user!.fullName} shared document "${version.originalFilename}" (${scope}) with you.`,
          type: 'DOCUMENT_SHARED',
          referenceType: 'document',
          referenceId: version.documentId,
        },
      });
    }

    await AuditService.record({
      actorId: req.user!.id,
      action: 'share.create',
      resourceType: 'permission_grant',
      resourceId: grant.id,
      outcome: 'SUCCESS',
      metadata: {
        documentVersionId: versionId,
        scope,
        recipientUserId,
        expiresAt,
        externalToken,
      },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    const shareUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/shared/${externalToken}`;

    return res.status(201).json({
      message: 'Share link created successfully',
      grant,
      shareUrl,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/shared/:token (Public / Token-authenticated access)
sharingRouter.get('/shared/:token', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = req.params;

    const grant = await prisma.permissionGrant.findUnique({
      where: { externalToken: token },
      include: {
        version: {
          include: {
            document: {
              include: { case: true },
            },
            uploader: { select: { id: true, fullName: true } },
          },
        },
        granter: { select: { id: true, fullName: true, email: true } },
      },
    });

    if (!grant) {
      throw new NotFoundError('Invalid or expired share link');
    }

    if (grant.revoked) {
      await AuditService.record({
        action: 'share.access',
        resourceType: 'permission_grant',
        resourceId: grant.id,
        outcome: 'DENIED',
        metadata: { reason: 'Share revoked' },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
      throw new ForbiddenError('This share link has been revoked');
    }

    if (grant.expiresAt && grant.expiresAt < new Date()) {
      await AuditService.record({
        action: 'share.access',
        resourceType: 'permission_grant',
        resourceId: grant.id,
        outcome: 'DENIED',
        metadata: { reason: 'Share expired' },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
      throw new ForbiddenError('This share link has expired');
    }

    const downloadUrl = grant.scope === 'DOWNLOAD_ALLOWED' ? await getSignedDownloadUrl(grant.version.storageKey, 900) : null;

    await AuditService.record({
      action: 'share.access',
      resourceType: 'permission_grant',
      resourceId: grant.id,
      outcome: 'SUCCESS',
      metadata: { scope: grant.scope },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.json({
      document: {
        id: grant.version.document.id,
        title: grant.version.document.title,
        documentType: grant.version.document.documentType,
        caseNumber: grant.version.document.case.caseNumber,
        caseTitle: grant.version.document.case.title,
      },
      version: {
        id: grant.version.id,
        versionNumber: grant.version.versionNumber,
        originalFilename: grant.version.originalFilename,
        sha256: grant.version.sha256,
        uploadedAt: grant.version.uploadedAt,
        mimeType: grant.version.mimeType,
        sizeBytes: grant.version.sizeBytes.toString(),
      },
      shareScope: grant.scope,
      expiresAt: grant.expiresAt,
      downloadUrl,
      granter: grant.granter,
      disclaimer:
        "SHARED DOCUMENT NOTICE: This access is strictly scoped and time-bound. SHA-256 confirms file byte integrity only. All access attempts are audit-logged.",
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/shares/:id/revoke
sharingRouter.post('/shares/:id/revoke', authGuard, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const grant = await prisma.permissionGrant.findUnique({
      where: { id },
      include: { version: { include: { document: true } } },
    });

    if (!grant) {
      throw new NotFoundError('Permission grant not found');
    }

    const hasAccess = await checkCaseAccess(req.user!.id, grant.version.document.caseId, req.user!.roles);
    if (!hasAccess) {
      throw new ForbiddenError('Access denied');
    }

    const updated = await prisma.permissionGrant.update({
      where: { id },
      data: { revoked: true },
    });

    await AuditService.record({
      actorId: req.user!.id,
      action: 'share.revoke',
      resourceType: 'permission_grant',
      resourceId: id,
      outcome: 'SUCCESS',
      metadata: { revokedGrantId: id },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.json({ message: 'Share link revoked successfully', grant: updated });
  } catch (error) {
    next(error);
  }
});
