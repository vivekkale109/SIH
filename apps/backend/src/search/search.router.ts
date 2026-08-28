import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../db/prisma';
import { authGuard } from '../common/auth.middleware';

export const searchRouter = Router();

// GET /api/v1/search?q=query&caseId=optional
searchRouter.get('/', authGuard, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { q, caseId } = req.query;

    if (!q || typeof q !== 'string' || q.trim().length === 0) {
      return res.json({ results: [] });
    }

    const queryStr = q.trim();
    const userId = req.user!.id;
    const userRoles = req.user!.roles;

    // Scope check: Determine accessible case IDs for user
    let accessibleCaseIds: string[] = [];
    const isElevated = userRoles.includes('Super Admin') || userRoles.includes('Auditor');

    if (!isElevated) {
      const userCases = await prisma.caseMember.findMany({
        where: { userId },
        select: { caseId: true },
      });
      accessibleCaseIds = userCases.map((c) => c.caseId);

      if (accessibleCaseIds.length === 0) {
        return res.json({ results: [] });
      }
    }

    const caseFilter: any = {};
    if (caseId && typeof caseId === 'string') {
      if (!isElevated && !accessibleCaseIds.includes(caseId)) {
        return res.json({ results: [] });
      }
      caseFilter.caseId = caseId;
    } else if (!isElevated) {
      caseFilter.caseId = { in: accessibleCaseIds };
    }

    // Full-text search over title, type, tags, and OCR extracted text
    const documents = await prisma.document.findMany({
      where: {
        ...caseFilter,
        OR: [
          { title: { contains: queryStr, mode: 'insensitive' } },
          { documentType: { contains: queryStr, mode: 'insensitive' } },
          { tags: { hasSome: [queryStr] } },
          {
            versions: {
              some: {
                ocrResult: {
                  extractedText: { contains: queryStr, mode: 'insensitive' },
                },
              },
            },
          },
        ],
      },
      include: {
        case: { select: { id: true, caseNumber: true, title: true } },
        versions: {
          orderBy: { versionNumber: 'desc' },
          take: 1,
          include: {
            ocrResult: true,
            uploader: { select: { id: true, fullName: true } },
          },
        },
      },
      take: 50,
    });

    const results = documents.map((doc) => {
      const currentVer = doc.versions[0];
      const ocrText = currentVer?.ocrResult?.extractedText || '';

      let highlightSnippet = '';
      if (ocrText) {
        const lowerText = ocrText.toLowerCase();
        const index = lowerText.indexOf(queryStr.toLowerCase());
        if (index !== -1) {
          const start = Math.max(0, index - 40);
          const end = Math.min(ocrText.length, index + queryStr.length + 60);
          highlightSnippet = (start > 0 ? '...' : '') + ocrText.substring(start, end) + (end < ocrText.length ? '...' : '');
        }
      }

      if (!highlightSnippet) {
        highlightSnippet = `Matched metadata: Document Title "${doc.title}", Type "${doc.documentType}"`;
      }

      return {
        id: doc.id,
        title: doc.title,
        documentType: doc.documentType,
        case: doc.case,
        currentVersionNumber: currentVer?.versionNumber || 1,
        sha256: currentVer?.sha256 || '',
        ocrStatus: currentVer?.ocrStatus || 'PENDING',
        uploadedAt: doc.createdAt,
        highlightSnippet,
      };
    });

    return res.json({
      query: queryStr,
      count: results.length,
      results,
    });
  } catch (error) {
    next(error);
  }
});
