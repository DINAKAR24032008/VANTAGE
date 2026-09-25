import { Router } from 'express';
import { ProfileController } from '../controllers/profileController';
import { authenticateToken, optionalAuthenticateToken } from '../middleware/auth';

const router = Router();

// Profile CRUD (Authenticated)
router.get('/me', authenticateToken, ProfileController.getMyProfile);
router.put('/me', authenticateToken, ProfileController.updateMyProfile);
router.post('/me/complete', authenticateToken, ProfileController.completeProfile);

// Username & Visibility Updates
router.put('/me/username', authenticateToken, ProfileController.updateUsername);
router.put('/me/visibility', authenticateToken, ProfileController.updateVisibility);

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

// Public Profile View by @username (Optional Auth)
router.get('/u/:username', optionalAuthenticateToken, ProfileController.getProfileByUsername);

// Public / Learner Profile View by ID (Authenticated)
router.get('/:userId', authenticateToken, ProfileController.getPublicProfile);

export default router;
