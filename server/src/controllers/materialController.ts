import { Response } from 'express';
import path from 'path';
import fs from 'fs';
import { prisma } from '../services/authService';
import { AuthenticatedRequest } from '../types';

export class MaterialController {
  /**
   * GET /api/courses/:courseId/materials
   * List all study materials for a course
   */
  static async getCourseMaterials(req: AuthenticatedRequest, res: Response) {
    try {
      const courseId = String(req.params.courseId);

      const course = await prisma.course.findUnique({ where: { id: courseId } });
      if (!course) {
        return res.status(404).json({ error: 'Course not found' });
      }

      const materials = await prisma.courseMaterial.findMany({
        where: { courseId },
        orderBy: { uploadedAt: 'asc' },
        select: {
          id: true,
          courseId: true,
          title: true,
          fileName: true,
          fileSize: true,
          mimeType: true,
          uploadedAt: true,
        },
      });

      return res.json(materials);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  /**
   * POST /api/courses/:courseId/materials
   * Upload a new PDF study material for a course
   */
  static async uploadMaterial(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'trainer')) {
        return res.status(403).json({ error: 'Forbidden: Only instructors and administrators can upload study materials.' });
      }

      const courseId = String(req.params.courseId);
      const course = await prisma.course.findUnique({ where: { id: courseId } });
      if (!course) {
        return res.status(404).json({ error: 'Course not found' });
      }

      // Check trainer ownership
      if (req.user.role !== 'admin' && course.trainerId !== req.user.userId) {
        return res.status(403).json({
          error: 'Forbidden: You are not authorized to upload materials for this course. Only the authoring instructor can manage materials.',
        });
      }

      if (!req.file) {
        return res.status(400).json({ error: 'PDF file is required.' });
      }

      const rawTitle = req.body.title ? String(req.body.title).trim() : '';
      const fallbackTitle = path.basename(req.file.originalname, path.extname(req.file.originalname))
        .replace(/[_-]+/g, ' ');
      const title = rawTitle || fallbackTitle;

      const material = await prisma.courseMaterial.create({
        data: {
          courseId,
          title,
          fileName: req.file.originalname,
          filePath: req.file.path,
          fileSize: req.file.size,
          mimeType: 'application/pdf',
        },
      });

      return res.status(201).json({
        message: 'Study material uploaded successfully',
        material: {
          id: material.id,
          courseId: material.courseId,
          title: material.title,
          fileName: material.fileName,
          fileSize: material.fileSize,
          mimeType: material.mimeType,
          uploadedAt: material.uploadedAt,
        },
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  /**
   * DELETE /api/courses/:courseId/materials/:materialId
   * Remove a study material
   */
  static async deleteMaterial(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'trainer')) {
        return res.status(403).json({ error: 'Forbidden: Only instructors and administrators can delete study materials.' });
      }

      const courseId = String(req.params.courseId);
      const materialId = String(req.params.materialId);

      const course = await prisma.course.findUnique({ where: { id: courseId } });
      if (!course) {
        return res.status(404).json({ error: 'Course not found' });
      }

      // Check trainer ownership
      if (req.user.role !== 'admin' && course.trainerId !== req.user.userId) {
        return res.status(403).json({
          error: 'Forbidden: You are not authorized to remove materials from this course.',
        });
      }

      const material = await prisma.courseMaterial.findFirst({
        where: { id: materialId, courseId },
      });

      if (!material) {
        return res.status(404).json({ error: 'Study material not found' });
      }

      // Delete file from disk if present
      try {
        if (fs.existsSync(material.filePath)) {
          fs.unlinkSync(material.filePath);
        }
      } catch (fileErr) {
        console.warn(`Could not delete file from disk: ${material.filePath}`, fileErr);
      }

      await prisma.courseMaterial.delete({ where: { id: material.id } });

      return res.json({ message: 'Study material deleted successfully' });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  /**
   * GET /api/courses/:courseId/materials/:materialId/download (or /view)
   * Securely serve PDF material to enrolled learners, authoring trainer, or admin
   */
  static async accessMaterial(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const courseId = String(req.params.courseId);
      const materialId = String(req.params.materialId);
      const isInlineView = req.query.view === 'true' || req.path.endsWith('/view');

      const course = await prisma.course.findUnique({ where: { id: courseId } });
      if (!course) {
        return res.status(404).json({ error: 'Course not found' });
      }

      const material = await prisma.courseMaterial.findFirst({
        where: { id: materialId, courseId },
      });

      if (!material) {
        return res.status(404).json({ error: 'Study material not found' });
      }

      // Access Authorization Check:
      // Admin: allowed
      // Trainer author: allowed
      // Learner: must be enrolled in this course
      const isAdmin = req.user.role === 'admin';
      const isCourseTrainer = req.user.role === 'trainer' && course.trainerId === req.user.userId;

      let isEnrolled = false;
      if (!isAdmin && !isCourseTrainer) {
        const enrollment = await prisma.enrollment.findUnique({
          where: {
            userId_courseId: {
              userId: req.user.userId,
              courseId,
            },
          },
        });
        if (enrollment) {
          isEnrolled = true;
        }
      }

      if (!isAdmin && !isCourseTrainer && !isEnrolled) {
        return res.status(403).json({
          error: 'Forbidden: You must be enrolled in this course to view or download study materials.',
        });
      }

      const absoluteFilePath = path.resolve(material.filePath);
      if (!fs.existsSync(absoluteFilePath)) {
        return res.status(404).json({ error: 'Study material file missing from server storage.' });
      }

      const encodedFileName = encodeURIComponent(material.fileName);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `${isInlineView ? 'inline' : 'attachment'}; filename="${encodedFileName}"; filename*=UTF-8''${encodedFileName}`
      );

      return res.sendFile(absoluteFilePath);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }
}
