import { Router } from 'express';
import { CourseController } from '../controllers/courseController';
import { authenticateToken, requireRole } from '../middleware/auth';
import { uploadMiddleware } from '../services/storageService';

const router = Router();

router.get('/', CourseController.getAllCourses);
router.get('/:id', authenticateToken, CourseController.getCourseById);
router.post(
  '/',
  authenticateToken,
  requireRole(['admin', 'trainer']),
  CourseController.createCourse
);
router.put(
  '/:id',
  authenticateToken,
  requireRole(['admin', 'trainer']),
  CourseController.updateCourse
);
router.delete(
  '/:id',
  authenticateToken,
  requireRole(['admin', 'trainer']),
  CourseController.deleteCourse
);
router.post(
  '/upload',
  authenticateToken,
  requireRole(['admin', 'trainer']),
  uploadMiddleware.single('file'),
  CourseController.uploadMedia
);

export default router;
