import { Response } from 'express';
import { prisma } from '../services/authService';
import { AuthenticatedRequest } from '../types';

export class AdminController {
  /**
   * GET /api/admin/learners-progress
   * Aggregates progress across ALL learners and ALL courses in one place.
   * Strictly restricted to Admin role.
   */
  static async getAggregatedProgress(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden: Admin access required.' });
      }

      // 1. Fetch all enrollments with learner, course, and trainer data
      const enrollments = await prisma.enrollment.findMany({
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              department: true,
              jobRole: true,
              avatar: true,
              gender: true,
              createdAt: true,
            },
          },
          course: {
            include: {
              trainer: { select: { id: true, name: true, email: true } },
              certificates: true,
            },
          },
        },
        orderBy: { enrolledAt: 'desc' },
      });

      // 2. Fetch all assessment attempts to calculate quiz metrics
      const attempts = await prisma.assessmentAttempt.findMany({
        include: {
          assessment: { select: { courseId: true, moduleId: true, passThreshold: true } },
        },
        orderBy: { attemptedAt: 'desc' },
      });

      // 3. Fetch all certificates
      const certificates = await prisma.certificate.findMany({
        select: {
          id: true,
          certificateNumber: true,
          userId: true,
          courseId: true,
          issuedAt: true,
          verificationHash: true,
          certificateUrl: true,
        },
      });

      // 4. Map each enrollment to comprehensive learner progress item
      const progressRecords = enrollments.map((enr) => {
        let completedMods: string[] = [];
        try {
          completedMods = JSON.parse(enr.completedModules || '[]');
        } catch (e) {
          completedMods = [];
        }

        let totalModulesCount = 0;
        try {
          const mods = JSON.parse(enr.course.modules || '[]');
          totalModulesCount = Array.isArray(mods) ? mods.length : 0;
        } catch (e) {
          totalModulesCount = 0;
        }

        // Filter user attempts for this specific course
        const userCourseAttempts = attempts.filter(
          (a) => a.userId === enr.userId && a.assessment.courseId === enr.courseId
        );

        const quizAttemptsCount = userCourseAttempts.length;
        const passedQuizzesCount = userCourseAttempts.filter((a) => a.passed).length;
        const highestQuizScore =
          userCourseAttempts.length > 0
            ? Math.max(...userCourseAttempts.map((a) => a.score))
            : null;
        const averageQuizScore =
          userCourseAttempts.length > 0
            ? Math.round(userCourseAttempts.reduce((sum, a) => sum + a.score, 0) / userCourseAttempts.length)
            : null;

        // Check if certificate issued
        const cert = certificates.find(
          (c) => c.userId === enr.userId && c.courseId === enr.courseId
        ) || null;

        return {
          id: enr.id,
          userId: enr.userId,
          learnerName: enr.user.name,
          learnerEmail: enr.user.email,
          learnerDepartment: enr.user.department,
          learnerJobRole: enr.user.jobRole,
          learnerAvatar: enr.user.avatar,
          courseId: enr.courseId,
          courseTitle: enr.course.title,
          courseDifficulty: enr.course.difficultyLevel,
          courseStatus: enr.course.status,
          trainerId: enr.course.trainerId,
          trainerName: enr.course.trainer.name,
          trainerEmail: enr.course.trainer.email,
          enrollmentStatus: enr.status,
          progressPercent: enr.progressPercent,
          completedModulesCount: completedMods.length,
          totalModulesCount,
          enrolledAt: enr.enrolledAt,
          updatedAt: enr.updatedAt,
          completedAt: enr.completedAt,
          quizAttemptsCount,
          passedQuizzesCount,
          highestQuizScore,
          averageQuizScore,
          certificate: cert,
        };
      });

      // 5. Calculate platform-wide overview metrics
      const totalEnrollments = enrollments.length;
      const completedEnrollments = enrollments.filter((e) => e.status === 'completed').length;
      const inProgressEnrollments = enrollments.filter((e) => e.status === 'in_progress').length;
      const totalCertificates = certificates.length;

      const uniqueLearnerIds = new Set(enrollments.map((e) => e.userId));
      const totalUniqueLearners = uniqueLearnerIds.size;

      const allCourses = await prisma.course.findMany({
        select: { id: true, title: true, status: true, difficultyLevel: true },
      });

      const averageProgress =
        totalEnrollments > 0
          ? Math.round(enrollments.reduce((sum, e) => sum + e.progressPercent, 0) / totalEnrollments)
          : 0;

      return res.json({
        summary: {
          totalEnrollments,
          completedEnrollments,
          inProgressEnrollments,
          totalCertificates,
          totalUniqueLearners,
          totalCourses: allCourses.length,
          averageProgress,
        },
        courses: allCourses,
        progress: progressRecords,
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }
}
