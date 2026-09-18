import multer from 'multer';
import path from 'path';
import fs from 'fs';

const UPLOAD_DIR = path.resolve(process.cwd(), process.env.UPLOAD_DIR || './uploads');

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Local Disk Storage Engine (S3-compatible interface)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

export const uploadMiddleware = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    const allowedExtensions = ['.pdf', '.mp4', '.webm', '.jpg', '.jpeg', '.png', '.doc', '.docx', '.ppt', '.pptx'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${ext} not allowed. Supported: PDF, MP4, WebM, Images, Office Docs`));
    }
  },
});

export interface StorageProvider {
  uploadFile(file: Express.Multer.File): Promise<string>;
  getPublicUrl(filename: string): string;
}

export class LocalStorageService implements StorageProvider {
  async uploadFile(file: Express.Multer.File): Promise<string> {
    return `/uploads/${file.filename}`;
  }

  getPublicUrl(filename: string): string {
    return `/uploads/${filename}`;
  }
}

export const storageService = new LocalStorageService();
