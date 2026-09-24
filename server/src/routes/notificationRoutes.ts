import { Router } from 'express';
import { NotificationController } from '../controllers/notificationController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Notification Management Routes (Authenticated)
router.get('/', authenticateToken, NotificationController.getNotifications);
router.patch('/read-all', authenticateToken, NotificationController.markAllAsRead);
router.patch('/:id/read', authenticateToken, NotificationController.markAsRead);
router.delete('/:id', authenticateToken, NotificationController.deleteNotification);

// Preference Routes
router.get('/preferences', authenticateToken, NotificationController.getPreferences);
router.put('/preferences', authenticateToken, NotificationController.updatePreferences);

export default router;
