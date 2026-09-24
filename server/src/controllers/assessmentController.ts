import { Response } from 'express';
import crypto from 'crypto';
import { prisma } from '../services/authService';
import { AuthenticatedRequest, AssessmentQuestion, SkillRating } from '../types';

export class AssessmentController {
  static async getCourseAssessment(req: AuthenticatedRequest, res: Response) {
    try {
      const courseId = String(req.params.courseId);
      const moduleId = req.query.moduleId ? String(req.query.moduleId) : null;

      const assessment = await prisma.assessment.findFirst({
        where: {
          courseId,
          ...(moduleId ? { moduleId } : {}),
        },
      });

      if (!assessment) {
        return res.status(404).json({ error: 'No assessment found for this course or module' });
      }

      const questions: AssessmentQuestion[] = JSON.parse(assessment.questions || '[]');

      // Hide answers if user is learner
      const isPrivileged = req.user?.role === 'admin' || req.user?.role === 'trainer';
      const sanitizedQuestions = questions.map((q) => ({
        id: q.id,
        question: q.question,
        options: q.options,
        ...(isPrivileged ? { correctIndex: q.correctIndex, explanation: q.explanation } : {}),
      }));

      // Check if user has already passed
      let pastAttempts: any[] = [];
      if (req.user) {
        pastAttempts = await prisma.assessmentAttempt.findMany({
          where: {
            assessmentId: assessment.id,
            userId: req.user.userId,
          },
          orderBy: { attemptedAt: 'desc' },
        });
      }

      return res.json({
        id: assessment.id,
        courseId: assessment.courseId,
        moduleId: assessment.moduleId,
        passThreshold: assessment.passThreshold,
        totalQuestions: questions.length,
        questions: sanitizedQuestions,
        pastAttempts,
        hasPassed: pastAttempts.some((a) => a.passed),
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  static async saveAssessment(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'trainer')) {
        return res.status(403).json({ error: 'Only instructors or admins can configure assessments' });
      }

      const courseId = String(req.params.courseId);
      const course = await prisma.course.findUnique({ where: { id: courseId } });
      if (!course) return res.status(404).json({ error: 'Course not found' });

      if (req.user?.role !== 'admin' && course.trainerId !== req.user?.userId) {
        return res.status(403).json({ error: 'You are not authorized to configure assessments for this course' });
      }

      const { passThreshold = 70, questions, moduleId } = req.body;

      if (!Array.isArray(questions) || questions.length === 0) {
        return res.status(400).json({ error: 'At least one assessment question is required' });
      }

      const targetModuleId = moduleId ? String(moduleId) : null;

      const existing = await prisma.assessment.findFirst({
        where: {
          courseId,
          moduleId: targetModuleId,
        },
      });

      let assessment;
      if (existing) {
        assessment = await prisma.assessment.update({
          where: { id: existing.id },
          data: {
            passThreshold,
            questions: JSON.stringify(questions),
          },
        });
      } else {
        assessment = await prisma.assessment.create({
          data: {
            courseId,
            moduleId: targetModuleId,
            passThreshold,
            questions: JSON.stringify(questions),
          },
        });
      }

      return res.json({
        message: 'Assessment configured successfully',
        assessment: {
          ...assessment,
          questions: JSON.parse(assessment.questions),
        },
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  static async getModuleAssessment(req: AuthenticatedRequest, res: Response) {
    try {
      const courseId = String(req.params.courseId);
      const moduleId = String(req.params.moduleId);

      const course = await prisma.course.findUnique({ where: { id: courseId } });
      if (!course) return res.status(404).json({ error: 'Course not found' });

      const assessment = await prisma.assessment.findFirst({
        where: { courseId, moduleId },
      });

      if (!assessment) {
        return res.json({
          courseId,
          moduleId,
          passThreshold: 70,
          questions: [],
          exists: false,
        });
      }

      return res.json({
        id: assessment.id,
        courseId: assessment.courseId,
        moduleId: assessment.moduleId,
        passThreshold: assessment.passThreshold,
        questions: JSON.parse(assessment.questions || '[]'),
        exists: true,
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  static async getQuizInsights(req: AuthenticatedRequest, res: Response) {
    try {
      const courseId = String(req.params.courseId);
      const course = await prisma.course.findUnique({ where: { id: courseId } });
      if (!course) return res.status(404).json({ error: 'Course not found' });

      if (req.user?.role !== 'admin' && course.trainerId !== req.user?.userId) {
        return res.status(403).json({ error: 'You are not authorized to view insights for this course' });
      }

      const assessments = await prisma.assessment.findMany({
        where: { courseId },
        include: {
          attempts: true,
        },
      });

      const courseModules: any[] = JSON.parse(course.modules || '[]');

      const moduleInsights = assessments.map((assessment) => {
        const moduleObj = courseModules.find((m) => m.id === assessment.moduleId);
        const moduleTitle = moduleObj?.title || (assessment.moduleId ? `Module: ${assessment.moduleId}` : 'Course Final Assessment');

        let questions: any[] = [];
        try {
          questions = JSON.parse(assessment.questions || '[]');
        } catch (e) {
          questions = [];
        }

        const attempts = assessment.attempts;
        const totalAttempts = attempts.length;
        const passedAttempts = attempts.filter((a) => a.passed).length;
        const passRate = totalAttempts > 0 ? Math.round((passedAttempts / totalAttempts) * 100) : 0;
        const avgScore =
          totalAttempts > 0
            ? Math.round(attempts.reduce((sum, a) => sum + a.score, 0) / totalAttempts)
            : 0;

        // Per question diagnostic calculation
        const questionInsights = questions.map((q, qIdx) => {
          let incorrectCount = 0;
          const optionDistribution: Record<number, number> = {};
          if (Array.isArray(q.options)) {
            q.options.forEach((_: any, optIdx: number) => {
              optionDistribution[optIdx] = 0;
            });
          }

          attempts.forEach((attempt) => {
            try {
              const userAnswers = JSON.parse(attempt.answers || '[]');
              const chosen = userAnswers[qIdx];
              if (chosen !== undefined) {
                optionDistribution[chosen] = (optionDistribution[chosen] || 0) + 1;
                if (chosen !== q.correctIndex) {
                  incorrectCount++;
                }
              }
            } catch (e) {}
          });

          const failureRate = totalAttempts > 0 ? Math.round((incorrectCount / totalAttempts) * 100) : 0;
          const needsReview = totalAttempts > 0 && failureRate >= 40;

          return {
            id: q.id,
            question: q.question,
            options: q.options || [],
            correctIndex: q.correctIndex,
            explanation: q.explanation,
            totalAttempts,
            incorrectCount,
            failureRate,
            needsReview,
            optionDistribution,
          };
        });

        const needsReviewCount = questionInsights.filter((qi) => qi.needsReview).length;

        return {
          assessmentId: assessment.id,
          moduleId: assessment.moduleId,
          moduleTitle,
          passThreshold: assessment.passThreshold,
          totalAttempts,
          passedAttempts,
          passRate,
          avgScore,
          needsReviewCount,
          questions: questionInsights,
        };
      });

      return res.json({
        courseId,
        courseTitle: course.title,
        totalAssessments: assessments.length,
        moduleInsights,
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  static async attemptAssessment(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const id = String(req.params.id); // assessmentId
      const { answers } = req.body; // Array of selected option indices e.g. [0, 2, 1, 3]

      if (!Array.isArray(answers)) {
        return res.status(400).json({ error: 'Answers must be an array of selected indices' });
      }

      const assessment = await prisma.assessment.findUnique({
        where: { id },
        include: {
          course: {
            include: {
              competencyTags: {
                include: { competency: true },
              },
            },
          },
        },
      });

      if (!assessment) {
        return res.status(404).json({ error: 'Assessment not found' });
      }

      const questions: AssessmentQuestion[] = JSON.parse(assessment.questions || '[]');
      if (questions.length === 0) {
        return res.status(400).json({ error: 'Assessment has no questions configured' });
      }

      // Auto-grading
      let correctCount = 0;
      const gradedQuestions = questions.map((q, index) => {
        const userAnswer = answers[index];
        const isCorrect = userAnswer === q.correctIndex;
        if (isCorrect) correctCount++;
        return {
          id: q.id,
          question: q.question,
          options: q.options,
          userAnswer,
          correctIndex: q.correctIndex,
          isCorrect,
          explanation: q.explanation,
        };
      });

      const score = Math.round((correctCount / questions.length) * 100);
      const passed = score >= assessment.passThreshold;

      // Record attempt
      const attempt = await prisma.assessmentAttempt.create({
        data: {
          userId: req.user.userId,
          assessmentId: assessment.id,
          score,
          passed,
          answers: JSON.stringify(answers),
        },
      });

      let certificate = null;
      let profileUpdated = false;
      let isAllCompleted = false;
      let updatedProgressPercent = 100;
      let completedModulesList: string[] = [];

      // On Pass: complete module or entire course
      if (passed) {
        if (assessment.moduleId) {
          // 1. Module-level Assessment Passed
          let enrollment = await prisma.enrollment.findUnique({
            where: {
              userId_courseId: {
                userId: req.user.userId,
                courseId: assessment.courseId,
              },
            },
          });

          if (enrollment && enrollment.completedModules) {
            try {
              completedModulesList = JSON.parse(enrollment.completedModules);
            } catch (e) {
              completedModulesList = [];
            }
          }

          if (!completedModulesList.includes(assessment.moduleId)) {
            completedModulesList.push(assessment.moduleId);
          }

          let totalModules: any[] = [];
          try {
            totalModules = JSON.parse(assessment.course.modules || '[]');
          } catch (e) {
            totalModules = [];
          }

          const totalCount = totalModules.length || 1;
          updatedProgressPercent = Math.min(100, Math.round((completedModulesList.length / totalCount) * 100));
          isAllCompleted = updatedProgressPercent === 100 || completedModulesList.length >= totalCount;

          await prisma.enrollment.upsert({
            where: {
              userId_courseId: {
                userId: req.user.userId,
                courseId: assessment.courseId,
              },
            },
            create: {
              userId: req.user.userId,
              courseId: assessment.courseId,
              status: isAllCompleted ? 'completed' : 'in_progress',
              progressPercent: updatedProgressPercent,
              completedModules: JSON.stringify(completedModulesList),
              completedAt: isAllCompleted ? new Date() : null,
            },
            update: {
              status: isAllCompleted ? 'completed' : 'in_progress',
              progressPercent: updatedProgressPercent,
              completedModules: JSON.stringify(completedModulesList),
              completedAt: isAllCompleted ? new Date() : null,
            },
          });
        } else {
          // Course-level Assessment Passed
          isAllCompleted = true;
          await prisma.enrollment.upsert({
            where: {
              userId_courseId: {
                userId: req.user.userId,
                courseId: assessment.courseId,
              },
            },
            create: {
              userId: req.user.userId,
              courseId: assessment.courseId,
              status: 'completed',
              progressPercent: 100,
              completedAt: new Date(),
            },
            update: {
              status: 'completed',
              progressPercent: 100,
              completedAt: new Date(),
            },
          });
        }

        // If whole course completed (all module quizzes or final exam passed)
        if (isAllCompleted) {
          // Elevate Learner's Competency Profile
          const userProfile = await prisma.competencyProfile.findUnique({
            where: { userId: req.user.userId },
          });

          let currentSkills: SkillRating[] = [];
          if (userProfile && userProfile.skills) {
            try {
              currentSkills = JSON.parse(userProfile.skills);
            } catch (e) {
              currentSkills = [];
            }
          }

          const skillMap = new Map<string, SkillRating>();
          currentSkills.forEach((s) => skillMap.set(s.competencyId, s));

          for (const tag of assessment.course.competencyTags) {
            const existing = skillMap.get(tag.competencyId);
            const targetLevel = tag.targetLevel || 3;
            if (existing) {
              existing.currentLevel = Math.min(5, Math.max(existing.currentLevel + 1, targetLevel));
            } else {
              skillMap.set(tag.competencyId, {
                competencyId: tag.competencyId,
                competencyName: tag.competency.name,
                currentLevel: targetLevel,
              });
            }
          }

          const newSkills = Array.from(skillMap.values());
          await prisma.competencyProfile.upsert({
            where: { userId: req.user.userId },
            create: {
              userId: req.user.userId,
              skills: JSON.stringify(newSkills),
            },
            update: {
              skills: JSON.stringify(newSkills),
            },
          });

          // Also grant Verified UserSkills (VANTAGE source)
          for (const tag of assessment.course.competencyTags) {
            const skillName = tag.competency.name;
            const existingSkill = await prisma.userSkill.findFirst({
              where: { userId: req.user.userId, name: skillName },
            });
            const levelStr = (tag.targetLevel || 3) >= 4 ? 'ADVANCED' : (tag.targetLevel || 3) >= 2 ? 'INTERMEDIATE' : 'BEGINNER';
            if (!existingSkill) {
              await prisma.userSkill.create({
                data: {
                  userId: req.user.userId,
                  name: skillName,
                  level: levelStr,
                  source: 'VANTAGE',
                },
              });
            } else {
              await prisma.userSkill.update({
                where: { id: existingSkill.id },
                data: { source: 'VANTAGE' },
              });
            }
          }
          profileUpdated = true;

          // Issue Certificate
          const certNumber = `VT-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
          const verificationHash = crypto
            .createHash('sha256')
            .update(`${req.user.userId}:${assessment.courseId}:${certNumber}:${Date.now()}`)
            .digest('hex');

          certificate = await prisma.certificate.upsert({
            where: {
              userId_courseId: {
                userId: req.user.userId,
                courseId: assessment.courseId,
              },
            },
            create: {
              userId: req.user.userId,
              courseId: assessment.courseId,
              certificateNumber: certNumber,
              verificationHash,
              certificateUrl: `/certificates/${certNumber}.pdf`,
            },
            update: {
              // keep existing cert if already issued
            },
            include: {
              course: true,
              user: { select: { name: true, department: true } },
            },
          });
        }
      }

      let outcomeMessage = 'Assessment completed. You did not meet the pass threshold. Please review the materials and try again.';
      if (passed) {
        if (isAllCompleted) {
          outcomeMessage = 'Outstanding! You completed all modules, passed the assessment, and earned your official Certificate of Competency!';
        } else {
          outcomeMessage = 'Congratulations! You passed the module assessment and advanced your learning progress.';
        }
      }

      return res.json({
        message: outcomeMessage,
        score,
        passThreshold: assessment.passThreshold,
        passed,
        moduleId: assessment.moduleId,
        isAllCompleted,
        progressPercent: updatedProgressPercent,
        completedModules: completedModulesList,
        totalQuestions: questions.length,
        correctAnswers: correctCount,
        gradedQuestions,
        profileUpdated,
        certificate,
        attemptId: attempt.id,
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  static async getCertificateByNumber(req: AuthenticatedRequest, res: Response) {
    try {
      const certNumber = String(req.params.certNumber);

      const certificate = await prisma.certificate.findUnique({
        where: { certificateNumber: certNumber },
        include: {
          course: {
            include: {
              trainer: { select: { name: true } },
              competencyTags: { include: { competency: true } },
            },
          },
          user: {
            select: { name: true, department: true, jobRole: true, email: true },
          },
        },
      });

      if (!certificate) {
        return res.status(404).json({ error: 'Certificate not found' });
      }

      return res.json(certificate);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  static async getMyCertificates(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const certificates = await prisma.certificate.findMany({
        where: { userId: req.user.userId },
        include: {
          course: {
            include: {
              trainer: { select: { name: true } },
              competencyTags: { include: { competency: true } },
            },
          },
        },
        orderBy: { issuedAt: 'desc' },
      });

      return res.json(certificates);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }
}
