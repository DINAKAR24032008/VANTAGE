import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import competencyRoutes from './routes/competencyRoutes';
import courseRoutes from './routes/courseRoutes';
import enrollmentRoutes from './routes/enrollmentRoutes';
import assessmentRoutes from './routes/assessmentRoutes';
import forumRoutes from './routes/forumRoutes';
import userRoutes from './routes/userRoutes';
import profileRoutes from './routes/profileRoutes';
import adminRoutes from './routes/adminRoutes';
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173', '*'],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded media / certificate documents statically
const uploadDir = path.resolve(process.cwd(), process.env.UPLOAD_DIR || './uploads');
app.use('/uploads', express.static(uploadDir));

// API Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Vantage API',
    timestamp: new Date().toISOString(),
    theme: 'Course Learning Platform',
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api', competencyRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/assessments', assessmentRoutes);
app.use('/api', assessmentRoutes); // Allows /api/certificates/my and /api/certificates/verify
app.use('/api/forum', forumRoutes);
app.use('/api/users', userRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/admin', adminRoutes);

// Error Handling Middleware
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 Vantage API Server running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🎓 Platform: Course Learning & Certification`);
  console.log(`=======================================================`);
});
