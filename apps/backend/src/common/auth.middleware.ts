import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { prisma } from '../db/prisma';
import { UnauthorizedError, ForbiddenError } from './errors';

export interface AuthenticatedUser {
  id: string;
  email: string;
  fullName: string;
  roles: string[];
  permissions: string[];
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export async function authGuard(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.cookies[config.jwt.cookieName] || req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      throw new UnauthorizedError('Authentication token missing. Please log in.');
    }

    const payload = jwt.verify(token, config.jwt.secret) as { userId: string };

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedError('User account inactive or not found.');
    }

    const roles = user.userRoles.map((ur) => ur.role.name);
    const permissionsSet = new Set<string>();

    user.userRoles.forEach((ur) => {
      ur.role.rolePermissions.forEach((rp) => {
        permissionsSet.add(`${rp.permission.resourceType}:${rp.permission.action}`);
      });
    });

    req.user = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      roles,
      permissions: Array.from(permissionsSet),
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError) {
      return next(new UnauthorizedError('Session expired or invalid token.'));
    }
    next(error);
  }
}

export function rbacGuard(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError());
    }

    // Super Admin bypasses role checks
    if (req.user.roles.includes('Super Admin')) {
      return next();
    }

    const hasRole = req.user.roles.some((role) => allowedRoles.includes(role));
    if (!hasRole) {
      return next(new ForbiddenError(`Access denied. Requires one of roles: ${allowedRoles.join(', ')}`));
    }

    next();
  };
}

export async function checkCaseAccess(userId: string, caseId: string, userRoles: string[]): Promise<boolean> {
  if (userRoles.includes('Super Admin') || userRoles.includes('Auditor')) {
    return true;
  }

  const membership = await prisma.caseMember.findUnique({
    where: {
      caseId_userId: {
        caseId,
        userId,
      },
    },
  });

  return !!membership;
}
