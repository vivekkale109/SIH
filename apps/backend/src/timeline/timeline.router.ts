import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../db/prisma';
import { authGuard, checkCaseAccess } from '../common/auth.middleware';
import { AuditService } from '../audit/audit.service';
import { AppError, ForbiddenError, NotFoundError } from '../common/errors';

export const timelineRouter = Router();

// GET /api/v1/cases/:caseId/timeline
timelineRouter.get('/cases/:caseId/timeline', authGuard, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { caseId } = req.params;
    const hasAccess = await checkCaseAccess(req.user!.id, caseId, req.user!.roles);
    if (!hasAccess) {
      throw new ForbiddenError('Access denied');
    }

    const events = await prisma.timelineEvent.findMany({
      where: { caseId },
      include: {
        creator: { select: { id: true, fullName: true, email: true } },
        document: { select: { id: true, title: true, documentType: true } },
        evidence: { select: { id: true, evidenceNumber: true, evidenceType: true, description: true } },
      },
      orderBy: { eventTime: 'asc' },
    });

    return res.json({ events });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/cases/:caseId/timeline
timelineRouter.post('/cases/:caseId/timeline', authGuard, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { caseId } = req.params;
    const { title, description, eventTime, documentId, evidenceId } = req.body;

    const hasAccess = await checkCaseAccess(req.user!.id, caseId, req.user!.roles);
    if (!hasAccess) {
      throw new ForbiddenError('Access denied');
    }

    if (!title || !description) {
      throw new AppError('Title and description are required', 400);
    }

    const event = await prisma.timelineEvent.create({
      data: {
        caseId,
        title: title.trim(),
        description: description.trim(),
        eventTime: eventTime ? new Date(eventTime) : new Date(),
        createdBy: req.user!.id,
        documentId: documentId || null,
        evidenceId: evidenceId || null,
      },
      include: {
        creator: { select: { id: true, fullName: true, email: true } },
        document: { select: { id: true, title: true, documentType: true } },
        evidence: { select: { id: true, evidenceNumber: true, evidenceType: true, description: true } },
      },
    });

    await AuditService.record({
      actorId: req.user!.id,
      action: 'timeline.event_create',
      resourceType: 'timeline_event',
      resourceId: event.id,
      outcome: 'SUCCESS',
      metadata: { title, eventTime: event.eventTime },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.status(201).json({ event });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/cases/:caseId/evidence
timelineRouter.get('/cases/:caseId/evidence', authGuard, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { caseId } = req.params;
    const hasAccess = await checkCaseAccess(req.user!.id, caseId, req.user!.roles);
    if (!hasAccess) {
      throw new ForbiddenError('Access denied');
    }

    const evidenceItems = await prisma.evidence.findMany({
      where: { caseId },
      orderBy: { collectedAt: 'desc' },
    });

    return res.json({ evidence: evidenceItems });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/cases/:caseId/evidence
timelineRouter.post('/cases/:caseId/evidence', authGuard, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { caseId } = req.params;
    const { evidenceNumber, evidenceType, description, location } = req.body;

    const hasAccess = await checkCaseAccess(req.user!.id, caseId, req.user!.roles);
    if (!hasAccess) {
      throw new ForbiddenError('Access denied');
    }

    if (!evidenceNumber || !evidenceType || !description) {
      throw new AppError('evidenceNumber, evidenceType, and description are required', 400);
    }

    const item = await prisma.evidence.create({
      data: {
        caseId,
        evidenceNumber: evidenceNumber.trim(),
        evidenceType,
        description: description.trim(),
        location: location?.trim() || null,
        collectedBy: req.user!.fullName,
      },
    });

    await AuditService.record({
      actorId: req.user!.id,
      action: 'evidence.create',
      resourceType: 'evidence',
      resourceId: item.id,
      outcome: 'SUCCESS',
      metadata: { evidenceNumber, evidenceType },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.status(201).json({ evidence: item });
  } catch (error) {
    next(error);
  }
});
