import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { SmsController } from '../controllers/smsController';

const router = Router();

router.post('/send', authenticateToken, SmsController.sendOtp);
router.post('/verify', authenticateToken, SmsController.verifyOtp);

export default router;
