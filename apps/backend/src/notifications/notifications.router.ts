import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../db/prisma';
import { authGuard } from '../common/auth.middleware';

export const notificationsRouter = Router();

// GET /api/v1/notifications
notificationsRouter.get('/', authGuard, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const unreadCount = await prisma.notification.count({
      where: { userId, read: false },
    });

    return res.json({ notifications, unreadCount });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/v1/notifications/:id/read
notificationsRouter.patch('/:id/read', authGuard, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    await prisma.notification.updateMany({
      where: { id, userId },
      data: { read: true },
    });

    return res.json({ message: 'Notification marked as read' });
  } catch (error) {
    next(error);
  }
});
