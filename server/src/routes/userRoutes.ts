import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { UserController } from '../controllers/userController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Ensure temporary upload dir exists
const tmpDir = path.resolve(process.cwd(), process.env.UPLOAD_DIR || './uploads', '_tmp');
if (!fs.existsSync(tmpDir)) {
  fs.mkdirSync(tmpDir, { recursive: true });
}

const upload = multer({
  dest: tmpDir,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = ['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype);
    cb(null, ok);
  },
});

// PUT /api/users/:id/avatar
router.put('/:id/avatar', authenticateToken, UserController.updateAvatar);

// POST /api/users/:id/avatar-upload
router.post('/:id/avatar-upload', authenticateToken, upload.any(), UserController.uploadAvatar);

export default router;
