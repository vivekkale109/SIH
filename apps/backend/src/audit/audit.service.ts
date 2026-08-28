import { prisma } from '../db/prisma';

export interface AuditParams {
  actorId?: string | null;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  outcome?: 'SUCCESS' | 'FAILURE' | 'DENIED';
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export class AuditService {
  public static async record(params: AuditParams): Promise<void> {
    try {
      await prisma.auditEvent.create({
        data: {
          actorId: params.actorId || null,
          action: params.action,
          resourceType: params.resourceType,
          resourceId: params.resourceId || null,
          outcome: params.outcome || 'SUCCESS',
          metadata: params.metadata ? JSON.stringify(params.metadata) : null,
          ipAddress: params.ipAddress || null,
          userAgent: params.userAgent || null,
        },
      });
    } catch (err) {
      console.error('Failed to record audit event:', err);
      // Audit recording failure should not crash main request if DB hiccup, but log prominently
    }
  }
}
