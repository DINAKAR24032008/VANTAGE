export type UserRole = 'admin' | 'trainer' | 'learner';

export interface AvatarData {
  type: 'preset' | 'upload' | 'initials';
  presetId?: string;
  url?: string;
  bgColor?: string;
}

export interface UserProfileData {
  id?: string;
  userId?: string;
  fullName: string;
  dateOfBirth?: string | null;
  country: string;
  state?: string | null;
  city: string;
  profession: 'STUDENT' | 'WORKING_PROFESSIONAL' | 'FREELANCER' | 'JOB_SEEKER' | 'ENTREPRENEUR' | 'OTHER';
  highestDegree: 'HIGH_SCHOOL' | 'DIPLOMA' | 'BACHELORS' | 'MASTERS' | 'DOCTORATE' | 'OTHER' | 'NONE';
  fieldOfStudy?: string | null;
  institution?: string | null;
  graduationYear?: number | null;
  company?: string | null;
  jobTitle?: string | null;
  yearsOfExperience?: string | null;
  bio?: string | null;
  linkedinUrl?: string | null;
  showcaseVisible: boolean;
  linkedinVisible: boolean;
  locationVisible: boolean;
  educationVisible: boolean;
  profileCompleted: boolean;
  profileCompletedAt?: string | null;
}

export interface UserSkillData {
  id?: string;
  name: string;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  source: 'SELF' | 'VANTAGE';
  hidden?: boolean;
}

export interface AchievementData {
  id?: string;
  title: string;
  organization: string;
  type: 'AWARD' | 'PROJECT' | 'PUBLICATION' | 'HACKATHON' | 'CERTIFICATION' | 'OTHER';
  description?: string | null;
  date?: string | null;
  link?: string | null;
}

export interface ExperienceData {
  id?: string;
  jobTitle: string;
  company: string;
  employmentType: string;
  startDate: string;
  endDate?: string | null;
  description?: string | null;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  jobRole: string;
  gender?: 'male' | 'female' | 'other';
  avatar?: AvatarData | string;
  phone?: string;
  phoneVerified?: boolean;
  timezone?: string;
  profileCompleted?: boolean;
  userProfile?: UserProfileData;
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
  status: 'draft' | 'published';
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
  assessments?: {
    id: string;
    moduleId?: string | null;
    passThreshold: number;
  }[];
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
  isPinned?: boolean;
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
    trainerId?: string;
  } | null;
  replies?: ForumPost[];
}

export interface LearnerRosterItem {
  id: string;
  userId: string;
  name: string;
  email: string;
  progressPercent: number;
  completedModulesCount: number;
  totalModulesCount: number;
  status: 'not_started' | 'in_progress' | 'completed';
  enrolledAt: string;
  lastActiveAt: string;
  latestQuizScore: number | null;
  passedQuizzesCount: number;
  isStuck: boolean;
}

export interface QuestionInsight {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
  totalAttempts: number;
  incorrectCount: number;
  failureRate: number;
  needsReview: boolean;
  optionDistribution: Record<number, number>;
}

export interface ModuleQuizInsight {
  assessmentId: string;
  moduleId: string | null;
  moduleTitle: string;
  passThreshold: number;
  totalAttempts: number;
  passedAttempts: number;
  passRate: number;
  avgScore: number;
  needsReviewCount: number;
  questions: QuestionInsight[];
}

export interface CourseInsightsResponse {
  courseId: string;
  courseTitle: string;
  totalAssessments: number;
  moduleInsights: ModuleQuizInsight[];
}

