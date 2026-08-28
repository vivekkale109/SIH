import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../db/prisma';
import { authGuard, rbacGuard, checkCaseAccess } from '../common/auth.middleware';
import { AuditService } from '../audit/audit.service';
import { AppError, ForbiddenError, NotFoundError } from '../common/errors';

export const casesRouter = Router();

// GET /api/v1/cases
casesRouter.get('/', authGuard, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const userRoles = req.user!.roles;

    let cases;
    if (userRoles.includes('Super Admin') || userRoles.includes('Auditor')) {
      cases = await prisma.case.findMany({
        include: {
          members: {
            include: {
              user: {
                select: { id: true, fullName: true, email: true },
              },
            },
          },
          _count: {
            select: { documents: true, evidence: true, timelineEvents: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } else {
      cases = await prisma.case.findMany({
        where: {
          members: {
            some: { userId },
          },
        },
        include: {
          members: {
            include: {
              user: {
                select: { id: true, fullName: true, email: true },
              },
            },
          },
          _count: {
            select: { documents: true, evidence: true, timelineEvents: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    return res.json({ cases });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/cases
casesRouter.post('/', authGuard, rbacGuard(['Case Officer / Investigator', 'Supervisor / Reviewing Officer']), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { caseNumber, title, description, priority } = req.body;

    if (!caseNumber || !title) {
      throw new AppError('caseNumber and title are required fields', 400);
    }

    const existing = await prisma.case.findUnique({ where: { caseNumber } });
    if (existing) {
      throw new AppError(`Case number ${caseNumber} already exists`, 409);
    }

    const newCase = await prisma.case.create({
      data: {
        caseNumber: caseNumber.trim(),
        title: title.trim(),
        description: description?.trim() || null,
        priority: priority || 'MEDIUM',
        createdBy: req.user!.id,
        members: {
          create: {
            userId: req.user!.id,
            roleInCase: 'LEAD_INVESTIGATOR',
          },
        },
      },
      include: {
        members: true,
      },
    });

    await AuditService.record({
      actorId: req.user!.id,
      action: 'case.create',
      resourceType: 'case',
      resourceId: newCase.id,
      outcome: 'SUCCESS',
      metadata: { caseNumber: newCase.caseNumber, title: newCase.title },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.status(201).json({ case: newCase });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/cases/:id
casesRouter.get('/:id', authGuard, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const hasAccess = await checkCaseAccess(req.user!.id, id, req.user!.roles);

    if (!hasAccess) {
      throw new ForbiddenError('Access denied: You are not a member of this case.');
    }

    const caseItem = await prisma.case.findUnique({
      where: { id },
      include: {
        creator: { select: { id: true, fullName: true, email: true } },
        members: {
          include: {
            user: { select: { id: true, fullName: true, email: true } },
          },
        },
        _count: {
          select: { documents: true, evidence: true, timelineEvents: true },
        },
      },
    });

    if (!caseItem) {
      throw new NotFoundError('Case not found');
    }

    return res.json({ case: caseItem });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/v1/cases/:id
casesRouter.patch('/:id', authGuard, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const hasAccess = await checkCaseAccess(req.user!.id, id, req.user!.roles);

    if (!hasAccess) {
      throw new ForbiddenError('Access denied: Cannot edit this case');
    }

    const { title, description, status, priority } = req.body;

    const updated = await prisma.case.update({
      where: { id },
      data: {
        ...(title && { title: title.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(status && { status }),
        ...(priority && { priority }),
      },
    });

    await AuditService.record({
      actorId: req.user!.id,
      action: 'case.update',
      resourceType: 'case',
      resourceId: id,
      outcome: 'SUCCESS',
      metadata: { updatedFields: Object.keys(req.body) },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.json({ case: updated });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/cases/:id/members
casesRouter.post('/:id/members', authGuard, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { userId, roleInCase } = req.body;

    const hasAccess = await checkCaseAccess(req.user!.id, id, req.user!.roles);
    if (!hasAccess) {
      throw new ForbiddenError('Access denied');
    }

    const targetUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!targetUser) {
      throw new NotFoundError('User to add not found');
    }

    const member = await prisma.caseMember.upsert({
      where: { caseId_userId: { caseId: id, userId } },
      create: {
        caseId: id,
        userId,
        roleInCase: roleInCase || 'INVESTIGATOR',
      },
      update: {
        roleInCase: roleInCase || 'INVESTIGATOR',
      },
      include: {
        user: { select: { id: true, fullName: true, email: true } },
      },
    });

    await prisma.notification.create({
      data: {
        userId,
        title: 'Added to Case',
        message: `You have been added to case ${id} as ${roleInCase || 'INVESTIGATOR'}`,
        type: 'CASE_ADDED',
        referenceType: 'case',
        referenceId: id,
      },
    });

    await AuditService.record({
      actorId: req.user!.id,
      action: 'case.member_add',
      resourceType: 'case',
      resourceId: id,
      outcome: 'SUCCESS',
      metadata: { addedUser: targetUser.email, roleInCase },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.status(201).json({ member });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/v1/cases/:id/members/:userId
casesRouter.delete('/:id/members/:userId', authGuard, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id, userId } = req.params;

    const hasAccess = await checkCaseAccess(req.user!.id, id, req.user!.roles);
    if (!hasAccess) {
      throw new ForbiddenError('Access denied');
    }

    await prisma.caseMember.delete({
      where: { caseId_userId: { caseId: id, userId } },
    });

    await AuditService.record({
      actorId: req.user!.id,
      action: 'case.member_remove',
      resourceType: 'case',
      resourceId: id,
      outcome: 'SUCCESS',
      metadata: { removedUserId: userId },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.json({ message: 'Member removed from case' });
  } catch (error) {
    next(error);
  }
});
