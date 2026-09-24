import { Response } from 'express';
import { prisma } from '../services/authService';
import { AuthenticatedRequest } from '../types';

export class EnrollmentController {
  static async enroll(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { courseId } = req.body;
      if (!courseId) {
        return res.status(400).json({ error: 'courseId is required' });
      }

      const course = await prisma.course.findUnique({ where: { id: courseId } });
      if (!course) {
        return res.status(404).json({ error: 'Course not found' });
      }

      const existing = await prisma.enrollment.findUnique({
        where: {
          userId_courseId: {
            userId: req.user.userId,
            courseId,
          },
        },
      });

      if (existing) {
        return res.json({ message: 'Already enrolled in this course', enrollment: existing });
      }

      const enrollment = await prisma.enrollment.create({
        data: {
          userId: req.user.userId,
          courseId,
          status: 'in_progress',
          progressPercent: 0,
          completedModules: JSON.stringify([]),
        },
        include: {
          course: true,
        },
      });

      // Create instant ENROLLMENT notifications for learner and trainer (never fail enrollment on notification error)
      try {
        await prisma.notification.create({
          data: {
            userId: req.user.userId,
            type: 'ENROLLMENT',
            title: '🎓 Course Enrollment Confirmed',
            message: `You're enrolled in ${course.title}. Start with Module 1.`,
            courseId: course.id,
            actionUrl: `/courses/${course.id}`,
          },
        });

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
          });
        }
      } catch (notifErr) {
        console.error('[Enrollment Notification Error]:', notifErr);
      }

      return res.status(201).json({
        message: 'Successfully enrolled in course',
        enrollment: {
          ...enrollment,
          completedModules: [],
        },
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  static async getMyEnrollments(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const enrollments = await prisma.enrollment.findMany({
        where: { userId: req.user.userId },
        include: {
          course: {
            include: {
              trainer: { select: { name: true } },
              competencyTags: { include: { competency: true } },
              assessments: { select: { id: true, passThreshold: true } },
              certificates: { where: { userId: req.user.userId } },
            },
          },
        },
        orderBy: { enrolledAt: 'desc' },
      });

      const formatted = enrollments.map((e) => ({
        ...e,
        completedModules: JSON.parse(e.completedModules || '[]'),
        hasCertificate: e.course.certificates.length > 0,
        certificate: e.course.certificates[0] || null,
      }));

      return res.json(formatted);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  static async updateProgress(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const id = String(req.params.id); // enrollmentId or courseId
      const { moduleId, markCompleted = true } = req.body;

      if (!moduleId) {
        return res.status(400).json({ error: 'moduleId is required' });
      }

      // Try finding by enrollment ID or user+course
      let enrollment = await prisma.enrollment.findFirst({
        where: {
          OR: [
            { id, userId: req.user.userId },
            { courseId: id, userId: req.user.userId },
          ],
        },
        include: { course: true },
      });

      if (!enrollment) {
        return res.status(404).json({ error: 'Enrollment record not found' });
      }

      const totalModules: any[] = JSON.parse(enrollment.course.modules || '[]');
      let completedSet = new Set<string>(JSON.parse(enrollment.completedModules || '[]'));

      if (markCompleted) {
        completedSet.add(moduleId);
      } else {
        completedSet.delete(moduleId);
      }

      const completedArray = Array.from(completedSet);
      const totalCount = totalModules.length || 1;
      const progressPercent = Math.min(100, Math.round((completedArray.length / totalCount) * 100));

      const updated = await prisma.enrollment.update({
        where: { id: enrollment.id },
        data: {
          completedModules: JSON.stringify(completedArray),
          progressPercent,
          status: progressPercent === 100 ? 'completed' : 'in_progress',
        },
      });

      // Update Streak Count on UserProfile if markCompleted is true
      if (markCompleted) {
        try {
          const pref = await prisma.notificationPreference.findUnique({ where: { userId: req.user.userId } });
          const tz = pref?.timezone || 'Asia/Kolkata';

          const now = new Date();
          const todayStr = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
          const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          const yesterdayStr = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(yesterday);

          const userProfile = await prisma.userProfile.findUnique({ where: { userId: req.user.userId } });

          if (userProfile && userProfile.lastActiveDate !== todayStr) {
            let newStreak = 1;
            if (userProfile.lastActiveDate === yesterdayStr) {
              newStreak = (userProfile.streakCount || 0) + 1;
            }
            await prisma.userProfile.update({
              where: { userId: req.user.userId },
              data: {
                streakCount: newStreak,
                lastActiveDate: todayStr,
              },
            });
          }
        } catch (streakErr) {
          console.error('[Streak Update Error]:', streakErr);
        }
      }

      return res.json({
        message: 'Progress updated',
        enrollment: {
          ...updated,
          completedModules: completedArray,
        },
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }
}
