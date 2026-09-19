import { prisma } from './authService';
import {
  GapAnalysisItem,
  GapAnalysisResult,
  CourseRecommendation,
  SkillRating,
} from '../types';

export class GapAnalysisService {
  /**
   * Compute course recommendation and progress metrics for a learner
   */
  static async computeGapAnalysis(userId: string): Promise<GapAnalysisResult> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        enrollments: {
          include: {
            course: true,
          },
        },
      },
    });

    if (!user) {
      throw new Error(`Learner with ID ${userId} not found`);
    }

    // 1. Fetch Platform Competencies
    const allCompetencies = await prisma.competency.findMany();
    const requiredSkills = allCompetencies.map((comp) => ({
      competencyId: comp.id,
      competencyName: comp.name,
      requiredLevel: 3,
      weight: 1.0,
    }));

    // 2. Parse Learner's Current Skills
    const learnerSkillsMap = new Map<string, number>();
    if (user.profile && user.profile.skills) {
      try {
        const skills: SkillRating[] = JSON.parse(user.profile.skills);
        skills.forEach((s) => {
          learnerSkillsMap.set(s.competencyId, s.currentLevel);
        });
      } catch (e) {
        console.error('Failed to parse learner profile skills JSON:', e);
      }
    }

    // 3. Compute Gap Per Competency
    let totalWeightedGap = 0;
    let totalWeightedRequired = 0;
    const competencyBreakdown: GapAnalysisItem[] = [];
    const gapCompetencyIds = new Set<string>();

    for (const req of requiredSkills) {
      const currentLevel = learnerSkillsMap.get(req.competencyId) || 0;
      const gap = Math.max(0, req.requiredLevel - currentLevel);
      const weight = req.weight || 1.0;

      if (gap > 0) {
        gapCompetencyIds.add(req.competencyId);
      }

      totalWeightedGap += gap * weight;
      totalWeightedRequired += req.requiredLevel * weight;

      competencyBreakdown.push({
        competencyId: req.competencyId,
        competencyName: req.competencyName,
        currentLevel,
        requiredLevel: req.requiredLevel,
        gap,
        weight,
      });
    }

    const overallGapScore =
      totalWeightedRequired > 0
        ? Math.round((totalWeightedGap / totalWeightedRequired) * 100)
        : 0;
    const readinessPercentage = Math.max(0, 100 - overallGapScore);

    // 4. Fetch All Available Courses with Competency Tags
    const allCourses = await prisma.course.findMany({
      include: {
        competencyTags: {
          include: {
            competency: true,
          },
        },
      },
    });

    const enrolledCourseMap = new Map<string, string>();
    user.enrollments.forEach((e) => {
      enrolledCourseMap.set(e.courseId, e.status);
    });

    // 5. Score and Rank Courses
    const recommendedCourses: CourseRecommendation[] = [];

    for (const course of allCourses) {
      let relevanceScore = 100; // Primary course matches core track
      const matchedCompetencies: string[] = [];

      for (const tag of course.competencyTags) {
        matchedCompetencies.push(tag.competency.name);
      }

      const isEnrolled = enrolledCourseMap.has(course.id);
      const enrollmentStatus = enrolledCourseMap.get(course.id);

      recommendedCourses.push({
        courseId: course.id,
        title: course.title,
        description: course.description,
        difficultyLevel: course.difficultyLevel,
        thumbnailUrl: course.thumbnailUrl,
        targetCompetencies: matchedCompetencies,
        relevanceScore: Math.round(relevanceScore),
        enrolled: isEnrolled,
        enrollmentStatus,
      });
    }

    // Sort by relevance score descending
    recommendedCourses.sort((a, b) => b.relevanceScore - a.relevanceScore);

    return {
      learnerId: user.id,
      learnerName: user.name,
      jobRole: user.jobRole || 'Learner',
      department: user.department || 'General',
      overallGapScore,
      readinessPercentage,
      competencyBreakdown,
      recommendedCourses,
    };
  }
}
