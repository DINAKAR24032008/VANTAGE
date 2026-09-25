import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../services/authService';
import { AuthenticatedRequest } from '../types';

// Helper: Sanitize string input (strip HTML tags & trim)
const sanitizeText = (input: string | null | undefined, maxLength?: number): string | null => {
  if (input === null || input === undefined) return null;
  let cleaned = String(input).replace(/<[^>]*>?/gm, '').trim();
  if (maxLength && cleaned.length > maxLength) {
    cleaned = cleaned.substring(0, maxLength);
  }
  return cleaned;
};

// Helper: Normalize & validate LinkedIn URL
const normalizeLinkedinUrl = (url: string | null | undefined): { valid: boolean; normalized: string | null } => {
  if (!url || !url.trim()) return { valid: true, normalized: null };
  let trimmed = url.trim();
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    trimmed = 'https://' + trimmed;
  }
  if (trimmed.startsWith('http://')) {
    trimmed = 'https://' + trimmed.substring(7);
  }
  try {
    const parsed = new URL(trimmed);
    parsed.search = '';
    parsed.hash = '';
    let href = parsed.toString().replace(/\/$/, '');
    
    const linkedinRegex = /^https:\/\/(www\.|[a-z]{2}\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+\/?$/i;
    if (linkedinRegex.test(href) || href === 'https://www.linkedin.com/in/your-name') {
      return { valid: true, normalized: href };
    }
  } catch (e) {
    // invalid URL format
  }
  return { valid: false, normalized: null };
};

// Calculate profile completion percentage
export const calculateCompletionPercentage = (profile: any): number => {
  if (!profile) return 0;
  
  let score = 0;
  if (profile.fullName && profile.fullName.trim()) score += 15;
  if (profile.country && profile.country.trim()) score += 15;
  if (profile.city && profile.city.trim()) score += 15;
  if (profile.profession && profile.profession !== 'OTHER') score += 15;
  
  if (profile.bio && profile.bio.trim()) score += 10;
  if (profile.highestDegree && profile.highestDegree !== 'NONE') score += 10;
  if (profile.linkedinUrl && profile.linkedinUrl.trim()) score += 10;
  if (profile.company || profile.institution) score += 10;

  return Math.min(100, score);
};

export async function generateUniqueUsername(name: string, userId: string): Promise<string> {
  let base = name
    .toLowerCase()
    .replace(/[^a-z0-9._]/g, '.')
    .replace(/\.+/g, '.')
    .replace(/^\.|\.$/g, '');
  if (base.length < 3) base = `user.${base || 'learner'}`;
  if (base.length > 25) base = base.substring(0, 25);

  let candidate = base;
  let suffix = 1;

  while (true) {
    const existing = await prisma.userProfile.findFirst({
      where: {
        username: candidate,
        NOT: { userId },
      },
    });
    if (!existing) return candidate;
    candidate = `${base}${suffix}`;
    suffix++;
  }
}

export class ProfileController {
  // Helper: Map Prisma error P2003 (foreign key) and P2002 safely
  private static handleControllerError(res: Response, err: any) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[ProfileController Error]:', err);
    }

    if (err.code === 'P2003' || (err.message && err.message.includes('Foreign key constraint'))) {
      return res.status(401).json({
        message: 'Your session is no longer valid. Please log in again.',
        code: 'USER_NOT_FOUND',
      });
    }

    return res.status(500).json({
      error: 'An error occurred while updating profile data.',
    });
  }

  // Ensure profile exists for user using upsert & User verification
  static async getOrCreateUserProfile(userId: string) {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[ProfileController] Verifying user existence for userId: ${userId}`);
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(`[ProfileController] User ID ${userId} not found in database.`);
      }
      return { user: null, profile: null, userNotFound: true };
    }

    const isTrainerOrAdmin = user.role === 'trainer' || user.role === 'admin';

    try {
      let profile = await prisma.userProfile.findUnique({ where: { userId } });
      if (!profile) {
        const generatedUsername = await generateUniqueUsername(user.name, userId);
        profile = await prisma.userProfile.create({
          data: {
            user: { connect: { id: userId } },
            fullName: user.name || 'Vantage Learner',
            username: generatedUsername,
            accountVisibility: isTrainerOrAdmin ? 'PUBLIC' : 'PRIVATE',
            country: 'India',
            city: '',
            profession: isTrainerOrAdmin ? 'WORKING_PROFESSIONAL' : 'STUDENT',
            showcaseVisible: isTrainerOrAdmin,
            linkedinVisible: isTrainerOrAdmin,
            profileCompleted: false,
          },
        });
      } else if (!profile.username) {
        const generatedUsername = await generateUniqueUsername(user.name, userId);
        profile = await prisma.userProfile.update({
          where: { id: profile.id },
          data: { username: generatedUsername },
        });
      }
      return { user, profile, userNotFound: false };
    } catch (err: any) {
      if (err.code === 'P2002') {
        const existing = await prisma.userProfile.findUnique({ where: { userId } });
        return { user, profile: existing, userNotFound: false };
      }
      throw err;
    }
  }

  // GET /api/profile/me
  static async getMyProfile(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ message: 'Unauthorized', code: 'UNAUTHORIZED' });
      const userId = req.user.userId;

      const { user, profile, userNotFound } = await ProfileController.getOrCreateUserProfile(userId);
      if (userNotFound || !user || !profile) {
        return res.status(401).json({
          message: 'Your session is no longer valid. Please log in again.',
          code: 'USER_NOT_FOUND',
        });
      }

      const [skills, achievements, experiences, certificates, enrollments] = await Promise.all([
        prisma.userSkill.findMany({ where: { userId } }),
        prisma.achievement.findMany({ where: { userId }, orderBy: { date: 'desc' } }),
        prisma.experience.findMany({ where: { userId }, orderBy: { startDate: 'desc' } }),
        prisma.certificate.findMany({
          where: { userId },
          include: { course: { select: { title: true } } },
          orderBy: { issuedAt: 'desc' },
        }),
        prisma.enrollment.findMany({ where: { userId } }),
      ]);

      const completionPercent = calculateCompletionPercentage(profile);

      return res.json({
        profile,
        skills,
        achievements,
        experiences,
        certificates,
        stats: {
          enrolledCount: enrollments.length,
          completedCount: enrollments.filter((e) => e.status === 'completed').length,
          certificateCount: certificates.length,
        },
        completionPercent,
      });
    } catch (err: any) {
      return ProfileController.handleControllerError(res, err);
    }
  }

  // PUT /api/profile/me
  static async updateMyProfile(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ message: 'Unauthorized', code: 'UNAUTHORIZED' });
      const userId = req.user.userId;

      const { user, profile, userNotFound } = await ProfileController.getOrCreateUserProfile(userId);
      if (userNotFound || !user || !profile) {
        return res.status(401).json({
          message: 'Your session is no longer valid. Please log in again.',
          code: 'USER_NOT_FOUND',
        });
      }

      const body = req.body;
      const dataToUpdate: any = {};

      if (body.fullName !== undefined) dataToUpdate.fullName = sanitizeText(body.fullName, 100) || user.name;
      if (body.country !== undefined) dataToUpdate.country = sanitizeText(body.country, 100) || 'India';
      if (body.state !== undefined) dataToUpdate.state = sanitizeText(body.state, 100);
      if (body.city !== undefined) dataToUpdate.city = sanitizeText(body.city, 100) || '';
      if (body.dateOfBirth !== undefined) dataToUpdate.dateOfBirth = body.dateOfBirth ? new Date(body.dateOfBirth) : null;
      
      if (body.profession !== undefined) dataToUpdate.profession = sanitizeText(body.profession, 50);
      if (body.highestDegree !== undefined) dataToUpdate.highestDegree = sanitizeText(body.highestDegree, 50);
      if (body.fieldOfStudy !== undefined) dataToUpdate.fieldOfStudy = sanitizeText(body.fieldOfStudy, 100);
      if (body.institution !== undefined) dataToUpdate.institution = sanitizeText(body.institution, 150);
      if (body.graduationYear !== undefined) dataToUpdate.graduationYear = body.graduationYear ? Number(body.graduationYear) : null;
      if (body.company !== undefined) dataToUpdate.company = sanitizeText(body.company, 150);
      if (body.jobTitle !== undefined) dataToUpdate.jobTitle = sanitizeText(body.jobTitle, 100);
      if (body.yearsOfExperience !== undefined) dataToUpdate.yearsOfExperience = sanitizeText(String(body.yearsOfExperience), 20);
      
      if (body.bio !== undefined) dataToUpdate.bio = sanitizeText(body.bio, 300);

      if (body.linkedinUrl !== undefined) {
        const { valid, normalized } = normalizeLinkedinUrl(body.linkedinUrl);
        if (!valid) {
          return res.status(400).json({ error: 'Invalid LinkedIn URL format. Must be https://linkedin.com/in/your-handle' });
        }
        dataToUpdate.linkedinUrl = normalized;
      }

      if (body.showcaseVisible !== undefined) dataToUpdate.showcaseVisible = Boolean(body.showcaseVisible);
      if (body.linkedinVisible !== undefined) dataToUpdate.linkedinVisible = Boolean(body.linkedinVisible);
      if (body.locationVisible !== undefined) dataToUpdate.locationVisible = Boolean(body.locationVisible);
      if (body.educationVisible !== undefined) dataToUpdate.educationVisible = Boolean(body.educationVisible);

      const updated = await prisma.userProfile.update({
        where: { userId },
        data: dataToUpdate,
      });

      const completionPercent = calculateCompletionPercentage(updated);

      return res.json({
        message: 'Profile updated successfully',
        profile: updated,
        completionPercent,
      });
    } catch (err: any) {
      return ProfileController.handleControllerError(res, err);
    }
  }

  // POST /api/profile/me/complete
  static async completeProfile(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ message: 'Unauthorized', code: 'UNAUTHORIZED' });
      const userId = req.user.userId;

      const { profile, userNotFound } = await ProfileController.getOrCreateUserProfile(userId);
      if (userNotFound || !profile) {
        return res.status(401).json({
          message: 'Your session is no longer valid. Please log in again.',
          code: 'USER_NOT_FOUND',
        });
      }

      if (!profile.fullName || !profile.country || !profile.city || !profile.profession) {
        return res.status(400).json({
          error: 'Required fields missing: Full Name, Country, City, and Profession are required to complete profile.',
        });
      }

      const updated = await prisma.userProfile.update({
        where: { userId },
        data: {
          profileCompleted: true,
          profileCompletedAt: new Date(),
        },
      });

      return res.json({
        message: 'Profile onboarding completed!',
        profile: updated,
      });
    } catch (err: any) {
      return ProfileController.handleControllerError(res, err);
    }
  }

  // GET/PUT /api/profile/me/linkedin
  static async updateLinkedin(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ message: 'Unauthorized', code: 'UNAUTHORIZED' });
      const { userNotFound } = await ProfileController.getOrCreateUserProfile(req.user.userId);
      if (userNotFound) {
        return res.status(401).json({
          message: 'Your session is no longer valid. Please log in again.',
          code: 'USER_NOT_FOUND',
        });
      }

      const { linkedinUrl } = req.body;
      const { valid, normalized } = normalizeLinkedinUrl(linkedinUrl);
      if (!valid) {
        return res.status(400).json({ error: 'Invalid LinkedIn URL format. Use https://linkedin.com/in/handle' });
      }

      const updated = await prisma.userProfile.update({
        where: { userId: req.user.userId },
        data: { linkedinUrl: normalized },
      });

      return res.json({ message: 'LinkedIn URL updated', linkedinUrl: updated.linkedinUrl });
    } catch (err: any) {
      return ProfileController.handleControllerError(res, err);
    }
  }

  // Skills handlers
  static async getSkills(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ message: 'Unauthorized', code: 'UNAUTHORIZED' });
      const { userNotFound } = await ProfileController.getOrCreateUserProfile(req.user.userId);
      if (userNotFound) {
        return res.status(401).json({
          message: 'Your session is no longer valid. Please log in again.',
          code: 'USER_NOT_FOUND',
        });
      }

      const skills = await prisma.userSkill.findMany({ where: { userId: req.user.userId } });
      return res.json(skills);
    } catch (err: any) {
      return ProfileController.handleControllerError(res, err);
    }
  }

  static async updateSkills(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ message: 'Unauthorized', code: 'UNAUTHORIZED' });
      const userId = req.user.userId;

      const { userNotFound } = await ProfileController.getOrCreateUserProfile(userId);
      if (userNotFound) {
        return res.status(401).json({
          message: 'Your session is no longer valid. Please log in again.',
          code: 'USER_NOT_FOUND',
        });
      }

      const { skills } = req.body;
      if (!Array.isArray(skills)) {
        return res.status(400).json({ error: 'Skills must be an array' });
      }
      if (skills.length > 20) {
        return res.status(400).json({ error: 'Maximum 20 skills allowed per profile' });
      }

      const existingSkills = await prisma.userSkill.findMany({ where: { userId } });
      const existingVantageMap = new Map(existingSkills.filter((s) => s.source === 'VANTAGE').map((s) => [s.name.toLowerCase(), s]));

      await prisma.userSkill.deleteMany({ where: { userId } });

      const newSkillsData = skills.map((s: any) => {
        const cleanName = sanitizeText(s.name, 50) || 'Skill';
        const isVantage = existingVantageMap.has(cleanName.toLowerCase());
        return {
          userId,
          name: cleanName,
          level: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'].includes(s.level) ? s.level : 'INTERMEDIATE',
          source: isVantage ? 'VANTAGE' : 'SELF',
          hidden: Boolean(s.hidden),
        };
      });

      await prisma.userSkill.createMany({ data: newSkillsData });

      const updated = await prisma.userSkill.findMany({ where: { userId } });
      return res.json({ message: 'Skills updated', skills: updated });
    } catch (err: any) {
      return ProfileController.handleControllerError(res, err);
    }
  }

  // Achievements handlers
  static async getAchievements(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ message: 'Unauthorized', code: 'UNAUTHORIZED' });
      const { userNotFound } = await ProfileController.getOrCreateUserProfile(req.user.userId);
      if (userNotFound) {
        return res.status(401).json({
          message: 'Your session is no longer valid. Please log in again.',
          code: 'USER_NOT_FOUND',
        });
      }

      const items = await prisma.achievement.findMany({ where: { userId: req.user.userId }, orderBy: { date: 'desc' } });
      return res.json(items);
    } catch (err: any) {
      return ProfileController.handleControllerError(res, err);
    }
  }

  static async addAchievement(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ message: 'Unauthorized', code: 'UNAUTHORIZED' });
      const userId = req.user.userId;

      const { userNotFound } = await ProfileController.getOrCreateUserProfile(userId);
      if (userNotFound) {
        return res.status(401).json({
          message: 'Your session is no longer valid. Please log in again.',
          code: 'USER_NOT_FOUND',
        });
      }

      const count = await prisma.achievement.count({ where: { userId } });
      if (count >= 30) {
        return res.status(400).json({ error: 'Maximum 30 achievements allowed per profile' });
      }

      const { title, organization, type, description, date, link } = req.body;
      if (!title || !organization) {
        return res.status(400).json({ error: 'Title and Organization are required' });
      }

      const created = await prisma.achievement.create({
        data: {
          userId,
          title: sanitizeText(title, 100)!,
          organization: sanitizeText(organization, 100)!,
          type: ['AWARD', 'PROJECT', 'PUBLICATION', 'HACKATHON', 'CERTIFICATION', 'OTHER'].includes(type) ? type : 'OTHER',
          description: sanitizeText(description, 300),
          date: date ? new Date(date) : new Date(),
          link: sanitizeText(link, 250),
        },
      });

      return res.status(201).json(created);
    } catch (err: any) {
      return ProfileController.handleControllerError(res, err);
    }
  }

  static async updateAchievement(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ message: 'Unauthorized', code: 'UNAUTHORIZED' });
      const id = String(req.params.id);
      const userId = req.user.userId;

      const existing = await prisma.achievement.findFirst({ where: { id, userId } });
      if (!existing) return res.status(404).json({ error: 'Achievement not found' });

      const { title, organization, type, description, date, link } = req.body;

      const updated = await prisma.achievement.update({
        where: { id },
        data: {
          title: title ? sanitizeText(title, 100)! : existing.title,
          organization: organization ? sanitizeText(organization, 100)! : existing.organization,
          type: type && ['AWARD', 'PROJECT', 'PUBLICATION', 'HACKATHON', 'CERTIFICATION', 'OTHER'].includes(type) ? type : existing.type,
          description: description !== undefined ? sanitizeText(description, 300) : existing.description,
          date: date ? new Date(date) : existing.date,
          link: link !== undefined ? sanitizeText(link, 250) : existing.link,
        },
      });

      return res.json(updated);
    } catch (err: any) {
      return ProfileController.handleControllerError(res, err);
    }
  }

  static async deleteAchievement(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ message: 'Unauthorized', code: 'UNAUTHORIZED' });
      const id = String(req.params.id);

      const existing = await prisma.achievement.findFirst({ where: { id, userId: req.user.userId } });
      if (!existing) return res.status(404).json({ error: 'Achievement not found' });

      await prisma.achievement.delete({ where: { id } });
      return res.json({ message: 'Achievement deleted' });
    } catch (err: any) {
      return ProfileController.handleControllerError(res, err);
    }
  }

  // Experience handlers
  static async getExperiences(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ message: 'Unauthorized', code: 'UNAUTHORIZED' });
      const { userNotFound } = await ProfileController.getOrCreateUserProfile(req.user.userId);
      if (userNotFound) {
        return res.status(401).json({
          message: 'Your session is no longer valid. Please log in again.',
          code: 'USER_NOT_FOUND',
        });
      }

      const items = await prisma.experience.findMany({ where: { userId: req.user.userId }, orderBy: { startDate: 'desc' } });
      return res.json(items);
    } catch (err: any) {
      return ProfileController.handleControllerError(res, err);
    }
  }

  static async addExperience(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ message: 'Unauthorized', code: 'UNAUTHORIZED' });
      const userId = req.user.userId;

      const { userNotFound } = await ProfileController.getOrCreateUserProfile(userId);
      if (userNotFound) {
        return res.status(401).json({
          message: 'Your session is no longer valid. Please log in again.',
          code: 'USER_NOT_FOUND',
        });
      }

      const count = await prisma.experience.count({ where: { userId } });
      if (count >= 15) {
        return res.status(400).json({ error: 'Maximum 15 experience entries allowed per profile' });
      }

      const { jobTitle, company, employmentType, startDate, endDate, description } = req.body;
      if (!jobTitle || !company) {
        return res.status(400).json({ error: 'Job Title and Company are required' });
      }

      const created = await prisma.experience.create({
        data: {
          userId,
          jobTitle: sanitizeText(jobTitle, 100)!,
          company: sanitizeText(company, 100)!,
          employmentType: sanitizeText(employmentType, 50) || 'Full-time',
          startDate: startDate ? new Date(startDate) : new Date(),
          endDate: endDate ? new Date(endDate) : null,
          description: sanitizeText(description, 300),
        },
      });

      return res.status(201).json(created);
    } catch (err: any) {
      return ProfileController.handleControllerError(res, err);
    }
  }

  static async updateExperience(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ message: 'Unauthorized', code: 'UNAUTHORIZED' });
      const id = String(req.params.id);
      const userId = req.user.userId;

      const existing = await prisma.experience.findFirst({ where: { id, userId } });
      if (!existing) return res.status(404).json({ error: 'Experience entry not found' });

      const { jobTitle, company, employmentType, startDate, endDate, description } = req.body;

      const updated = await prisma.experience.update({
        where: { id },
        data: {
          jobTitle: jobTitle ? sanitizeText(jobTitle, 100)! : existing.jobTitle,
          company: company ? sanitizeText(company, 100)! : existing.company,
          employmentType: employmentType ? sanitizeText(employmentType, 50)! : existing.employmentType,
          startDate: startDate ? new Date(startDate) : existing.startDate,
          endDate: endDate !== undefined ? (endDate ? new Date(endDate) : null) : existing.endDate,
          description: description !== undefined ? sanitizeText(description, 300) : existing.description,
        },
      });

      return res.json(updated);
    } catch (err: any) {
      return ProfileController.handleControllerError(res, err);
    }
  }

  static async deleteExperience(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ message: 'Unauthorized', code: 'UNAUTHORIZED' });
      const id = String(req.params.id);

      const existing = await prisma.experience.findFirst({ where: { id, userId: req.user.userId } });
      if (!existing) return res.status(404).json({ error: 'Experience entry not found' });

      await prisma.experience.delete({ where: { id } });
      return res.json({ message: 'Experience deleted' });
    } catch (err: any) {
      return ProfileController.handleControllerError(res, err);
    }
  }

  // GET /api/profile/:userId (Public Profile view with strict privacy enforcement)
  static async getPublicProfile(req: AuthenticatedRequest, res: Response) {
    try {
      const targetUserId = String(req.params.userId);
      const requester = req.user;

      const targetUser = await prisma.user.findUnique({
        where: { id: targetUserId },
        select: {
          id: true,
          name: true,
          role: true,
          avatar: true,
        },
      });

      if (!targetUser) return res.status(404).json({ error: 'User not found' });

      const { profile, userNotFound } = await ProfileController.getOrCreateUserProfile(targetUser.id);
      if (userNotFound || !profile) {
        return res.status(404).json({ error: 'Profile not found' });
      }

      const isSelf = requester?.userId === targetUserId;
      const isAdmin = requester?.role === 'admin';

      let isTrainerOfUser = false;
      if (requester?.role === 'trainer') {
        const trainerCourses = await prisma.course.findMany({
          where: { trainerId: requester.userId },
          select: { id: true },
        });
        const courseIds = trainerCourses.map((c) => c.id);
        const enrollment = await prisma.enrollment.findFirst({
          where: { userId: targetUserId, courseId: { in: courseIds } },
        });
        if (enrollment) isTrainerOfUser = true;
      }

      const publicData: any = {
        id: targetUser.id,
        name: profile.fullName || targetUser.name,
        role: targetUser.role,
        avatar: targetUser.avatar,
        profession: profile.profession,
        company: profile.company,
        jobTitle: profile.jobTitle,
        yearsOfExperience: profile.yearsOfExperience,
        bio: profile.bio,
      };

      if (isSelf || isAdmin || profile.locationVisible || isTrainerOfUser) {
        publicData.country = profile.country;
        publicData.state = profile.state;
        publicData.city = profile.city;
      }

      if (isSelf || isAdmin || profile.educationVisible || isTrainerOfUser) {
        publicData.highestDegree = profile.highestDegree;
        publicData.fieldOfStudy = profile.fieldOfStudy;
        publicData.institution = profile.institution;
        publicData.graduationYear = profile.graduationYear;
      }

      if (isSelf || isAdmin || profile.linkedinVisible) {
        publicData.linkedinUrl = profile.linkedinUrl;
      }

      if (isSelf || isAdmin || profile.showcaseVisible) {
        const [skills, achievements, experiences, certificates] = await Promise.all([
          prisma.userSkill.findMany({ where: { userId: targetUserId, hidden: false } }),
          prisma.achievement.findMany({ where: { userId: targetUserId }, orderBy: { date: 'desc' } }),
          prisma.experience.findMany({ where: { userId: targetUserId }, orderBy: { startDate: 'desc' } }),
          prisma.certificate.findMany({
            where: { userId: targetUserId },
            include: { course: { select: { title: true } } },
            orderBy: { issuedAt: 'desc' },
          }),
        ]);
        publicData.skills = skills;
        publicData.achievements = achievements;
        publicData.experiences = experiences;
        publicData.certificates = certificates;
      }

        return res.json(publicData);
    } catch (err: any) {
      return ProfileController.handleControllerError(res, err);
    }
  }

  /**
   * GET /api/u/:username
   * Public profile resolution by @username with server-side privacy enforcement
   */
  static async getProfileByUsername(req: AuthenticatedRequest, res: Response) {
    try {
      const usernameParam = Array.isArray(req.params.username) ? req.params.username[0] : String(req.params.username);
      const cleanUsername = usernameParam.toLowerCase().trim();

      const profile = await prisma.userProfile.findUnique({
        where: { username: cleanUsername },
        include: { user: true },
      });

      if (!profile || !profile.user) {
        return res.status(404).json({ message: 'Profile not found', code: 'NOT_FOUND' });
      }

      const targetUserId = profile.userId;
      const targetUser = profile.user;
      const viewerId = req.user?.userId;

      // 1. Block Check in EITHER direction
      if (viewerId) {
        const blockExists = await prisma.block.findFirst({
          where: {
            OR: [
              { blockerId: viewerId, blockedId: targetUserId },
              { blockerId: targetUserId, blockedId: viewerId },
            ],
          },
        });

        if (blockExists) {
          return res.status(404).json({ message: 'Profile not found', code: 'NOT_FOUND' });
        }
      }

      // 2. Roles & Relationship resolution
      const isOwner = viewerId === targetUserId;
      const isAdmin = req.user?.role === 'admin';

      let isFollowedByMe = false;
      let isPending = false;
      let followsMe = false;

      if (viewerId) {
        const follow1 = await prisma.follow.findUnique({
          where: { followerId_followingId: { followerId: viewerId, followingId: targetUserId } },
        });
        if (follow1) {
          isFollowedByMe = follow1.status === 'ACCEPTED';
          isPending = follow1.status === 'PENDING';
        }

        const follow2 = await prisma.follow.findUnique({
          where: { followerId_followingId: { followerId: targetUserId, followingId: viewerId } },
        });
        if (follow2) {
          followsMe = follow2.status === 'ACCEPTED';
        }
      }

      // 3. Privacy Enforcement (PUBLIC vs PRIVATE)
      const visibility = profile.accountVisibility || (targetUser.role === 'learner' ? 'PRIVATE' : 'PUBLIC');
      const canAccessPrivateDetails = isOwner || isAdmin || isFollowedByMe;

      if (visibility === 'PRIVATE' && !canAccessPrivateDetails) {
        return res.json({
          id: targetUser.id,
          name: profile.fullName || targetUser.name,
          username: profile.username,
          role: targetUser.role,
          avatar: targetUser.avatar,
          profession: profile.profession,
          followersCount: profile.followersCount || 0,
          followingCount: profile.followingCount || 0,
          accountVisibility: 'PRIVATE',
          isPrivateAccount: true,
          isFollowedByMe: false,
          isPending,
          followsMe,
          isOwner,
        });
      }

      // 4. Public Profile or Authorized Viewer response (respecting per-section toggles)
      const publicData: any = {
        id: targetUser.id,
        name: profile.fullName || targetUser.name,
        username: profile.username,
        role: targetUser.role,
        avatar: targetUser.avatar,
        profession: profile.profession,
        company: profile.company,
        jobTitle: profile.jobTitle,
        bio: profile.bio,
        followersCount: profile.followersCount || 0,
        followingCount: profile.followingCount || 0,
        accountVisibility: visibility,
        isPrivateAccount: false,
        isFollowedByMe,
        isPending,
        followsMe,
        isOwner,
      };

      if (isOwner || isAdmin || profile.locationVisible) {
        publicData.country = profile.country;
        publicData.state = profile.state;
        publicData.city = profile.city;
      }

      if (isOwner || isAdmin || profile.educationVisible) {
        publicData.highestDegree = profile.highestDegree;
        publicData.fieldOfStudy = profile.fieldOfStudy;
        publicData.institution = profile.institution;
        publicData.graduationYear = profile.graduationYear;
      }

      if (isOwner || isAdmin || profile.linkedinVisible) {
        publicData.linkedinUrl = profile.linkedinUrl;
      }

      if (isOwner || isAdmin || profile.showcaseVisible) {
        const [skills, achievements, experiences, certificates] = await Promise.all([
          prisma.userSkill.findMany({ where: { userId: targetUserId, hidden: false } }),
          prisma.achievement.findMany({ where: { userId: targetUserId }, orderBy: { date: 'desc' } }),
          prisma.experience.findMany({ where: { userId: targetUserId }, orderBy: { startDate: 'desc' } }),
          prisma.certificate.findMany({
            where: { userId: targetUserId },
            include: { course: { select: { title: true } } },
            orderBy: { issuedAt: 'desc' },
          }),
        ]);
        publicData.skills = skills;
        publicData.achievements = achievements;
        publicData.experiences = experiences;
        publicData.certificates = certificates;
      }

      // PII (phone, email, dateOfBirth) returned ONLY for owner or admin
      if (isOwner || isAdmin) {
        publicData.email = targetUser.email;
        publicData.phone = targetUser.phone;
        publicData.dateOfBirth = profile.dateOfBirth;
      }

      return res.json(publicData);
    } catch (err: any) {
      return ProfileController.handleControllerError(res, err);
    }
  }

  /**
   * PUT /api/profile/me/username
   * Update username with validation, reserved words check, and rate limit (2 changes / 30 days)
   */
  static async updateUsername(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ message: 'Unauthorized', code: 'USER_NOT_FOUND' });

      const userId = req.user.userId;
      const { username } = req.body;

      if (!username || typeof username !== 'string') {
        return res.status(400).json({ message: 'Username is required', code: 'VALIDATION_ERROR' });
      }

      const cleanUsername = username.toLowerCase().trim();

      // Format validation: 3-30 chars, letters, numbers, underscore, dot only
      const formatRegex = /^[a-z0-9._]{3,30}$/;
      if (!formatRegex.test(cleanUsername)) {
        return res.status(400).json({
          message: 'Username must be 3-30 characters long and contain only lowercase letters, numbers, dots, and underscores.',
          code: 'INVALID_USERNAME_FORMAT',
        });
      }

      // Reserved words check (case-insensitive)
      const reserved = [
        'admin', 'vantage', 'support', 'api', 'official', 'help', 'root',
        'null', 'undefined', 'system', 'login', 'register', 'dashboard',
        'catalog', 'courses', 'trainer', 'forum', 'profile', 'onboarding',
        'u', 'demo', 'settings', 'network',
      ];
      if (reserved.includes(cleanUsername)) {
        return res.status(400).json({
          message: `The username "${cleanUsername}" is reserved and cannot be used.`,
          code: 'RESERVED_USERNAME',
        });
      }

      // Resolve profile
      const { profile } = await ProfileController.getOrCreateUserProfile(userId);
      if (!profile) return res.status(404).json({ message: 'Profile not found', code: 'NOT_FOUND' });

      if (profile.username === cleanUsername) {
        return res.json({ message: 'Username unchanged', username: cleanUsername });
      }

      // Check username uniqueness
      const existing = await prisma.userProfile.findFirst({
        where: {
          username: cleanUsername,
          NOT: { userId },
        },
      });

      if (existing) {
        return res.status(400).json({ message: `Username "@${cleanUsername}" is already taken.`, code: 'USERNAME_TAKEN' });
      }

      // Rate limit check: Max 2 changes per 30 days
      const now = new Date();
      if (profile.lastUsernameChange) {
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        if (profile.lastUsernameChange > thirtyDaysAgo && profile.usernameChangeCount >= 2) {
          return res.status(400).json({
            message: 'You can only change your username 2 times per 30 days.',
            code: 'RATE_LIMIT_EXCEEDED',
          });
        }
      }

      const updated = await prisma.userProfile.update({
        where: { userId },
        data: {
          username: cleanUsername,
          lastUsernameChange: now,
          usernameChangeCount: (profile.usernameChangeCount || 0) + 1,
        },
      });

      return res.json({
        message: 'Username updated successfully',
        username: updated.username,
      });
    } catch (err: any) {
      return ProfileController.handleControllerError(res, err);
    }
  }

  /**
   * PUT /api/profile/me/visibility
   * Update account visibility (PUBLIC / PRIVATE). Switching to PUBLIC auto-accepts pending requests.
   */
  static async updateVisibility(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ message: 'Unauthorized', code: 'USER_NOT_FOUND' });

      const userId = req.user.userId;
      const { accountVisibility } = req.body;

      if (!accountVisibility || !['PUBLIC', 'PRIVATE'].includes(accountVisibility)) {
        return res.status(400).json({ message: 'accountVisibility must be PUBLIC or PRIVATE', code: 'VALIDATION_ERROR' });
      }

      const { profile } = await ProfileController.getOrCreateUserProfile(userId);
      if (!profile) return res.status(404).json({ message: 'Profile not found', code: 'NOT_FOUND' });

      const wasPrivate = profile.accountVisibility === 'PRIVATE';

      await prisma.$transaction(async (tx) => {
        await tx.userProfile.update({
          where: { userId },
          data: { accountVisibility },
        });

        // If switching from PRIVATE to PUBLIC, auto-accept all pending follow requests
        if (wasPrivate && accountVisibility === 'PUBLIC') {
          const pendingRequests = await tx.follow.findMany({
            where: { followingId: userId, status: 'PENDING' },
          });

          for (const reqRecord of pendingRequests) {
            await tx.follow.update({
              where: { id: reqRecord.id },
              data: { status: 'ACCEPTED' },
            });

            await tx.userProfile.update({
              where: { userId },
              data: { followersCount: { increment: 1 } },
            });

            await tx.userProfile.update({
              where: { userId: reqRecord.followerId },
              data: { followingCount: { increment: 1 } },
            });
          }
        }
      });

      return res.json({
        message: `Account visibility updated to ${accountVisibility}`,
        accountVisibility,
      });
    } catch (err: any) {
      return ProfileController.handleControllerError(res, err);
    }
  }
}
