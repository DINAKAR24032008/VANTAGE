import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../services/authService';
import { AuthenticatedRequest } from '../types';
import path from 'path';
import fs from 'fs';

const AvatarSchema = z.object({
  gender: z.enum(['male', 'female', 'other']).optional(),
  avatar: z.union([z.string(), z.object({}).passthrough()]),
});

// Helper: Escape formula injection for CSV cells
const escapeCsvCell = (val: any): string => {
  if (val === null || val === undefined) return '""';
  let str = String(val);
  if (/^[=+\-@]/.test(str)) {
    str = "'" + str;
  }
  return `"${str.replace(/"/g, '""')}"`;
};

export class UserController {
  /** GET /api/users – list users for admin & trainer roster */
  static async getAllUsers(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

      const users = await prisma.user.findMany({
        include: {
          userProfile: true,
          enrollments: {
            include: { course: { select: { id: true, title: true, trainerId: true } } },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      const formatted = users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        department: u.department,
        jobRole: u.jobRole,
        avatar: u.avatar,
        phone: u.phone,
        phoneVerified: u.phoneVerified,
        createdAt: u.createdAt,
        userProfile: u.userProfile,
        enrollments: u.enrollments,
      }));

      return res.json(formatted);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  /** GET /api/users/export-csv – export users CSV for Admin with formula sanitization */
  static async exportUsersCsv(req: AuthenticatedRequest, res: Response) {
    try {
      if (req.user?.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden: Admin access required' });
      }

      const includePii = req.query.includePii === 'true';

      const users = await prisma.user.findMany({
        include: { userProfile: true },
        orderBy: { createdAt: 'desc' },
      });

      const headers = [
        'ID',
        'Full Name',
        'Role',
        'Department',
        'Profession',
        'Country',
        'City',
        'Highest Degree',
        'Company/Institution',
        'Profile Completed',
      ];

      if (includePii) {
        headers.push('Email', 'Phone', 'Date of Birth');
      }

      const rows = users.map((u) => {
        const p = u.userProfile;
        const row = [
          escapeCsvCell(u.id),
          escapeCsvCell(p?.fullName || u.name),
          escapeCsvCell(u.role),
          escapeCsvCell(u.department),
          escapeCsvCell(p?.profession || 'OTHER'),
          escapeCsvCell(p?.country || 'India'),
          escapeCsvCell(p?.city || ''),
          escapeCsvCell(p?.highestDegree || 'NONE'),
          escapeCsvCell(p?.company || p?.institution || ''),
          escapeCsvCell(p?.profileCompleted ? 'Yes' : 'No'),
        ];

        if (includePii) {
          row.push(
            escapeCsvCell(u.email),
            escapeCsvCell(u.phone || ''),
            escapeCsvCell(p?.dateOfBirth ? p.dateOfBirth.toISOString().split('T')[0] : '')
          );
        }

        return row.join(',');
      });

      const csvContent = [headers.join(','), ...rows].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=vantage-users-${Date.now()}.csv`);
      return res.send(csvContent);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  /** PUT /api/users/:id/avatar – save gender + avatar JSON */
  static async updateAvatar(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = Array.isArray(req.params.id) ? req.params.id[0] : String(req.params.id);
      if (req.user?.userId !== userId && req.user?.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const body = AvatarSchema.parse(req.body);
      const avatarStr =
        typeof body.avatar === 'string'
          ? body.avatar
          : JSON.stringify(body.avatar);

      const user = await prisma.user.update({
        where: { id: userId },
        data: {
          ...(body.gender ? { gender: body.gender } : {}),
          avatar: avatarStr,
        },
      });

      return res.json({
        id: user.id,
        gender: user.gender,
        avatar: user.avatar,
      });
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ error: err.errors[0].message });
      }
      return res.status(500).json({ error: err.message });
    }
  }

  /** POST /api/users/:id/avatar-upload – multer file → disk → URL */
  static async uploadAvatar(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = Array.isArray(req.params.id) ? req.params.id[0] : String(req.params.id);
      if (req.user?.userId !== userId && req.user?.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const file = req.file || (req.files && Array.isArray(req.files) && req.files[0]);
      if (!file) {
        return res.status(400).json({ error: 'No file uploaded or invalid file format. Only JPG, PNG, and WEBP under 2 MB are allowed.' });
      }

      const allowed = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowed.includes(file.mimetype)) {
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
        return res.status(400).json({ error: 'Only jpg, png, or webp images are allowed' });
      }
      if (file.size > 2 * 1024 * 1024) {
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
        return res.status(400).json({ error: 'File must be under 2 MB' });
      }

      const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
      const filename = `${userId}${ext}`;
      const destDir = path.resolve(process.cwd(), process.env.UPLOAD_DIR || './uploads', 'avatars');
      if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });

      const destPath = path.join(destDir, filename);
      ['jpg', 'jpeg', 'png', 'webp'].forEach((e) => {
        const p = path.join(destDir, `${userId}.${e}`);
        if (p !== destPath && fs.existsSync(p)) fs.unlinkSync(p);
      });

      if (fs.existsSync(file.path)) {
        fs.renameSync(file.path, destPath);
      }

      const url = `/uploads/avatars/${filename}`;
      return res.json({ url });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }
}
