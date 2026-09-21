import { Router } from 'express';
import { CourseController } from '../controllers/courseController';
import { authenticateToken, optionalAuthenticateToken, requireRole } from '../middleware/auth';
import { uploadMiddleware } from '../services/storageService';

const router = Router();

router.get('/', optionalAuthenticateToken, CourseController.getAllCourses);
router.get('/:id', optionalAuthenticateToken, CourseController.getCourseById);
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
router.patch(
  '/:id/status',
  authenticateToken,
  requireRole(['admin', 'trainer']),
  CourseController.updateCourseStatus
);
router.delete(
  '/:id',
  authenticateToken,
  requireRole(['admin', 'trainer']),
  CourseController.deleteCourse
);
router.get(
  '/:id/learners',
  authenticateToken,
  requireRole(['admin', 'trainer']),
  CourseController.getCourseLearners
);
router.get(
  '/:id/learners/export',
  authenticateToken,
  requireRole(['admin', 'trainer']),
  CourseController.exportCourseLearnersCSV
);
router.post(
  '/upload',
  authenticateToken,
  requireRole(['admin', 'trainer']),
  uploadMiddleware.single('file'),
  CourseController.uploadMedia
);

export default router;
