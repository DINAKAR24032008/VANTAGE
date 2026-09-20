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

export class UserController {
  /** PUT /api/users/:id/avatar – save gender + avatar JSON */
  static async updateAvatar(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = Array.isArray(req.params.id) ? req.params.id[0] : String(req.params.id);
      // Only the owner can update their avatar
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
      // Remove old avatar file for this user if different extension
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
