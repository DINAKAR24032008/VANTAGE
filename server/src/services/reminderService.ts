import cron from 'node-cron';
import { prisma } from './authService';
import { SmsService } from './smsService';

export interface SchedulerLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: 'PROCESSED' | 'SKIPPED' | 'CREATED' | 'ERROR';
  reason: string;
  details?: string;
}

// In-memory buffer of recent scheduler logs for live Demo Mode inspection
const schedulerLogs: SchedulerLogEntry[] = [];

export function addSchedulerLog(entry: Omit<SchedulerLogEntry, 'id' | 'timestamp'>) {
  const log: SchedulerLogEntry = {
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString(),
    ...entry,
  };
  schedulerLogs.unshift(log);
  if (schedulerLogs.length > 20) {
    schedulerLogs.pop();
  }
}

export function getSchedulerLogs(): SchedulerLogEntry[] {
  return [...schedulerLogs];
}

export function clearSchedulerLogs() {
  schedulerLogs.length = 0;
}

/** Helper: Get formatted date string YYYY-MM-DD in user's timezone */
export function getDateInTimezone(tz: string = 'Asia/Kolkata', date: Date = new Date()): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(date);
  } catch {
    return date.toISOString().split('T')[0];
  }
}

/** Helper: Get current time string HH:mm in user's timezone */
export function getTimeInTimezone(tz: string = 'Asia/Kolkata', date: Date = new Date()): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: tz,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    return formatter.format(date);
  } catch {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }
}

/** Helper: Check if current time is inside quiet hours window */
export function isInQuietHours(currentTime: string, quietStart: string = '22:00', quietEnd: string = '07:00'): boolean {
  if (quietStart === quietEnd) return false;
  if (quietStart > quietEnd) {
    // Overnight quiet hours, e.g. 22:00 to 07:00
    return currentTime >= quietStart || currentTime < quietEnd;
  } else {
    // Same-day quiet hours, e.g. 01:00 to 06:00
    return currentTime >= quietStart && currentTime < quietEnd;
  }
}

export class ReminderService {
  static getSchedulerLogs(): SchedulerLogEntry[] {
    return getSchedulerLogs();
  }

  /**
   * Main cron function: Runs for all users to evaluate and dispatch daily reminders
   */
  static async runDailyReminderJob(isManualRun: boolean = false): Promise<{
    processedCount: number;
    sentCount: number;
    skippedCount: number;
    logs: SchedulerLogEntry[];
  }> {
    let processedCount = 0;
    let sentCount = 0;
    let skippedCount = 0;

    try {
      // Find all users with notification preferences
      const preferences = await prisma.notificationPreference.findMany({
        include: {
          user: {
            include: {
              userProfile: true,
              enrollments: {
                where: { status: { not: 'completed' } },
                include: { course: true },
                orderBy: { updatedAt: 'desc' },
              },
            },
          },
        },
      });

      for (const pref of preferences) {
        processedCount++;
        const user = pref.user;
        if (!user) continue;

        const tz = pref.timezone || 'Asia/Kolkata';
        const todayStr = getDateInTimezone(tz);
        const currentTime = getTimeInTimezone(tz);

        // 1. Check if daily reminders are enabled
        if (!pref.dailyReminderEnabled) {
          skippedCount++;
          addSchedulerLog({
            userId: user.id,
            userName: user.name,
            action: 'SKIPPED',
            reason: 'skipped: reminders disabled',
          });
          continue;
        }

        // 2. Check if already sent today
        if (pref.lastReminderSentOn === todayStr && !isManualRun) {
          skippedCount++;
          addSchedulerLog({
            userId: user.id,
            userName: user.name,
            action: 'SKIPPED',
            reason: `skipped: already sent today (${todayStr})`,
          });
          continue;
        }

        // 3. Check quiet hours
        const quietStart = pref.quietHoursStart || '22:00';
        const quietEnd = pref.quietHoursEnd || '07:00';
        if (isInQuietHours(currentTime, quietStart, quietEnd) && !isManualRun) {
          skippedCount++;
          addSchedulerLog({
            userId: user.id,
            userName: user.name,
            action: 'SKIPPED',
            reason: `skipped: quiet hours until ${quietEnd}`,
          });
          continue;
        }

        // 4. Check scheduled reminder time (unless manual run)
        const scheduledTime = pref.reminderTime || '09:00';
        if (currentTime < scheduledTime && !isManualRun) {
          skippedCount++;
          addSchedulerLog({
            userId: user.id,
            userName: user.name,
            action: 'SKIPPED',
            reason: `skipped: scheduled for ${scheduledTime} (${currentTime} now)`,
          });
          continue;
        }

        // 5. Evaluate course active enrollments
        const activeEnrollments = user.enrollments;
        if (!activeEnrollments || activeEnrollments.length === 0) {
          skippedCount++;
          addSchedulerLog({
            userId: user.id,
            userName: user.name,
            action: 'SKIPPED',
            reason: 'skipped: no active course (all completed or none enrolled)',
          });
          continue;
        }

        // Construct Smart Message based on primary active course
        const primary = activeEnrollments[0];
        const course = primary.course;
        let modules: any[] = [];
        try {
          modules = JSON.parse(course.modules || '[]');
        } catch {
          modules = [];
        }

        let completedModules: string[] = [];
        try {
          completedModules = JSON.parse(primary.completedModules || '[]');
        } catch {
          completedModules = [];
        }

        const now = new Date();
        const daysInactive = Math.floor((now.getTime() - new Date(primary.updatedAt).getTime()) / (1000 * 3600 * 24));
        let messageText = '';

        if (daysInactive >= 3) {
          messageText = `We saved your place in ${course.title}. Pick up where you left off.`;
        } else if (primary.progressPercent > 0 || primary.status === 'in_progress') {
          const nextMod = modules.find((m: any) => !completedModules.includes(m.id)) || modules[0];
          const nextTitle = nextMod ? nextMod.title : 'the next lesson';
          messageText = `Keep going! Continue ${course.title} (${primary.progressPercent}% done). Next up: ${nextTitle}.`;
        } else {
          const mod1Duration = modules[0]?.durationMinutes || 15;
          messageText = `Ready to begin? Start ${course.title} today, Module 1 takes about ${mod1Duration} minutes.`;
        }

        // Multi-course mention
        if (activeEnrollments.length > 1) {
          messageText += ` (and ${activeEnrollments.length - 1} more course${activeEnrollments.length > 2 ? 's' : ''})`;
        }

        // Streak mention
        const streakCount = user.userProfile?.streakCount || 0;
        if (streakCount >= 3) {
          messageText += ` You're on a ${streakCount}-day streak. 🔥`;
        }

        // 6. Execute Atomic Prisma Transaction: Create Notification & Update lastReminderSentOn
        const actionUrl = `/courses/${course.id}`;
        await prisma.$transaction([
          prisma.notification.create({
            data: {
              userId: user.id,
              type: 'DAILY_REMINDER',
              title: '🔔 Daily Learning Reminder',
              message: messageText,
              courseId: course.id,
              actionUrl,
            },
          }),
          prisma.notificationPreference.update({
            where: { userId: user.id },
            data: { lastReminderSentOn: todayStr },
          }),
        ]);

        sentCount++;
        addSchedulerLog({
          userId: user.id,
          userName: user.name,
          action: 'CREATED',
          reason: `created: 🔔 Daily Learning Reminder - ${messageText}`,
        });

        // 7. Deliver SMS if enabled and phone verified
        if (pref.smsEnabled && user.phoneVerified && user.phone) {
          // Duplicate protection: Check NotificationLog for SMS sent today in user's timezone
          const startOfToday = new Date(`${todayStr}T00:00:00.000Z`);
          const existingSmsToday = await prisma.notificationLog.findFirst({
            where: {
              userId: user.id,
              channel: 'SMS',
              status: 'SENT',
              sentAt: { gte: startOfToday },
            },
          });

          if (existingSmsToday && !isManualRun) {
            addSchedulerLog({
              userId: user.id,
              userName: user.name,
              action: 'SKIPPED',
              reason: `SMS skipped: already sent today (${todayStr})`,
            });
          } else if (isInQuietHours(currentTime, quietStart, quietEnd) && !isManualRun) {
            // Quiet Hours: Queue SMS, do not send now
            await prisma.notificationLog.create({
              data: {
                userId: user.id,
                channel: 'SMS',
                recipient: user.phone,
                message: `Hi ${user.name}, you're on ${primary.progressPercent}% of ${course.title}. Continue today's lesson: https://vantage.gov.in${actionUrl}. Reply STOP to opt out.`,
                provider: process.env.SMS_PROVIDER || 'CONSOLE',
                status: 'QUEUED',
              },
            });
            addSchedulerLog({
              userId: user.id,
              userName: user.name,
              action: 'SKIPPED',
              reason: `SMS queued for after quiet hours (${quietEnd})`,
            });
          } else {
            const smsBody = `Hi ${user.name}, you're on ${primary.progressPercent}% of ${course.title}. Continue today's lesson: https://vantage.gov.in${actionUrl}. Reply STOP to opt out.`;
            const smsRes = await SmsService.sendSms({
              toPhone: user.phone,
              message: smsBody,
            });

            await prisma.notificationLog.create({
              data: {
                userId: user.id,
                channel: 'SMS',
                recipient: user.phone,
                message: smsBody,
                provider: smsRes.provider,
                providerMessageId: smsRes.providerMessageId || null,
                status: smsRes.success ? 'SENT' : 'FAILED',
              },
            });
          }
        }
      }
    } catch (err: any) {
      console.error('[ReminderService Error]:', err);
    }

    return {
      processedCount,
      sentCount,
      skippedCount,
      logs: getSchedulerLogs(),
    };
  }

  /**
   * Send instant test reminder for current user (ignoring quiet hours & today limit)
   */
  static async sendTestReminderNow(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        userProfile: true,
        enrollments: {
          include: { course: true },
          orderBy: { updatedAt: 'desc' },
        },
      },
    });

    if (!user) throw new Error('User not found');

    const activeEnrollments = user.enrollments.filter((e) => e.status !== 'completed');
    let messageText = '';
    let courseId: string | null = null;

    if (activeEnrollments.length > 0) {
      const primary = activeEnrollments[0];
      courseId = primary.courseId;
      let modules: any[] = [];
      try {
        modules = JSON.parse(primary.course.modules || '[]');
      } catch {
        modules = [];
      }
      let completedModules: string[] = [];
      try {
        completedModules = JSON.parse(primary.completedModules || '[]');
      } catch {
        completedModules = [];
      }

      if (primary.progressPercent > 0) {
        const nextMod = modules.find((m: any) => !completedModules.includes(m.id)) || modules[0];
        messageText = `Keep going! Continue ${primary.course.title} (${primary.progressPercent}% done). Next up: ${nextMod?.title || 'Next Lesson'}.`;
      } else {
        const duration = modules[0]?.durationMinutes || 15;
        messageText = `Ready to begin? Start ${primary.course.title} today, Module 1 takes about ${duration} minutes.`;
      }

      if (activeEnrollments.length > 1) {
        messageText += ` (and ${activeEnrollments.length - 1} more courses)`;
      }
    } else {
      messageText = `Explore top-rated courses on Vantage catalog and start your digital learning journey!`;
    }

    const streakCount = user.userProfile?.streakCount || 0;
    if (streakCount >= 3) {
      messageText += ` You're on a ${streakCount}-day streak. 🔥`;
    }

    const actionUrl = courseId ? `/courses/${courseId}` : '/catalog';

    const notif = await prisma.notification.create({
      data: {
        userId,
        type: 'DAILY_REMINDER',
        title: '🔔 Daily Learning Reminder (Demo Test)',
        message: messageText,
        courseId,
        actionUrl,
      },
    });

    addSchedulerLog({
      userId,
      userName: user.name,
      action: 'CREATED',
      reason: `created: 🔔 Test Reminder Now - ${messageText}`,
    });

    return notif;
  }

  /**
   * Delete notifications older than 60 days
   */
  static async deleteOldNotifications() {
    try {
      const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
      const res = await prisma.notification.deleteMany({
        where: { createdAt: { lt: sixtyDaysAgo } },
      });
      console.log(`[Notification Cleanup] Deleted ${res.count} notifications older than 60 days.`);
    } catch (err) {
      console.error('[Notification Cleanup Error]:', err);
    }
  }

  /**
   * Initialize cron jobs
   */
  static initScheduler() {
    const isCronEnabled = process.env.REMINDER_CRON_ENABLED === 'true' || process.env.DEMO_MODE === 'true';

    if (isCronEnabled) {
      console.log('⏰ [ReminderScheduler] Initializing node-cron scheduler (running every minute)...');
      cron.schedule('* * * * *', async () => {
        await ReminderService.runDailyReminderJob(false);
      });
    } else {
      console.log('ℹ️ [ReminderScheduler] REMINDER_CRON_ENABLED is false. Node-cron automatic background ticks disabled.');
    }

    // Daily 60-day cleanup job at midnight
    cron.schedule('0 0 * * *', async () => {
      await ReminderService.deleteOldNotifications();
    });
  }
}
