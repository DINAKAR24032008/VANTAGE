import { Response } from 'express';
import { prisma } from '../services/authService';
import { ReminderService, getDateInTimezone, getTimeInTimezone } from '../services/reminderService';
import { SmsService } from '../services/smsService';
import { AuthenticatedRequest } from '../types';

export class DemoController {
  /** Helper: Guard demo endpoints, returning 404 when DEMO_MODE is not true */
  private static checkDemoAllowed(res: Response): boolean {
    const isDemoEnabled = process.env.DEMO_MODE === 'true' || process.env.NODE_ENV !== 'production';
    if (!isDemoEnabled) {
      res.status(404).json({ message: 'Demo endpoints disabled in production', code: 'NOT_FOUND' });
      return false;
    }
    return true;
  }

  /** POST /api/demo/reminders/send-now */
  static async sendTestReminderNow(req: AuthenticatedRequest, res: Response) {
    if (!DemoController.checkDemoAllowed(res)) return;
    try {
      if (!req.user) return res.status(401).json({ message: 'Unauthorized', code: 'USER_NOT_FOUND' });

      const notif = await ReminderService.sendTestReminderNow(req.user.userId);
      return res.json({
        message: 'Test reminder created successfully',
        notification: notif,
      });
    } catch (err: any) {
      console.error('[SendTestReminderNow Error]:', err);
      return res.status(500).json({ message: err.message || 'Failed to send test reminder', code: 'SERVER_ERROR' });
    }
  }

  /** POST /api/demo/reminders/simulate-enrollment */
  static async simulateEnrollment(req: AuthenticatedRequest, res: Response) {
    if (!DemoController.checkDemoAllowed(res)) return;
    try {
      if (!req.user) return res.status(401).json({ message: 'Unauthorized', code: 'USER_NOT_FOUND' });

      // Find first course in catalog
      const course = await prisma.course.findFirst({
        include: { trainer: true },
      });

      if (!course) {
        return res.status(404).json({ message: 'No course found to simulate enrollment', code: 'NOT_FOUND' });
      }

      // Check existing enrollment
      let enrollment = await prisma.enrollment.findUnique({
        where: { userId_courseId: { userId: req.user.userId, courseId: course.id } },
      });

      if (!enrollment) {
        enrollment = await prisma.enrollment.create({
          data: {
            userId: req.user.userId,
            courseId: course.id,
            status: 'in_progress',
            progressPercent: 0,
            completedModules: '[]',
          },
        });
      }

      // Create Instant ENROLLMENT notification for Learner
      const learnerNotif = await prisma.notification.create({
        data: {
          userId: req.user.userId,
          type: 'ENROLLMENT',
          title: '🎓 Course Enrollment Confirmed',
          message: `You're enrolled in ${course.title}. Start with Module 1.`,
          courseId: course.id,
          actionUrl: `/courses/${course.id}`,
        },
      });

      // Create ENROLLMENT notification for Trainer if trainer exists
      if (course.trainerId && course.trainerId !== req.user.userId) {
        await prisma.notification.create({
          data: {
            userId: course.trainerId,
            type: 'ENROLLMENT',
            title: '👥 New Student Enrolled',
            message: `${req.user.name} enrolled in your course "${course.title}".`,
            courseId: course.id,
            actionUrl: `/trainer`,
          },
        }).catch((e) => console.error('[Trainer Enrollment Notif Error]:', e));
      }

      return res.json({
        message: `Simulated enrollment in "${course.title}"`,
        notification: learnerNotif,
        enrollment,
      });
    } catch (err: any) {
      console.error('[SimulateEnrollment Error]:', err);
      return res.status(500).json({ message: err.message || 'Failed to simulate enrollment', code: 'SERVER_ERROR' });
    }
  }

  /** POST /api/demo/reminders/schedule-in-1-min */
  static async scheduleInOneMin(req: AuthenticatedRequest, res: Response) {
    if (!DemoController.checkDemoAllowed(res)) return;
    try {
      if (!req.user) return res.status(401).json({ message: 'Unauthorized', code: 'USER_NOT_FOUND' });

      let pref = await prisma.notificationPreference.findUnique({ where: { userId: req.user.userId } });
      const tz = pref?.timezone || 'Asia/Kolkata';

      // Compute time +1 minute in user timezone
      const targetDate = new Date(Date.now() + 60 * 1000);
      const targetTimeStr = getTimeInTimezone(tz, targetDate);

      // Also reset lastReminderSentOn so it fires cleanly
      await prisma.notificationPreference.upsert({
        where: { userId: req.user.userId },
        update: {
          dailyReminderEnabled: true,
          reminderTime: targetTimeStr,
          lastReminderSentOn: null,
          quietHoursStart: '23:59', // Temporarily disable quiet hours block for test
          quietHoursEnd: '00:01',
        },
        create: {
          userId: req.user.userId,
          dailyReminderEnabled: true,
          reminderTime: targetTimeStr,
          timezone: tz,
          lastReminderSentOn: null,
        },
      });

      return res.json({
        message: `Scheduled daily reminder for ${targetTimeStr} (${tz}) — firing in 60 seconds`,
        scheduledTime: targetTimeStr,
        countdownSeconds: 60,
      });
    } catch (err: any) {
      console.error('[ScheduleInOneMin Error]:', err);
      return res.status(500).json({ message: 'Failed to schedule 1-minute test', code: 'SERVER_ERROR' });
    }
  }

  /** POST /api/demo/reminders/simulate-next-day */
  static async simulateNextDay(req: AuthenticatedRequest, res: Response) {
    if (!DemoController.checkDemoAllowed(res)) return;
    try {
      if (!req.user) return res.status(401).json({ message: 'Unauthorized', code: 'USER_NOT_FOUND' });

      let pref = await prisma.notificationPreference.findUnique({ where: { userId: req.user.userId } });
      const tz = pref?.timezone || 'Asia/Kolkata';
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const yesterdayStr = getDateInTimezone(tz, yesterday);

      await prisma.notificationPreference.upsert({
        where: { userId: req.user.userId },
        update: { lastReminderSentOn: yesterdayStr },
        create: { userId: req.user.userId, lastReminderSentOn: yesterdayStr },
      });

      return res.json({
        message: 'Simulated next day! lastReminderSentOn pushed back to yesterday.',
        lastReminderSentOn: yesterdayStr,
      });
    } catch (err: any) {
      console.error('[SimulateNextDay Error]:', err);
      return res.status(500).json({ message: 'Failed to simulate next day', code: 'SERVER_ERROR' });
    }
  }

  /** POST /api/demo/reminders/reset */
  static async resetTodayReminder(req: AuthenticatedRequest, res: Response) {
    if (!DemoController.checkDemoAllowed(res)) return;
    try {
      if (!req.user) return res.status(401).json({ message: 'Unauthorized', code: 'USER_NOT_FOUND' });

      await prisma.notificationPreference.updateMany({
        where: { userId: req.user.userId },
        data: { lastReminderSentOn: null },
      });

      // Optionally delete notifications created in the last 24h
      const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      await prisma.notification.deleteMany({
        where: { userId: req.user.userId, createdAt: { gte: dayAgo } },
      });

      return res.json({ message: "Reset today's reminder state and cleared recent demo notifications." });
    } catch (err: any) {
      console.error('[ResetTodayReminder Error]:', err);
      return res.status(500).json({ message: 'Failed to reset reminder state', code: 'SERVER_ERROR' });
    }
  }

  /** GET /api/demo/scheduler-log */
  static async getSchedulerLog(_req: AuthenticatedRequest, res: Response) {
    if (!DemoController.checkDemoAllowed(res)) return;
    try {
      const logs = ReminderService.getSchedulerLogs();
      return res.json({ logs });
    } catch (err: any) {
      return res.status(500).json({ message: 'Failed to fetch scheduler log', code: 'SERVER_ERROR' });
    }
  }

  /** POST /api/demo/reminders/send-sms-test */
  static async sendSmsTest(req: AuthenticatedRequest, res: Response) {
    if (!DemoController.checkDemoAllowed(res)) return;
    try {
      if (!req.user) return res.status(401).json({ message: 'Unauthorized', code: 'USER_NOT_FOUND' });

      const currentUserId = req.user.userId;
      const user = await prisma.user.findUnique({
        where: { id: currentUserId },
        include: { enrollments: { include: { course: true } } },
      });

      if (!user) {
        return res.status(404).json({ message: 'User not found', code: 'NOT_FOUND' });
      }

      if (!user.phoneVerified || !user.phone) {
        return res.status(400).json({
          message: 'Please verify your mobile number in Notification Settings before sending test SMS.',
          code: 'PHONE_NOT_VERIFIED',
        });
      }

      // Check rate limit: 3 test SMS per hour
      const ONE_HOUR_AGO = new Date(Date.now() - 60 * 60 * 1000);
      const testSmsCount = await prisma.notificationLog.count({
        where: {
          userId: currentUserId,
          channel: 'SMS',
          sentAt: { gte: ONE_HOUR_AGO },
        },
      });

      if (testSmsCount >= 3) {
        return res.status(429).json({
          message: 'Demo SMS rate limit reached. Maximum 3 test messages allowed per hour.',
          code: 'RATE_LIMIT_EXCEEDED',
        });
      }

      const primary = user.enrollments[0];
      const courseTitle = primary?.course?.title || 'Introduction to Web Development';
      const progress = primary?.progressPercent || 0;
      const actionUrl = primary?.courseId ? `/courses/${primary.courseId}` : '/catalog';

      const smsText = `Hi ${user.name}, you're on ${progress}% of ${courseTitle}. Continue today's lesson: https://vantage.gov.in${actionUrl}. Reply STOP to opt out.`;

      const smsRes = await SmsService.sendSms({
        toPhone: user.phone,
        message: smsText,
      });

      await prisma.notificationLog.create({
        data: {
          userId: currentUserId,
          channel: 'SMS',
          recipient: user.phone,
          message: smsText,
          provider: smsRes.provider,
          providerMessageId: smsRes.providerMessageId || null,
          status: smsRes.success ? 'SENT' : 'FAILED',
        },
      });

      return res.json({
        success: true,
        message: `Demo SMS sent successfully to ${user.phone}! (${smsRes.provider})`,
        sms: {
          phone: user.phone,
          message: smsText,
          provider: smsRes.provider,
          providerMessageId: smsRes.providerMessageId,
        },
      });
    } catch (err: any) {
      console.error('[SendSmsTest Error]:', err);
      return res.status(500).json({ message: 'Failed to execute SMS test', code: 'SERVER_ERROR' });
    }
  }

  /** POST /api/dev/run-daily-reminders */
  static async runDailyRemindersOnDemand(_req: AuthenticatedRequest, res: Response) {
    if (!DemoController.checkDemoAllowed(res)) return;
    try {
      // Run reminder job manually
      const result = await ReminderService.runDailyReminderJob(true);
      return res.json({
        message: 'Daily reminder cron job executed on demand',
        summary: result,
      });
    } catch (err: any) {
      return res.status(500).json({ message: err.message || 'Failed to run daily reminder job', code: 'SERVER_ERROR' });
    }
  }
}
