import { Router } from 'express';
import { AdminMatrixController } from '../controllers/adminMatrixController';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

router.get('/matrix', authenticateToken, requireRole(['admin']), AdminMatrixController.getAllRoleMatrices);
router.put('/matrix/:jobRole', authenticateToken, requireRole(['admin']), AdminMatrixController.updateRoleMatrix);

export default router;
