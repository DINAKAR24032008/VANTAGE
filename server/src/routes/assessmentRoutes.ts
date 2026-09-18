import { Router } from 'express';
import { AssessmentController } from '../controllers/assessmentController';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

// Assessment definition & attempts
router.get('/course/:courseId', authenticateToken, AssessmentController.getCourseAssessment);
router.post(
  '/course/:courseId',
  authenticateToken,
  requireRole(['admin', 'trainer']),
  AssessmentController.saveAssessment
);
router.post('/:id/attempt', authenticateToken, AssessmentController.attemptAssessment);

// Certificates
router.get('/certificates/my', authenticateToken, AssessmentController.getMyCertificates);
router.get('/certificates/verify/:certNumber', AssessmentController.getCertificateByNumber);

export default router;
