export type UserRole = 'admin' | 'trainer' | 'learner';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  jobRole: string;
  profile?: {
    id: string;
    skills: string;
    updatedAt: string;
  };
  certificates?: Certificate[];
}

export interface Competency {
  id: string;
  name: string;
  category: string;
  description: string;
}

export interface SkillRating {
  competencyId: string;
  competencyName: string;
  currentLevel: number;
}

export interface GapItem {
  competencyId: string;
  competencyName: string;
  currentLevel: number;
  requiredLevel: number;
  gap: number;
  weight: number;
}

export interface CourseRecommendation {
  courseId: string;
  title: string;
  description: string;
  difficultyLevel: string;
  thumbnailUrl?: string | null;
  targetCompetencies: string[];
  relevanceScore: number;
  enrolled: boolean;
  enrollmentStatus?: string;
}

export interface GapAnalysisResponse {
  learnerId: string;
  learnerName: string;
  jobRole: string;
  department: string;
  overallGapScore: number;
  readinessPercentage: number;
  competencyBreakdown: GapItem[];
  recommendedCourses: CourseRecommendation[];
}

export interface CourseModule {
  id: string;
  title: string;
  durationMinutes: number;
  videoUrl?: string;
  contentMarkdown?: string;
  order: number;
}

export interface CourseCompetencyTag {
  id: string;
  courseId: string;
  competencyId: string;
  targetLevel: number;
  competency: Competency;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  trainerId: string;
  trainer?: {
    id: string;
    name: string;
    email: string;
    department?: string;
  };
  contentUrl?: string | null;
  thumbnailUrl?: string | null;
  modules: CourseModule[];
  difficultyLevel: string;
  createdAt: string;
  competencyTags: CourseCompetencyTag[];
  enrollmentCount?: number;
  userEnrollment?: {
    id: string;
    status: string;
    progressPercent: number;
    completedModules: string[];
  } | null;
  assessment?: {
    id: string;
    passThreshold: number;
  } | null;
}

export interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  status: 'not_started' | 'in_progress' | 'completed';
  progressPercent: number;
  completedModules: string[];
  enrolledAt: string;
  completedAt?: string | null;
  course: Course;
  hasCertificate?: boolean;
  certificate?: Certificate | null;
}

export interface AssessmentQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex?: number;
  explanation?: string;
}

export interface AssessmentAttemptResult {
  message: string;
  score: number;
  passThreshold: number;
  passed: boolean;
  totalQuestions: number;
  correctAnswers: number;
  gradedQuestions: {
    id: string;
    question: string;
    options: string[];
    userAnswer: number;
    correctIndex: number;
    isCorrect: boolean;
    explanation?: string;
  }[];
  profileUpdated: boolean;
  certificate?: Certificate | null;
}

export interface Certificate {
  id: string;
  userId: string;
  courseId: string;
  certificateNumber: string;
  issuedAt: string;
  certificateUrl?: string;
  verificationHash: string;
  user?: {
    name: string;
    department: string;
    jobRole: string;
  };
  course?: {
    title: string;
    difficultyLevel: string;
  };
}

export interface ForumPost {
  id: string;
  courseId?: string | null;
  authorId: string;
  title?: string | null;
  body: string;
  createdAt: string;
  author: {
    id: string;
    name: string;
    role: string;
    department: string;
  };
  course?: {
    id: string;
    title: string;
  } | null;
  replies?: ForumPost[];
}
