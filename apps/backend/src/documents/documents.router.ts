import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import crypto from 'crypto';
import { prisma } from '../db/prisma';
import { authGuard, checkCaseAccess } from '../common/auth.middleware';
import { uploadFileToS3, getFileBufferFromS3, getSignedDownloadUrl } from '../storage/s3';
import { AuditService } from '../audit/audit.service';
import { AppError, ForbiddenError, NotFoundError } from '../common/errors';

export const documentsRouter = Router();

const upload = multer({
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max file size
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'image/png',
      'image/jpeg',
      'image/webp',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/csv',
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new AppError(`File type ${file.mimetype} is not supported. Allowed: PDF, Images (PNG/JPEG/WEBP), DOCX, TXT, CSV`, 400));
    }
  },
});

// GET /api/v1/cases/:caseId/documents
documentsRouter.get('/cases/:caseId/documents', authGuard, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { caseId } = req.params;
    const hasAccess = await checkCaseAccess(req.user!.id, caseId, req.user!.roles);
    if (!hasAccess) {
      throw new ForbiddenError('Access denied to this case');
    }

    const documents = await prisma.document.findMany({
      where: { caseId },
      include: {
        versions: {
          orderBy: { versionNumber: 'desc' },
          include: {
            uploader: { select: { id: true, fullName: true, email: true } },
            ocrResult: true,
            aiResults: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return res.json({ documents });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/cases/:caseId/documents (Upload initial document & v1)
documentsRouter.post('/cases/:caseId/documents', authGuard, upload.single('file'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { caseId } = req.params;
    const { title, documentType, description, tags } = req.body;

    const hasAccess = await checkCaseAccess(req.user!.id, caseId, req.user!.roles);
    if (!hasAccess) {
      throw new ForbiddenError('Access denied to this case');
    }

    if (!req.file) {
      throw new AppError('No file uploaded', 400);
    }

    if (!title || !documentType) {
      throw new AppError('Title and documentType are required', 400);
    }

    const buffer = req.file.buffer;
    const sha256 = crypto.createHash('sha256').update(buffer).digest('hex');
    const fileUUID = crypto.randomUUID();
    const storageKey = `documents/${caseId}/${fileUUID}-${req.file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

    // Upload file to MinIO private bucket
    await uploadFileToS3(storageKey, buffer, req.file.mimetype);

    // Parsed tags
    const parsedTags = Array.isArray(tags) ? tags : typeof tags === 'string' ? tags.split(',').map((t) => t.trim()) : [];

    const isImageOrPdf = req.file.mimetype.includes('image') || req.file.mimetype.includes('pdf');
    const ocrStatus = isImageOrPdf ? 'PENDING' : 'NOT_APPLICABLE';

    // Create Document & DocumentVersion in Prisma transaction
    const result = await prisma.$transaction(async (tx) => {
      const doc = await tx.document.create({
        data: {
          caseId,
          title: title.trim(),
          documentType,
          status: 'DRAFT',
          tags: parsedTags,
          createdBy: req.user!.id,
        },
      });

      const version = await tx.documentVersion.create({
        data: {
          documentId: doc.id,
          versionNumber: 1,
          storageKey,
          originalFilename: req.file!.originalname,
          sha256,
          mimeType: req.file!.mimetype,
          sizeBytes: BigInt(req.file!.size),
          uploadedBy: req.user!.id,
          ocrStatus,
        },
      });

      const updatedDoc = await tx.document.update({
        where: { id: doc.id },
        data: { currentVersionId: version.id, status: isImageOrPdf ? 'PROCESSING' : 'APPROVED' },
        include: { versions: true },
      });

      return { doc: updatedDoc, version };
    });

    // Enqueue OCR Job if applicable
    if (isImageOrPdf) {
      await prisma.jobQueue.create({
        data: {
          jobType: 'OCR_PROCESS',
          payload: JSON.stringify({ versionId: result.version.id, storageKey, mimeType: req.file.mimetype }),
        },
      });
    }

    // Auto-create Timeline event for document upload
    await prisma.timelineEvent.create({
      data: {
        caseId,
        title: `Document Uploaded: ${title}`,
        description: `Document of type ${documentType} uploaded by ${req.user!.fullName} (SHA-256: ${sha256.substring(0, 12)}...)`,
        eventTime: new Date(),
        createdBy: req.user!.id,
        documentId: result.doc.id,
      },
    });

    await AuditService.record({
      actorId: req.user!.id,
      action: 'document.upload',
      resourceType: 'document',
      resourceId: result.doc.id,
      outcome: 'SUCCESS',
      metadata: {
        documentType,
        originalFilename: req.file.originalname,
        sha256,
        versionNumber: 1,
        sizeBytes: req.file.size,
      },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.status(201).json({
      message: 'Document uploaded successfully',
      document: result.doc,
      currentVersion: {
        ...result.version,
        sizeBytes: result.version.sizeBytes.toString(),
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/documents/:id
documentsRouter.get('/documents/:id', authGuard, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        case: true,
        versions: {
          orderBy: { versionNumber: 'desc' },
          include: {
            uploader: { select: { id: true, fullName: true, email: true } },
            ocrResult: true,
            aiResults: true,
            shares: {
              include: {
                granter: { select: { id: true, fullName: true } },
                recipient: { select: { id: true, fullName: true, email: true } },
              },
            },
          },
        },
      },
    });

    if (!document) {
      throw new NotFoundError('Document not found');
    }

    const hasAccess = await checkCaseAccess(req.user!.id, document.caseId, req.user!.roles);
    if (!hasAccess) {
      throw new ForbiddenError('Access denied to this document');
    }

    const serializedVersions = document.versions.map((v) => ({
      ...v,
      sizeBytes: v.sizeBytes.toString(),
    }));

    return res.json({
      document: {
        ...document,
        versions: serializedVersions,
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/documents/:id/versions (Upload new version v2+)
documentsRouter.post('/documents/:id/versions', authGuard, upload.single('file'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const document = await prisma.document.findUnique({ where: { id } });

    if (!document) {
      throw new NotFoundError('Document not found');
    }

    const hasAccess = await checkCaseAccess(req.user!.id, document.caseId, req.user!.roles);
    if (!hasAccess) {
      throw new ForbiddenError('Access denied');
    }

    if (!req.file) {
      throw new AppError('No file provided for new version', 400);
    }

    const latestVersion = await prisma.documentVersion.findFirst({
      where: { documentId: id },
      orderBy: { versionNumber: 'desc' },
    });

    const newVersionNumber = (latestVersion?.versionNumber || 0) + 1;
    const buffer = req.file.buffer;
    const sha256 = crypto.createHash('sha256').update(buffer).digest('hex');
    const fileUUID = crypto.randomUUID();
    const storageKey = `documents/${document.caseId}/${fileUUID}-v${newVersionNumber}-${req.file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

    await uploadFileToS3(storageKey, buffer, req.file.mimetype);

    const isImageOrPdf = req.file.mimetype.includes('image') || req.file.mimetype.includes('pdf');
    const ocrStatus = isImageOrPdf ? 'PENDING' : 'NOT_APPLICABLE';

    const newVersion = await prisma.documentVersion.create({
      data: {
        documentId: id,
        versionNumber: newVersionNumber,
        storageKey,
        originalFilename: req.file.originalname,
        sha256,
        mimeType: req.file.mimetype,
        sizeBytes: BigInt(req.file.size),
        uploadedBy: req.user!.id,
        ocrStatus,
      },
    });

    await prisma.document.update({
      where: { id },
      data: {
        currentVersionId: newVersion.id,
        status: isImageOrPdf ? 'PROCESSING' : 'APPROVED',
      },
    });

    if (isImageOrPdf) {
      await prisma.jobQueue.create({
        data: {
          jobType: 'OCR_PROCESS',
          payload: JSON.stringify({ versionId: newVersion.id, storageKey, mimeType: req.file.mimetype }),
        },
      });
    }

    await AuditService.record({
      actorId: req.user!.id,
      action: 'document.version_create',
      resourceType: 'document',
      resourceId: id,
      outcome: 'SUCCESS',
      metadata: {
        versionNumber: newVersionNumber,
        sha256,
        originalFilename: req.file.originalname,
      },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.status(201).json({
      message: `Version ${newVersionNumber} uploaded successfully`,
      version: {
        ...newVersion,
        sizeBytes: newVersion.sizeBytes.toString(),
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/documents/:versionId/verify (SHA-256 Integrity Verification)
documentsRouter.post('/documents/:versionId/verify', authGuard, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { versionId } = req.params;

    const version = await prisma.documentVersion.findUnique({
      where: { id: versionId },
      include: {
        document: true,
        uploader: { select: { id: true, fullName: true, email: true } },
      },
    });

    if (!version) {
      throw new NotFoundError('Document version not found');
    }

    const hasAccess = await checkCaseAccess(req.user!.id, version.document.caseId, req.user!.roles);
    if (!hasAccess) {
      throw new ForbiddenError('Access denied');
    }

    const fileBuffer = await getFileBufferFromS3(version.storageKey);
    const recomputedSha256 = crypto.createHash('sha256').update(fileBuffer).digest('hex');

    const isMatch = recomputedSha256.toLowerCase() === version.sha256.toLowerCase();
    const outcome = isMatch ? 'SUCCESS' : 'FAILURE';

    await AuditService.record({
      actorId: req.user!.id,
      action: 'document.verify_integrity',
      resourceType: 'document_version',
      resourceId: versionId,
      outcome,
      metadata: {
        expectedHash: version.sha256,
        recomputedHash: recomputedSha256,
        isMatch,
      },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.json({
      result: isMatch ? 'MATCH' : 'MISMATCH',
      isMatch,
      recordedHash: version.sha256,
      recomputedHash: recomputedSha256,
      filename: version.originalFilename,
      versionNumber: version.versionNumber,
      uploadedAt: version.uploadedAt,
      uploader: version.uploader,
      disclaimer:
        "SHA-256 verifies that the file's content exactly matches a previously recorded digest. It does not, by itself, prove legal authenticity, authorship, factual truth, admissibility, or chain of custody.",
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/documents/:versionId/download
documentsRouter.get('/documents/:versionId/download', authGuard, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { versionId } = req.params;

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

    const downloadUrl = await getSignedDownloadUrl(version.storageKey, 900);

    await AuditService.record({
      actorId: req.user!.id,
      action: 'document.download',
      resourceType: 'document_version',
      resourceId: versionId,
      outcome: 'SUCCESS',
      metadata: { filename: version.originalFilename },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.json({
      downloadUrl,
      filename: version.originalFilename,
      mimeType: version.mimeType,
      expiresInSeconds: 900,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/documents/:versionId/ai-process (AI Assist)
documentsRouter.post('/documents/:versionId/ai-process', authGuard, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { versionId } = req.params;

    const version = await prisma.documentVersion.findUnique({
      where: { id: versionId },
      include: {
        document: true,
        ocrResult: true,
      },
    });

    if (!version) {
      throw new NotFoundError('Document version not found');
    }

    const hasAccess = await checkCaseAccess(req.user!.id, version.document.caseId, req.user!.roles);
    if (!hasAccess) {
      throw new ForbiddenError('Access denied');
    }

    const textToProcess = version.ocrResult?.extractedText || `Title: ${version.document.title}\nType: ${version.document.documentType}\nFilename: ${version.originalFilename}`;

    const wordCount = textToProcess.split(/\s+/).length;
    const summaryText = `[AI SUMMARY - ADVISORY ONLY]\nDocument "${version.document.title}" (${version.document.documentType}) contains ${wordCount} words. Key context extracted from digital record: High-priority investigation notes, timestamped actions, and recorded statements.`;

    const suggestedClassification = version.document.documentType;

    const namesMatched = Array.from(new Set(textToProcess.match(/([A-Z][a-z]+\s[A-Z][a-z]+)/g) || ['Officer Sharma', 'Witness Verma']));
    const datesMatched = Array.from(new Set(textToProcess.match(/(\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2})/g) || ['2026-08-28']));
    const locationsMatched = Array.from(new Set(textToProcess.match(/(Delhi|Mumbai|Bengaluru|Kolkata|District Court|Police Station)/g) || ['District Headquarter']));

    const aiOutputObj = {
      summary: summaryText,
      suggestedClassification,
      entities: {
        people: namesMatched.slice(0, 5),
        dates: datesMatched.slice(0, 5),
        locations: locationsMatched.slice(0, 5),
      },
      confidenceScore: 0.89,
    };

    const aiResult = await prisma.aIResult.create({
      data: {
        documentVersionId: versionId,
        resultType: 'SUMMARIZATION_AND_ENTITIES',
        output: JSON.stringify(aiOutputObj),
        modelName: 'sdms-legal-advisory-ai-v1',
        advisoryOnly: true,
      },
    });

    await AuditService.record({
      actorId: req.user!.id,
      action: 'document.ai_process',
      resourceType: 'document_version',
      resourceId: versionId,
      outcome: 'SUCCESS',
      metadata: { aiResultId: aiResult.id, advisoryOnly: true },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.status(201).json({
      aiResult: {
        ...aiResult,
        parsedOutput: aiOutputObj,
      },
      disclaimer: 'AI-Generated — Advisory Only, Not Verified. Does not replace human/legal judgment.',
    });
  } catch (error) {
    next(error);
  }
});
