import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../db/prisma';
import { config } from '../config';
import { authGuard, rbacGuard } from '../common/auth.middleware';
import { AuditService } from '../audit/audit.service';
import { AppError, UnauthorizedError, NotFoundError } from '../common/errors';

export const authRouter = Router();

// POST /api/v1/auth/login
authRouter.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new AppError('Email and password are required', 400);
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) {
      await AuditService.record({
        action: 'user.login',
        resourceType: 'user',
        outcome: 'FAILURE',
        metadata: { emailAttempted: email, reason: 'User not found' },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
      throw new UnauthorizedError('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      await AuditService.record({
        actorId: user.id,
        action: 'user.login',
        resourceType: 'user',
        outcome: 'FAILURE',
        metadata: { reason: 'Incorrect password' },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
      throw new UnauthorizedError('Invalid credentials');
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedError('Account is deactivated. Contact system administrator.');
    }

    const roles = user.userRoles.map((ur) => ur.role.name);

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      config.jwt.secret,
      { expiresIn: '24h' }
    );

    res.cookie(config.jwt.cookieName, token, {
      httpOnly: true,
      secure: config.env === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000,
    });

    await AuditService.record({
      actorId: user.id,
      action: 'user.login',
      resourceType: 'user',
      resourceId: user.id,
      outcome: 'SUCCESS',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        roles,
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/auth/logout
authRouter.post('/logout', authGuard, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;

    res.clearCookie(config.jwt.cookieName, {
      httpOnly: true,
      secure: config.env === 'production',
      sameSite: 'lax',
    });

    if (userId) {
      await AuditService.record({
        actorId: userId,
        action: 'user.logout',
        resourceType: 'user',
        resourceId: userId,
        outcome: 'SUCCESS',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
    }

    return res.json({ message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/auth/me
authRouter.get('/me', authGuard, async (req: Request, res: Response, next: NextFunction) => {
  try {
    return res.json({
      user: req.user,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/roles
authRouter.get('/roles', authGuard, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const roles = await prisma.role.findMany({
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
      },
    });
    return res.json({ roles });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/admin/users (Super Admin)
authRouter.get('/admin/users', authGuard, rbacGuard(['Super Admin']), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        fullName: true,
        status: true,
        createdAt: true,
        userRoles: {
          include: {
            role: true,
          },
        },
        caseMembers: {
          select: {
            caseId: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = users.map((u) => ({
      id: u.id,
      email: u.email,
      fullName: u.fullName,
      status: u.status,
      createdAt: u.createdAt,
      roles: u.userRoles.map((ur) => ur.role.name),
      caseCount: u.caseMembers.length,
    }));

    return res.json({ users: formatted });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/admin/users/:id/roles (Super Admin)
authRouter.post('/admin/users/:id/roles', authGuard, rbacGuard(['Super Admin']), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { roleNames } = req.body;

    if (!Array.isArray(roleNames)) {
      throw new AppError('roleNames must be an array of string role names', 400);
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const roles = await prisma.role.findMany({
      where: { name: { in: roleNames } },
    });

    await prisma.userRole.deleteMany({ where: { userId: id } });

    await prisma.userRole.createMany({
      data: roles.map((r) => ({ userId: id, roleId: r.id })),
    });

    await AuditService.record({
      actorId: req.user?.id,
      action: 'role.assign',
      resourceType: 'user',
      resourceId: id,
      outcome: 'SUCCESS',
      metadata: { targetUser: user.email, assignedRoles: roleNames },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.json({ message: 'Roles updated successfully', roles: roleNames });
  } catch (error) {
    next(error);
  }
});
