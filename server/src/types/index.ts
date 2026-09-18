import { Request } from 'express';

export type UserRole = 'admin' | 'trainer' | 'learner';

export interface AuthUserPayload {
  userId: string;
  email: string;
  role: UserRole;
  name: string;
  department: string;
  jobRole: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUserPayload;
}

export interface SkillRating {
  competencyId: string;
  competencyName: string;
  currentLevel: number; // 1 to 5
}

export interface RoleCompetencyRequirementItem {
  competencyId: string;
  competencyName: string;
  requiredLevel: number; // 1 to 5
  weight: number; // e.g. 1.0, 1.5
}

export interface CourseModule {
  id: string;
  title: string;
  durationMinutes: number;
  videoUrl?: string;
  contentMarkdown?: string;
  order: number;
}

export interface AssessmentQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
}

export interface GapAnalysisItem {
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

export interface GapAnalysisResult {
  learnerId: string;
  learnerName: string;
  jobRole: string;
  department: string;
  overallGapScore: number; // percentage of gap remaining (0 to 100)
  readinessPercentage: number; // 100 - overallGapScore
  competencyBreakdown: GapAnalysisItem[];
  recommendedCourses: CourseRecommendation[];
}
