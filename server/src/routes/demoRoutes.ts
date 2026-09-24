import { Router } from 'express';
import { DemoController } from '../controllers/demoController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Demo Mode Endpoint Routes (Authenticated)
router.post('/reminders/send-now', authenticateToken, DemoController.sendTestReminderNow);
router.post('/reminders/simulate-enrollment', authenticateToken, DemoController.simulateEnrollment);
router.post('/reminders/schedule-in-1-min', authenticateToken, DemoController.scheduleInOneMin);
router.post('/reminders/simulate-next-day', authenticateToken, DemoController.simulateNextDay);
router.post('/reminders/reset', authenticateToken, DemoController.resetTodayReminder);
router.post('/reminders/send-sms-test', authenticateToken, DemoController.sendSmsTest);
router.get('/scheduler-log', authenticateToken, DemoController.getSchedulerLog);

// On-demand job trigger
router.post('/dev/run-daily-reminders', authenticateToken, DemoController.runDailyRemindersOnDemand);

export default router;
