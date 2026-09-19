import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../services/authService';
import { AuthenticatedRequest, AuthUserPayload } from '../types';

const JWT_SECRET = process.env.JWT_SECRET || 'vantage-secret-key-2026';

function tryGetAuthUser(req: Request): AuthUserPayload | null {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  const token = authHeader.split(' ')[1];
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET) as AuthUserPayload;
  } catch (e) {
    return null;
  }
}

export class CourseController {
  static async getAllCourses(req: Request, res: Response) {
    try {
      const { category, difficulty, search, trainerId, myCourses } = req.query;
      const authUser = tryGetAuthUser(req);

      // Determine visibility filter:
      // If a trainer requests their own courses or specifies trainerId that matches their own ID, show drafts + published.
      // Otherwise, only show 'published' courses (unless logged in as admin).
      let statusFilter: any = 'published';

      if (authUser) {
        if (authUser.role === 'admin') {
          // Admin can see everything
          statusFilter = undefined;
        } else if (authUser.role === 'trainer' && (myCourses === 'true' || trainerId === authUser.userId)) {
          // Trainer looking at their own courses
          statusFilter = undefined;
        }
      }

      const courses = await prisma.course.findMany({
        where: {
          ...(statusFilter ? { status: statusFilter } : {}),
          ...(trainerId ? { trainerId: String(trainerId) } : {}),
          ...(difficulty ? { difficultyLevel: String(difficulty) } : {}),
          ...(search
            ? {
                OR: [
                  { title: { contains: String(search) } },
                  { description: { contains: String(search) } },
                ],
              }
            : {}),
        },
        include: {
          trainer: {
            select: { id: true, name: true, email: true, department: true },
          },
          competencyTags: {
            include: {
              competency: true,
            },
          },
          _count: {
            select: { enrollments: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      // Filter by competency category if specified
      const filtered = category
        ? courses.filter((c) =>
            c.competencyTags.some(
              (tag) => tag.competency.category.toLowerCase() === String(category).toLowerCase()
            )
          )
        : courses;

      const formatted = filtered.map((c) => ({
        ...c,
        modules: JSON.parse(c.modules || '[]'),
        enrollmentCount: c._count.enrollments,
      }));

      return res.json(formatted);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  static async getCourseById(req: AuthenticatedRequest, res: Response) {
    try {
      const id = String(req.params.id);

      const course = await prisma.course.findUnique({
        where: { id },
        include: {
          trainer: {
            select: { id: true, name: true, email: true, department: true },
          },
          competencyTags: {
            include: {
              competency: true,
            },
          },
          assessments: {
            select: {
              id: true,
              moduleId: true,
              passThreshold: true,
            },
          },
          _count: {
            select: { enrollments: true },
          },
        },
      });

      if (!course) {
        return res.status(404).json({ error: 'Course not found' });
      }

      // Check draft access
      if (course.status === 'draft') {
        const canViewDraft = req.user?.role === 'admin' || course.trainerId === req.user?.userId;
        if (!canViewDraft) {
          return res.status(403).json({ error: 'This course is currently in draft mode and not published.' });
        }
      }

      // Check if current user is enrolled
      let userEnrollment = null;
      if (req.user) {
        userEnrollment = await prisma.enrollment.findUnique({
          where: {
            userId_courseId: {
              userId: req.user.userId,
              courseId: id,
            },
          },
        });
      }

      const primaryAssessment =
        course.assessments.find((a) => !a.moduleId) || course.assessments[0] || null;

      return res.json({
        ...course,
        assessment: primaryAssessment,
        assessments: course.assessments,
        modules: JSON.parse(course.modules || '[]'),
        enrollmentCount: (course as any)._count?.enrollments || 0,
        userEnrollment: userEnrollment
          ? {
              ...userEnrollment,
              completedModules: JSON.parse(userEnrollment.completedModules || '[]'),
            }
          : null,
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  static async createCourse(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user || (req.user.role !== 'trainer' && req.user.role !== 'admin')) {
        return res.status(403).json({ error: 'Only instructors or admins can create courses' });
      }

      const {
        title,
        description,
        difficultyLevel = 'Beginner',
        status = 'draft',
        contentUrl,
        thumbnailUrl,
        modules = [],
        competencyTags = [], // [{ competencyId, targetLevel }]
      } = req.body;

      if (!title || !description) {
        return res.status(400).json({ error: 'Title and description are required' });
      }

      const course = await prisma.course.create({
        data: {
          title,
          description,
          difficultyLevel,
          status: status === 'published' ? 'published' : 'draft',
          contentUrl,
          thumbnailUrl,
          modules: JSON.stringify(modules),
          trainerId: req.user.userId,
          competencyTags: {
            create: competencyTags.map((tag: any) => ({
              competencyId: tag.competencyId,
              targetLevel: tag.targetLevel || 1,
            })),
          },
        },
        include: {
          competencyTags: {
            include: { competency: true },
          },
          trainer: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      return res.status(201).json({
        ...course,
        modules: JSON.parse(course.modules),
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  static async updateCourse(req: AuthenticatedRequest, res: Response) {
    try {
      const id = String(req.params.id);
      const course = await prisma.course.findUnique({ where: { id } });

      if (!course) {
        return res.status(404).json({ error: 'Course not found' });
      }

      // Restrict edit access: only authoring trainer or admin
      if (req.user?.role !== 'admin' && course.trainerId !== req.user?.userId) {
        return res.status(403).json({ error: 'You are not authorized to update this course. Only the authoring instructor can make changes.' });
      }

      const {
        title,
        description,
        difficultyLevel,
        status,
        contentUrl,
        thumbnailUrl,
        modules,
        competencyTags,
      } = req.body;

      // Update basic fields
      const updated = await prisma.course.update({
        where: { id },
        data: {
          ...(title ? { title } : {}),
          ...(description ? { description } : {}),
          ...(difficultyLevel ? { difficultyLevel } : {}),
          ...(status ? { status } : {}),
          ...(contentUrl !== undefined ? { contentUrl } : {}),
          ...(thumbnailUrl !== undefined ? { thumbnailUrl } : {}),
          ...(modules ? { modules: JSON.stringify(modules) } : {}),
        },
      });

      // Update tags if provided
      if (Array.isArray(competencyTags)) {
        await prisma.courseCompetencyTag.deleteMany({ where: { courseId: id } });
        for (const tag of competencyTags) {
          await prisma.courseCompetencyTag.create({
            data: {
              courseId: id,
              competencyId: tag.competencyId,
              targetLevel: tag.targetLevel || 1,
            },
          });
        }
      }

      return res.json({
        message: 'Course updated successfully',
        course: {
          ...updated,
          modules: JSON.parse(updated.modules),
        },
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  static async updateCourseStatus(req: AuthenticatedRequest, res: Response) {
    try {
      const id = String(req.params.id);
      const { status } = req.body;

      if (status !== 'draft' && status !== 'published') {
        return res.status(400).json({ error: 'Status must be either draft or published' });
      }

      const course = await prisma.course.findUnique({ where: { id } });
      if (!course) return res.status(404).json({ error: 'Course not found' });

      if (req.user?.role !== 'admin' && course.trainerId !== req.user?.userId) {
        return res.status(403).json({ error: 'You are not authorized to change the status of this course' });
      }

      const updated = await prisma.course.update({
        where: { id },
        data: { status },
      });

      return res.json({
        message: `Course status updated to ${status}`,
        course: {
          ...updated,
          modules: JSON.parse(updated.modules),
        },
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  static async deleteCourse(req: AuthenticatedRequest, res: Response) {
    try {
      const id = String(req.params.id);
      const course = await prisma.course.findUnique({ where: { id } });

      if (!course) {
        return res.status(404).json({ error: 'Course not found' });
      }

      if (req.user?.role !== 'admin' && course.trainerId !== req.user?.userId) {
        return res.status(403).json({ error: 'You are not authorized to delete this course' });
      }

      await prisma.course.delete({ where: { id } });
      return res.json({ message: 'Course deleted successfully' });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  static async getCourseLearners(req: AuthenticatedRequest, res: Response) {
    try {
      const courseId = String(req.params.id);
      const course = await prisma.course.findUnique({ where: { id: courseId } });
      if (!course) return res.status(404).json({ error: 'Course not found' });

      if (req.user?.role !== 'admin' && course.trainerId !== req.user?.userId) {
        return res.status(403).json({ error: 'You are not authorized to view learners for this course' });
      }

      const courseModules = JSON.parse(course.modules || '[]');
      const totalModulesCount = courseModules.length;

      const enrollments = await prisma.enrollment.findMany({
        where: { courseId },
        include: {
          user: { select: { id: true, name: true, email: true, department: true, jobRole: true } },
        },
        orderBy: { enrolledAt: 'desc' },
      });

      const assessments = await prisma.assessment.findMany({
        where: { courseId },
        select: { id: true, moduleId: true },
      });
      const assessmentIds = assessments.map((a) => a.id);

      const attempts = await prisma.assessmentAttempt.findMany({
        where: { assessmentId: { in: assessmentIds } },
        orderBy: { attemptedAt: 'desc' },
      });

      const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
      const now = Date.now();

      const learners = enrollments.map((enr) => {
        let completedMods: string[] = [];
        try {
          completedMods = JSON.parse(enr.completedModules || '[]');
        } catch (e) {
          completedMods = [];
        }

        const userAttempts = attempts.filter((a) => a.userId === enr.userId);
        const latestQuizScore = userAttempts.length > 0 ? userAttempts[0].score : null;
        const passedQuizzesCount = userAttempts.filter((a) => a.passed).length;

        // Calculate latest activity
        let lastActiveTime = new Date(enr.updatedAt).getTime();
        if (userAttempts.length > 0) {
          const attemptTime = new Date(userAttempts[0].attemptedAt).getTime();
          if (attemptTime > lastActiveTime) lastActiveTime = attemptTime;
        }

        const isStuck = enr.status !== 'completed' && now - lastActiveTime > SEVEN_DAYS_MS;

        return {
          id: enr.id,
          userId: enr.userId,
          name: enr.user.name,
          email: enr.user.email,
          progressPercent: enr.progressPercent,
          completedModulesCount: completedMods.length,
          totalModulesCount,
          status: enr.status,
          enrolledAt: enr.enrolledAt,
          lastActiveAt: new Date(lastActiveTime).toISOString(),
          latestQuizScore,
          passedQuizzesCount,
          isStuck,
        };
      });

      return res.json({
        courseId,
        courseTitle: course.title,
        totalModulesCount,
        totalEnrolled: learners.length,
        learners,
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  static async exportCourseLearnersCSV(req: AuthenticatedRequest, res: Response) {
    try {
      const courseId = String(req.params.id);
      const course = await prisma.course.findUnique({ where: { id: courseId } });
      if (!course) return res.status(404).json({ error: 'Course not found' });

      if (req.user?.role !== 'admin' && course.trainerId !== req.user?.userId) {
        return res.status(403).json({ error: 'You are not authorized to export learners for this course' });
      }

      const courseModules = JSON.parse(course.modules || '[]');
      const totalModulesCount = courseModules.length;

      const enrollments = await prisma.enrollment.findMany({
        where: { courseId },
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { enrolledAt: 'desc' },
      });

      const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
      const now = Date.now();

      const headers = [
        'Learner Name',
        'Email',
        'Status',
        'Progress %',
        'Completed Modules',
        'Total Modules',
        'Enrolled Date',
        'Last Active',
        'Stuck (>7d Inactive)',
      ];

      const rows = enrollments.map((enr) => {
        let completedMods: string[] = [];
        try {
          completedMods = JSON.parse(enr.completedModules || '[]');
        } catch (e) {
          completedMods = [];
        }

        const isStuck = enr.status !== 'completed' && now - new Date(enr.updatedAt).getTime() > SEVEN_DAYS_MS;

        return [
          `"${enr.user.name.replace(/"/g, '""')}"`,
          `"${enr.user.email.replace(/"/g, '""')}"`,
          enr.status,
          `${enr.progressPercent}%`,
          completedMods.length,
          totalModulesCount,
          new Date(enr.enrolledAt).toISOString().split('T')[0],
          new Date(enr.updatedAt).toISOString().split('T')[0],
          isStuck ? 'YES' : 'NO',
        ].join(',');
      });

      const csvContent = [headers.join(','), ...rows].join('\n');
      const safeTitle = course.title.replace(/[^a-zA-Z0-9_-]/g, '_');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="learners_${safeTitle}.csv"`);
      return res.send(csvContent);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  static async uploadMedia(req: Request, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const fileUrl = `/uploads/${req.file.filename}`;
      return res.json({
        message: 'File uploaded successfully',
        url: fileUrl,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimeType: req.file.mimetype,
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }
}
