import { Request, Response } from 'express';
import { prisma } from '../services/authService';
import { AuthenticatedRequest } from '../types';

export class CourseController {
  static async getAllCourses(req: Request, res: Response) {
    try {
      const { category, difficulty, search } = req.query;

      const courses = await prisma.course.findMany({
        where: {
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
          assessment: {
            select: {
              id: true,
              passThreshold: true,
              // Exclude correct answers from questions for student view
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

      return res.json({
        ...course,
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
        return res.status(403).json({ error: 'Only trainers or admins can create courses' });
      }

      const {
        title,
        description,
        difficultyLevel = 'Beginner',
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

      if (req.user?.role !== 'admin' && course.trainerId !== req.user?.userId) {
        return res.status(403).json({ error: 'You are not authorized to update this course' });
      }

      const {
        title,
        description,
        difficultyLevel,
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
