import { Router } from 'express';
import { ProfileController } from '../controllers/profileController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Profile CRUD (Authenticated)
router.get('/me', authenticateToken, ProfileController.getMyProfile);
router.put('/me', authenticateToken, ProfileController.updateMyProfile);
router.post('/me/complete', authenticateToken, ProfileController.completeProfile);

// LinkedIn URL update
router.put('/me/linkedin', authenticateToken, ProfileController.updateLinkedin);

// Skills
router.get('/me/skills', authenticateToken, ProfileController.getSkills);
router.put('/me/skills', authenticateToken, ProfileController.updateSkills);

// Achievements
router.get('/me/achievements', authenticateToken, ProfileController.getAchievements);
router.post('/me/achievements', authenticateToken, ProfileController.addAchievement);
router.put('/me/achievements/:id', authenticateToken, ProfileController.updateAchievement);
router.delete('/me/achievements/:id', authenticateToken, ProfileController.deleteAchievement);

// Experiences
router.get('/me/experience', authenticateToken, ProfileController.getExperiences);
router.post('/me/experience', authenticateToken, ProfileController.addExperience);
router.put('/me/experience/:id', authenticateToken, ProfileController.updateExperience);
router.delete('/me/experience/:id', authenticateToken, ProfileController.deleteExperience);

// Public / Learner Profile View
router.get('/:userId', authenticateToken, ProfileController.getPublicProfile);

export default router;
