import { Request, Response } from 'express';
import { prisma } from '../services/authService';
import { SkillRating, RoleCompetencyRequirementItem } from '../types';

export class AnalyticsController {
  static async getSummary(req: Request, res: Response) {
    try {
      const [
        totalLearners,
        totalTrainers,
        totalCourses,
        totalEnrollments,
        completedEnrollments,
        totalCertificates,
        totalAttempts,
      ] = await Promise.all([
        prisma.user.count({ where: { role: 'learner' } }),
        prisma.user.count({ where: { role: 'trainer' } }),
        prisma.course.count(),
        prisma.enrollment.count(),
        prisma.enrollment.count({ where: { status: 'completed' } }),
        prisma.certificate.count(),
        prisma.assessmentAttempt.count(),
      ]);

      const passedAttempts = await prisma.assessmentAttempt.count({ where: { passed: true } });

      const completionRate =
        totalEnrollments > 0 ? Math.round((completedEnrollments / totalEnrollments) * 100) : 0;
      const passRate =
        totalAttempts > 0 ? Math.round((passedAttempts / totalAttempts) * 100) : 0;

      return res.json({
        totalLearners,
        totalTrainers,
        totalCourses,
        totalEnrollments,
        completedEnrollments,
        totalCertificates,
        completionRate,
        passRate,
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  static async getCourseCompletionRates(req: Request, res: Response) {
    try {
      const courses = await prisma.course.findMany({
        include: {
          enrollments: true,
          assessments: {
            include: {
              attempts: true,
            },
          },
        },
      });

      const metrics = courses.map((course) => {
        const total = course.enrollments.length;
        const completed = course.enrollments.filter((e) => e.status === 'completed').length;
        const inProgress = course.enrollments.filter((e) => e.status === 'in_progress').length;
        const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

        const attempts = course.assessments.flatMap((a) => a.attempts);
        const avgScore =
          attempts.length > 0
            ? Math.round(attempts.reduce((sum, a) => sum + a.score, 0) / attempts.length)
            : 0;

        return {
          courseId: course.id,
          title: course.title,
          difficultyLevel: course.difficultyLevel,
          totalEnrollments: total,
          completedCount: completed,
          inProgressCount: inProgress,
          completionRate,
          avgAssessmentScore: avgScore,
        };
      });

      // Sort by total enrollments descending
      metrics.sort((a, b) => b.totalEnrollments - a.totalEnrollments);

      return res.json(metrics);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  static async getDepartmentGapHeatmap(req: Request, res: Response) {
    try {
      const learners = await prisma.user.findMany({
        where: { role: 'learner' },
        include: { profile: true },
      });

      const competencies = await prisma.competency.findMany();
      const roleRequirements = await prisma.roleCompetencyRequirement.findMany();

      // Group learners by department
      const departmentMap = new Map<string, typeof learners>();
      learners.forEach((learner) => {
        const dept = learner.department || 'General Administration';
        if (!departmentMap.has(dept)) {
          departmentMap.set(dept, []);
        }
        departmentMap.get(dept)!.push(learner);
      });

      const heatmapData: any[] = [];

      for (const [dept, deptLearners] of departmentMap.entries()) {
        const compScores: any = { department: dept, learnerCount: deptLearners.length };

        competencies.forEach((comp) => {
          let totalCurrent = 0;
          let count = 0;

          deptLearners.forEach((learner) => {
            if (learner.profile?.skills) {
              try {
                const skills: SkillRating[] = JSON.parse(learner.profile.skills);
                const matched = skills.find((s) => s.competencyId === comp.id || s.competencyName === comp.name);
                if (matched) {
                  totalCurrent += matched.currentLevel;
                  count++;
                }
              } catch (e) {}
            }
          });

          const currentAvg = count > 0 ? parseFloat((totalCurrent / count).toFixed(1)) : 1.0;
          // Target level benchmark (default 3.5 or from role requirement)
          const targetBenchmark = 3.5;
          const gap = parseFloat(Math.max(0, targetBenchmark - currentAvg).toFixed(1));

          compScores[comp.name] = {
            currentAvg,
            targetBenchmark,
            gap,
            status: gap === 0 ? 'Optimal' : gap > 1.5 ? 'Critical Gap' : 'Moderate Gap',
          };
        });

        heatmapData.push(compScores);
      }

      return res.json({
        competencyList: competencies.map((c) => ({ id: c.id, name: c.name, category: c.category })),
        heatmapData,
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }
}
