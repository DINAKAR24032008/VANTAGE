import { prisma } from './authService';
import {
  GapAnalysisItem,
  GapAnalysisResult,
  CourseRecommendation,
  RoleCompetencyRequirementItem,
  SkillRating,
} from '../types';

export class GapAnalysisService {
  /**
   * Compute gap analysis and course recommendations for a learner
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

    // 1. Fetch Role Competency Requirements
    let roleMatrix = await prisma.roleCompetencyRequirement.findUnique({
      where: { jobRole: user.jobRole },
    });

    // Fallback matrix if specific role is not configured
    let requiredSkills: RoleCompetencyRequirementItem[] = [];
    if (roleMatrix) {
      try {
        requiredSkills = JSON.parse(roleMatrix.requirements);
      } catch (e) {
        requiredSkills = [];
      }
    }

    // If no specific role matrix exists, generate a baseline from all competencies
    if (requiredSkills.length === 0) {
      const allCompetencies = await prisma.competency.findMany();
      requiredSkills = allCompetencies.slice(0, 5).map((comp) => ({
        competencyId: comp.id,
        competencyName: comp.name,
        requiredLevel: 3,
        weight: 1.0,
      }));
    }

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
      let relevanceScore = 0;
      const matchedCompetencies: string[] = [];

      for (const tag of course.competencyTags) {
        matchedCompetencies.push(tag.competency.name);

        if (gapCompetencyIds.has(tag.competencyId)) {
          const gapItem = competencyBreakdown.find((b) => b.competencyId === tag.competencyId);
          if (gapItem) {
            // Higher score if course directly bridges the specific gap level
            const gapMagnitude = gapItem.gap;
            relevanceScore += gapMagnitude * 25 * gapItem.weight;

            // Bonus for matching level
            if (tag.targetLevel >= gapItem.requiredLevel) {
              relevanceScore += 15;
            }
          }
        }
      }

      // If course matches general domain even if gap is small, give baseline score
      if (relevanceScore === 0 && matchedCompetencies.length > 0) {
        relevanceScore = 10;
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
      jobRole: user.jobRole,
      department: user.department,
      overallGapScore,
      readinessPercentage,
      competencyBreakdown,
      recommendedCourses,
    };
  }

  /**
   * Feedback Loop (Stretch Goal)
   * Recompute recommendations for all learners with an updated job role
   */
  static async recomputeAllLearnersForRole(jobRole: string) {
    const learners = await prisma.user.findMany({
      where: {
        role: 'learner',
        jobRole,
      },
    });

    const recomputedSummary = [];

    for (const learner of learners) {
      const analysis = await this.computeGapAnalysis(learner.id);
      recomputedSummary.push({
        learnerId: learner.id,
        name: learner.name,
        overallGapScore: analysis.overallGapScore,
        readinessPercentage: analysis.readinessPercentage,
        recommendedCount: analysis.recommendedCourses.length,
      });
    }

    return {
      jobRole,
      totalLearnersUpdated: learners.length,
      learners: recomputedSummary,
    };
  }
}
