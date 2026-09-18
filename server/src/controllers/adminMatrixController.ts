import { Request, Response } from 'express';
import { prisma } from '../services/authService';
import { GapAnalysisService } from '../services/gapAnalysisService';
import { AuthenticatedRequest } from '../types';

export class AdminMatrixController {
  static async getAllRoleMatrices(req: Request, res: Response) {
    try {
      const matrices = await prisma.roleCompetencyRequirement.findMany({
        orderBy: { jobRole: 'asc' },
      });

      const formatted = matrices.map((m) => ({
        ...m,
        requirements: JSON.parse(m.requirements || '[]'),
      }));

      return res.json(formatted);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  static async updateRoleMatrix(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Only administrators can modify role competency requirements' });
      }

      const jobRole = String(req.params.jobRole);
      const { department, requirements } = req.body;

      if (!Array.isArray(requirements)) {
        return res.status(400).json({ error: 'Requirements must be an array of competency specifications' });
      }

      const updated = await prisma.roleCompetencyRequirement.upsert({
        where: { jobRole },
        create: {
          jobRole,
          department: department || 'Ministry of Earth Sciences',
          requirements: JSON.stringify(requirements),
        },
        update: {
          ...(department ? { department } : {}),
          requirements: JSON.stringify(requirements),
        },
      });

      // Automated Feedback Loop: Recompute gap analysis & recommendations for all learners in this role
      const feedbackLoopResult = await GapAnalysisService.recomputeAllLearnersForRole(jobRole);

      return res.json({
        message: `Competency matrix updated for '${jobRole}'. Feedback loop successfully recomputed recommendations for ${feedbackLoopResult.totalLearnersUpdated} learner(s).`,
        matrix: {
          ...updated,
          requirements: JSON.parse(updated.requirements),
        },
        feedbackLoop: feedbackLoopResult,
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }
}
