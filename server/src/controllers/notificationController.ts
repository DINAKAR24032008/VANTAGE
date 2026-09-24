import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../services/authService';
import { AuthenticatedRequest } from '../types';

const normalizeTimeStr = (val: any): any => {
  if (typeof val !== 'string') return val;
  let str = val.trim();
  // Strip trailing seconds if present (e.g. "09:00:00" -> "09:00")
  if (/^([0-1][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/.test(str)) {
    str = str.slice(0, 5);
  }
  // Pad single digit hour (e.g. "9:00" -> "09:00")
  if (/^[0-9]:[0-5][0-9]$/.test(str)) {
    str = '0' + str;
  }
  return str;
};

const PreferenceSchema = z.object({
  inAppEnabled: z.boolean().optional(),
  smsEnabled: z.boolean().optional(),
  dailyReminderEnabled: z.boolean().optional(),
  reminderTime: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format. Use HH:mm (00:00 to 23:59)').optional(),
  timezone: z.string().min(1, 'Timezone cannot be empty').optional(),
  quietHoursStart: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format. Use HH:mm').optional(),
  quietHoursEnd: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format. Use HH:mm').optional(),
});

export class NotificationController {
  /**
   * GET /api/notifications
   * Paginated list of user notifications + unreadCount
   */
  static async getNotifications(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Your session expired. Please log in again.', code: 'USER_NOT_FOUND' });
      }

      const userId = req.user.userId;
      const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit || '20'), 10)));
      const cursor = req.query.cursor ? String(req.query.cursor) : undefined;

      const unreadCount = await prisma.notification.count({
        where: { userId, readAt: null },
      });

      const notifications = await prisma.notification.findMany({
        where: { userId },
        take: limit + 1,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        orderBy: { createdAt: 'desc' },
      });

      let nextCursor: string | null = null;
      if (notifications.length > limit) {
        const nextItem = notifications.pop();
        nextCursor = nextItem ? nextItem.id : null;
      }

      return res.json({
        items: notifications,
        nextCursor,
        unreadCount,
      });
    } catch (err: any) {
      console.error('[GetNotifications Error]:', err);
      return res.status(500).json({ message: 'Failed to retrieve notifications', code: 'SERVER_ERROR' });
    }
  }

  /**
   * PATCH /api/notifications/:id/read
   * Mark single notification as read
   */
  static async markAsRead(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Your session expired. Please log in again.', code: 'USER_NOT_FOUND' });
      }

      const id = Array.isArray(req.params.id) ? req.params.id[0] : String(req.params.id);

      const notif = await prisma.notification.findFirst({
        where: { id, userId: req.user.userId },
      });

      if (!notif) {
        return res.status(404).json({ message: 'Notification not found', code: 'NOT_FOUND' });
      }

      const updated = await prisma.notification.update({
        where: { id },
        data: { readAt: new Date() },
      });

      return res.json(updated);
    } catch (err: any) {
      console.error('[MarkAsRead Error]:', err);
      return res.status(500).json({ message: 'Failed to mark notification as read', code: 'SERVER_ERROR' });
    }
  }

  /**
   * PATCH /api/notifications/read-all
   * Mark all unread notifications as read
   */
  static async markAllAsRead(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Your session expired. Please log in again.', code: 'USER_NOT_FOUND' });
      }

      await prisma.notification.updateMany({
        where: { userId: req.user.userId, readAt: null },
        data: { readAt: new Date() },
      });

      return res.json({ success: true, message: 'All notifications marked as read' });
    } catch (err: any) {
      console.error('[MarkAllAsRead Error]:', err);
      return res.status(500).json({ message: 'Failed to mark all notifications as read', code: 'SERVER_ERROR' });
    }
  }

  /**
   * DELETE /api/notifications/:id
   * Delete single notification
   */
  static async deleteNotification(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Your session expired. Please log in again.', code: 'USER_NOT_FOUND' });
      }

      const id = Array.isArray(req.params.id) ? req.params.id[0] : String(req.params.id);

      const notif = await prisma.notification.findFirst({
        where: { id, userId: req.user.userId },
      });

      if (!notif) {
        return res.status(404).json({ message: 'Notification not found', code: 'NOT_FOUND' });
      }

      await prisma.notification.delete({ where: { id } });

      return res.json({ success: true, id });
    } catch (err: any) {
      console.error('[DeleteNotification Error]:', err);
      return res.status(500).json({ message: 'Failed to delete notification', code: 'SERVER_ERROR' });
    }
  }

  /**
   * GET /api/notifications/preferences
   * Fetch current user's notification preferences
   */
  static async getPreferences(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Your session expired. Please log in again.', code: 'USER_NOT_FOUND' });
      }

      let pref = await prisma.notificationPreference.findUnique({
        where: { userId: req.user.userId },
      });

      if (!pref) {
        pref = await prisma.notificationPreference.create({
          data: {
            userId: req.user.userId,
            inAppEnabled: true,
            smsEnabled: false,
            dailyReminderEnabled: true,
            reminderTime: '09:00',
            timezone: 'Asia/Kolkata',
            quietHoursStart: '22:00',
            quietHoursEnd: '07:00',
          },
        });
      }

      return res.json(pref);
    } catch (err: any) {
      console.error('[GetPreferences Error]:', err);
      return res.status(500).json({ message: 'Failed to get preferences', code: 'SERVER_ERROR' });
    }
  }

  /**
   * PUT /api/notifications/preferences
   * Update notification preferences with Zod validation
   */
  static async updatePreferences(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Your session expired. Please log in again.', code: 'USER_NOT_FOUND' });
      }

      const raw = { ...req.body };
      if (raw.reminderTime) raw.reminderTime = normalizeTimeStr(raw.reminderTime);
      if (raw.quietHoursStart) raw.quietHoursStart = normalizeTimeStr(raw.quietHoursStart);
      if (raw.quietHoursEnd) raw.quietHoursEnd = normalizeTimeStr(raw.quietHoursEnd);

      const body = PreferenceSchema.parse(raw);

      // Guard: cannot enable SMS if phone is not verified
      if (body.smsEnabled === true) {
        const user = await prisma.user.findUnique({
          where: { id: req.user.userId },
          select: { phoneVerified: true, phone: true },
        });
        if (!user?.phoneVerified || !user?.phone) {
          return res.status(400).json({
            message: 'Verify your mobile number before enabling SMS Alerts.',
            code: 'PHONE_NOT_VERIFIED',
          });
        }
      }

      const updated = await prisma.notificationPreference.upsert({
        where: { userId: req.user.userId },
        update: body,
        create: {
          userId: req.user.userId,
          inAppEnabled: body.inAppEnabled ?? true,
          smsEnabled: body.smsEnabled ?? false,
          dailyReminderEnabled: body.dailyReminderEnabled ?? true,
          reminderTime: body.reminderTime ?? '09:00',
          timezone: body.timezone ?? 'Asia/Kolkata',
          quietHoursStart: body.quietHoursStart ?? '22:00',
          quietHoursEnd: body.quietHoursEnd ?? '07:00',
        },
      });

      return res.json(updated);
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        const firstErr = err.errors[0];
        const fieldName = firstErr.path.join('.');
        return res.status(400).json({
          message: fieldName ? `Invalid value for ${fieldName}: ${firstErr.message}` : firstErr.message,
          code: 'VALIDATION_ERROR',
          details: err.errors,
        });
      }
      console.error('[UpdatePreferences Error]:', err);
      return res.status(500).json({ message: 'Failed to update preferences', code: 'SERVER_ERROR' });
    }
  }
}
