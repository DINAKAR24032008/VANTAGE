import { Router } from 'express';
import { AdminController } from '../controllers/adminController';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

// Strictly Admin-only aggregated learner progress
router.get(
  '/learners-progress',
  authenticateToken,
  requireRole(['admin']),
  AdminController.getAggregatedProgress
);

export default router;
