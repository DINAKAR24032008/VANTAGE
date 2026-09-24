import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { SmsController } from '../controllers/smsController';

const router = Router();

router.post('/send-otp', authenticateToken, SmsController.sendOtp);
router.post('/verify-otp', authenticateToken, SmsController.verifyOtp);
router.post('/webhook', SmsController.handleWebhook);

export default router;
