import { Router } from 'express';
import { CompetencyController } from '../controllers/competencyController';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

// Competency library
router.get('/competencies', CompetencyController.getAllCompetencies);
router.post(
  '/competencies',
  authenticateToken,
  requireRole(['admin', 'trainer']),
  CompetencyController.createCompetency
);

// Learner profile & onboarding
router.get('/learners/:id/profile', authenticateToken, CompetencyController.getLearnerProfile);
router.put('/learners/:id/profile', authenticateToken, CompetencyController.updateLearnerProfile);

// Gap analysis engine & recommendations
router.get('/learners/:id/recommendations', authenticateToken, CompetencyController.getRecommendations);

export default router;
