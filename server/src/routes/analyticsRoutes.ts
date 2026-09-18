import { Router } from 'express';
import { AnalyticsController } from '../controllers/analyticsController';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

// Org analytics: admin & trainers can view aggregate dashboards
router.get('/summary', authenticateToken, requireRole(['admin', 'trainer']), AnalyticsController.getSummary);
router.get('/courses', authenticateToken, requireRole(['admin', 'trainer']), AnalyticsController.getCourseCompletionRates);
router.get('/heatmap', authenticateToken, requireRole(['admin', 'trainer']), AnalyticsController.getDepartmentGapHeatmap);

export default router;
