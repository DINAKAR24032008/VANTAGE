import { Router } from 'express';
import { EnrollmentController } from '../controllers/enrollmentController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.post('/', authenticateToken, EnrollmentController.enroll);
router.get('/my', authenticateToken, EnrollmentController.getMyEnrollments);
router.put('/:id/progress', authenticateToken, EnrollmentController.updateProgress);

export default router;
