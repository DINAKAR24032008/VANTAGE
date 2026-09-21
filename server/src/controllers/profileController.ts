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
  // Strip query parameters and trailing slash
  try {
    const parsed = new URL(trimmed);
    parsed.search = '';
    parsed.hash = '';
    let href = parsed.toString().replace(/\/$/, '');
    
    // Validate format: https://(www.|[a-z]{2}\.)linkedin.com/in/<handle>
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
  
  // Required fields weight: 60%
  let score = 0;
  if (profile.fullName && profile.fullName.trim()) score += 15;
  if (profile.country && profile.country.trim()) score += 15;
  if (profile.city && profile.city.trim()) score += 15;
  if (profile.profession && profile.profession !== 'OTHER') score += 15;
  
  // Optional details weight: 40%
  if (profile.bio && profile.bio.trim()) score += 10;
  if (profile.highestDegree && profile.highestDegree !== 'NONE') score += 10;
  if (profile.linkedinUrl && profile.linkedinUrl.trim()) score += 10;
  if (profile.company || profile.institution) score += 10;

  return Math.min(100, score);
};

export class ProfileController {
  // Ensure profile exists for user
  static async getOrCreateUserProfile(userId: string, userName: string, userRole: string) {
    let profile = await prisma.userProfile.findUnique({ where: { userId } });
    if (!profile) {
      const isTrainer = userRole === 'trainer';
      profile = await prisma.userProfile.create({
        data: {
          userId,
          fullName: userName || 'Vantage Learner',
          country: 'India',
          city: '',
          profession: isTrainer ? 'WORKING_PROFESSIONAL' : 'STUDENT',
          showcaseVisible: isTrainer,
          linkedinVisible: isTrainer,
          profileCompleted: false,
        },
      });
    }
    return profile;
  }

  // GET /api/profile/me
  static async getMyProfile(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
      const userId = req.user.userId;

      let profile = await ProfileController.getOrCreateUserProfile(userId, req.user.name, req.user.role);

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
      return res.status(500).json({ error: err.message });
    }
  }

  // PUT /api/profile/me
  static async updateMyProfile(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
      const userId = req.user.userId;

      await ProfileController.getOrCreateUserProfile(userId, req.user.name, req.user.role);

      const body = req.body;
      const dataToUpdate: any = {};

      if (body.fullName !== undefined) dataToUpdate.fullName = sanitizeText(body.fullName, 100) || req.user.name;
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
      return res.status(500).json({ error: err.message });
    }
  }

  // POST /api/profile/me/complete
  static async completeProfile(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
      const userId = req.user.userId;

      let profile = await ProfileController.getOrCreateUserProfile(userId, req.user.name, req.user.role);

      // Validate required fields
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
      return res.status(500).json({ error: err.message });
    }
  }

  // GET/PUT /api/profile/me/linkedin
  static async updateLinkedin(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
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
      return res.status(500).json({ error: err.message });
    }
  }

  // Skills handlers
  static async getSkills(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
      const skills = await prisma.userSkill.findMany({ where: { userId: req.user.userId } });
      return res.json(skills);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  static async updateSkills(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
      const userId = req.user.userId;
      const { skills } = req.body; // Array of { name, level, hidden? }

      if (!Array.isArray(skills)) {
        return res.status(400).json({ error: 'Skills must be an array' });
      }

      if (skills.length > 20) {
        return res.status(400).json({ error: 'Maximum 20 skills allowed per profile' });
      }

      // Preserve VANTAGE source for existing skills
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
      return res.status(500).json({ error: err.message });
    }
  }

  // Achievements handlers
  static async getAchievements(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
      const items = await prisma.achievement.findMany({ where: { userId: req.user.userId }, orderBy: { date: 'desc' } });
      return res.json(items);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  static async addAchievement(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
      const userId = req.user.userId;

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
      return res.status(500).json({ error: err.message });
    }
  }

  static async updateAchievement(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
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
      return res.status(500).json({ error: err.message });
    }
  }

  static async deleteAchievement(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
      const id = String(req.params.id);

      const existing = await prisma.achievement.findFirst({ where: { id, userId: req.user.userId } });
      if (!existing) return res.status(404).json({ error: 'Achievement not found' });

      await prisma.achievement.delete({ where: { id } });
      return res.json({ message: 'Achievement deleted' });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  // Experience handlers
  static async getExperiences(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
      const items = await prisma.experience.findMany({ where: { userId: req.user.userId }, orderBy: { startDate: 'desc' } });
      return res.json(items);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  static async addExperience(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
      const userId = req.user.userId;

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
      return res.status(500).json({ error: err.message });
    }
  }

  static async updateExperience(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
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
      return res.status(500).json({ error: err.message });
    }
  }

  static async deleteExperience(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
      const id = String(req.params.id);

      const existing = await prisma.experience.findFirst({ where: { id, userId: req.user.userId } });
      if (!existing) return res.status(404).json({ error: 'Experience entry not found' });

      await prisma.experience.delete({ where: { id } });
      return res.json({ message: 'Experience deleted' });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
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

      let profile = await ProfileController.getOrCreateUserProfile(targetUser.id, targetUser.name, targetUser.role);

      const isSelf = requester?.userId === targetUserId;
      const isAdmin = requester?.role === 'admin';

      // Check if requester is a trainer of this user
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

      // Privacy rules filtering
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

      // Location filtering
      if (isSelf || isAdmin || profile.locationVisible || isTrainerOfUser) {
        publicData.country = profile.country;
        publicData.state = profile.state;
        publicData.city = profile.city;
      }

      // Education filtering
      if (isSelf || isAdmin || profile.educationVisible || isTrainerOfUser) {
        publicData.highestDegree = profile.highestDegree;
        publicData.fieldOfStudy = profile.fieldOfStudy;
        publicData.institution = profile.institution;
        publicData.graduationYear = profile.graduationYear;
      }

      // LinkedIn filtering (NEVER exposed if linkedinVisible is false unless self/admin)
      if (isSelf || isAdmin || profile.linkedinVisible) {
        publicData.linkedinUrl = profile.linkedinUrl;
      }

      // Career Showcase filtering (skills, achievements, experience, certificates)
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
      return res.status(500).json({ error: err.message });
    }
  }
}
