import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../db/prisma';
import { authGuard, rbacGuard } from '../common/auth.middleware';

export const auditRouter = Router();

// GET /api/v1/audit (Auditor & Super Admin only)
auditRouter.get('/', authGuard, rbacGuard(['Auditor', 'Super Admin', 'Supervisor / Reviewing Officer']), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { actorId, action, resourceType, outcome, startDate, endDate, limit = '100', page = '1' } = req.query;

    const take = Math.min(parseInt(limit as string, 10) || 50, 200);
    const skip = ((parseInt(page as string, 10) || 1) - 1) * take;

    const where: any = {};

    if (actorId) where.actorId = actorId as string;
    if (action) where.action = { contains: action as string, mode: 'insensitive' };
    if (resourceType) where.resourceType = resourceType as string;
    if (outcome) where.outcome = outcome as string;

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate as string);
      if (endDate) where.createdAt.lte = new Date(endDate as string);
    }

    const [events, total] = await Promise.all([
      prisma.auditEvent.findMany({
        where,
        include: {
          actor: {
            select: { id: true, fullName: true, email: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take,
        skip,
      }),
      prisma.auditEvent.count({ where }),
    ]);

    const formattedEvents = events.map((ev) => ({
      ...ev,
      parsedMetadata: ev.metadata ? JSON.parse(ev.metadata) : null,
    }));

    return res.json({
      auditEvents: formattedEvents,
      pagination: {
        total,
        page: parseInt(page as string, 10) || 1,
        limit: take,
        totalPages: Math.ceil(total / take),
      },
    });
  } catch (error) {
    next(error);
  }
});
