import { Response } from 'express';
import crypto from 'crypto';
import { prisma } from '../services/authService';
import { AuthenticatedRequest, AssessmentQuestion, SkillRating } from '../types';

export class AssessmentController {
  static async getCourseAssessment(req: AuthenticatedRequest, res: Response) {
    try {
      const courseId = String(req.params.courseId);

      const assessment = await prisma.assessment.findUnique({
        where: { courseId },
      });

      if (!assessment) {
        return res.status(404).json({ error: 'No assessment found for this course' });
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
        return res.status(403).json({ error: 'Only trainers or admins can configure assessments' });
      }

      const courseId = String(req.params.courseId);
      const { passThreshold = 70, questions } = req.body;

      if (!Array.isArray(questions) || questions.length === 0) {
        return res.status(400).json({ error: 'At least one assessment question is required' });
      }

      const assessment = await prisma.assessment.upsert({
        where: { courseId },
        create: {
          courseId,
          passThreshold,
          questions: JSON.stringify(questions),
        },
        update: {
          passThreshold,
          questions: JSON.stringify(questions),
        },
      });

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

      // On Pass: complete enrollment, update competency profile, issue certificate
      if (passed) {
        // 1. Complete Enrollment
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

        // 2. Elevate Learner's Competency Profile
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
            // Elevate level up to target level, minimum +1
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
        profileUpdated = true;

        // 3. Issue Certificate
        const certNumber = `MOES-CC-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
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

      return res.json({
        message: passed
          ? 'Congratulations! You passed the assessment and earned a certificate.'
          : 'Assessment completed. You did not meet the pass threshold. Please review the course materials and try again.',
        score,
        passThreshold: assessment.passThreshold,
        passed,
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
