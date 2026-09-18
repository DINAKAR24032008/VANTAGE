import { Request, Response } from 'express';
import { prisma } from '../services/authService';
import { GapAnalysisService } from '../services/gapAnalysisService';
import { AuthenticatedRequest, SkillRating } from '../types';

export class CompetencyController {
  static async getAllCompetencies(req: Request, res: Response) {
    try {
      const competencies = await prisma.competency.findMany({
        orderBy: [{ category: 'asc' }, { name: 'asc' }],
      });
      return res.json(competencies);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  static async createCompetency(req: Request, res: Response) {
    try {
      const { name, category, description } = req.body;
      if (!name || !category || !description) {
        return res.status(400).json({ error: 'Name, category, and description are required' });
      }

      const existing = await prisma.competency.findUnique({ where: { name } });
      if (existing) {
        return res.status(400).json({ error: 'A competency with this name already exists' });
      }

      const competency = await prisma.competency.create({
        data: { name, category, description },
      });

      return res.status(201).json(competency);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  static async getLearnerProfile(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = String(req.params.id);

      // Ensure user is authorized to see profile (own profile or admin/trainer)
      if (req.user?.role === 'learner' && req.user.userId !== userId) {
        return res.status(403).json({ error: 'Forbidden. You can only view your own profile.' });
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { profile: true },
      });

      if (!user) {
        return res.status(404).json({ error: 'Learner not found' });
      }

      let skills: SkillRating[] = [];
      if (user.profile && user.profile.skills) {
        try {
          skills = JSON.parse(user.profile.skills);
        } catch (e) {
          skills = [];
        }
      }

      return res.json({
        userId: user.id,
        name: user.name,
        department: user.department,
        jobRole: user.jobRole,
        skills,
        updatedAt: user.profile?.updatedAt,
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  static async updateLearnerProfile(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = String(req.params.id);

      if (req.user?.role === 'learner' && req.user.userId !== userId) {
        return res.status(403).json({ error: 'Forbidden. You can only update your own profile.' });
      }

      const { skills, jobRole, department } = req.body;

      if (!Array.isArray(skills)) {
        return res.status(400).json({ error: 'Skills must be an array of competency ratings' });
      }

      // Update user details if provided (e.g. during onboarding)
      if (jobRole || department) {
        await prisma.user.update({
          where: { id: userId },
          data: {
            ...(jobRole ? { jobRole } : {}),
            ...(department ? { department } : {}),
          },
        });
      }

      const updatedProfile = await prisma.competencyProfile.upsert({
        where: { userId },
        create: {
          userId,
          skills: JSON.stringify(skills),
        },
        update: {
          skills: JSON.stringify(skills),
        },
      });

      return res.json({
        message: 'Competency profile updated successfully',
        profile: {
          ...updatedProfile,
          skills: JSON.parse(updatedProfile.skills),
        },
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  static async getRecommendations(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = String(req.params.id);

      if (req.user?.role === 'learner' && req.user.userId !== userId) {
        return res.status(403).json({ error: 'Forbidden. You can only view your own recommendations.' });
      }

      const analysis = await GapAnalysisService.computeGapAnalysis(userId);
      return res.json(analysis);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }
}
