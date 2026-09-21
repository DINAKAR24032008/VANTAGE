import { Request, Response } from 'express';
import { z } from 'zod';
import { AuthService, prisma } from '../services/authService';
import { AuthenticatedRequest } from '../types';

const RegisterSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['admin', 'trainer', 'learner']).default('learner'),
  department: z.string().min(2, 'Department is required'),
  jobRole: z.string().min(2, 'Job role is required'),
});

const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export class AuthController {
  static async register(req: Request, res: Response) {
    try {
      const validated = RegisterSchema.parse(req.body);

      const existingUser = await prisma.user.findUnique({
        where: { email: validated.email },
      });

      if (existingUser) {
        return res.status(400).json({ error: 'A user with this email already exists' });
      }

      const passwordHash = await AuthService.hashPassword(validated.password);

      const user = await prisma.user.create({
        data: {
          name: validated.name,
          email: validated.email,
          passwordHash,
          role: validated.role,
          department: validated.department,
          jobRole: validated.jobRole,
        },
      });

      // Initialize userProfile for all new users
      const userProfile = await prisma.userProfile.create({
        data: {
          userId: user.id,
          fullName: user.name,
          country: 'India',
          city: '',
          profession: user.role === 'trainer' ? 'WORKING_PROFESSIONAL' : 'STUDENT',
          showcaseVisible: user.role === 'trainer',
          linkedinVisible: user.role === 'trainer',
          profileCompleted: false,
        },
      });

      // Initialize empty competency profile for learners
      if (user.role === 'learner') {
        await prisma.competencyProfile.create({
          data: {
            userId: user.id,
            skills: JSON.stringify([]),
          },
        });
      }

      const token = AuthService.generateToken(user);

      return res.status(201).json({
        message: 'Registration successful',
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          department: user.department,
          jobRole: user.jobRole,
          gender: user.gender,
          avatar: user.avatar,
          phone: user.phone,
          phoneVerified: user.phoneVerified,
          timezone: user.timezone,
          profileCompleted: userProfile.profileCompleted,
        },
      });
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ error: err.errors[0].message });
      }
      return res.status(500).json({ error: err.message || 'Registration failed' });
    }
  }

  static async login(req: Request, res: Response) {
    try {
      const { email, password } = LoginSchema.parse(req.body);

      const user = await prisma.user.findUnique({
        where: { email },
        include: { userProfile: true },
      });

      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      const isPasswordValid = await AuthService.verifyPassword(password, user.passwordHash);
      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      let profileCompleted = user.userProfile ? user.userProfile.profileCompleted : false;
      if (!user.userProfile) {
        const up = await prisma.userProfile.create({
          data: {
            userId: user.id,
            fullName: user.name,
            country: 'India',
            city: '',
            profession: user.role === 'trainer' ? 'WORKING_PROFESSIONAL' : 'STUDENT',
            showcaseVisible: user.role === 'trainer',
            linkedinVisible: user.role === 'trainer',
            profileCompleted: false,
          },
        });
        profileCompleted = up.profileCompleted;
      }

      const token = AuthService.generateToken(user);

      return res.json({
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          department: user.department,
          jobRole: user.jobRole,
          gender: user.gender,
          avatar: user.avatar,
          phone: user.phone,
          phoneVerified: user.phoneVerified,
          timezone: user.timezone,
          profileCompleted,
        },
      });
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ error: err.errors[0].message });
      }
      return res.status(500).json({ error: err.message || 'Login failed' });
    }
  }

  static async getMe(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
        include: {
          profile: true,
          userProfile: true,
          certificates: true,
        },
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      let userProf = user.userProfile;
      if (!userProf) {
        userProf = await prisma.userProfile.create({
          data: {
            userId: user.id,
            fullName: user.name,
            country: 'India',
            city: '',
            profession: user.role === 'trainer' ? 'WORKING_PROFESSIONAL' : 'STUDENT',
            showcaseVisible: user.role === 'trainer',
            linkedinVisible: user.role === 'trainer',
            profileCompleted: false,
          },
        });
      }

      return res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        jobRole: user.jobRole,
        gender: user.gender,
        avatar: user.avatar,
        phone: user.phone,
        phoneVerified: user.phoneVerified,
        timezone: user.timezone,
        profileCompleted: userProf.profileCompleted,
        profile: user.profile,
        userProfile: userProf,
        certificates: user.certificates,
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  static async ssoMockLogin(req: Request, res: Response) {
    try {
      const { provider = 'iGOT_Karmayogi', email = 'officer.sso@gov.in' } = req.body;
      const result = await AuthService.authenticateWithSSOStub(provider, email);

      const userProf = await prisma.userProfile.findUnique({ where: { userId: result.user.id } });

      return res.json({
        message: `Successfully authenticated via ${provider} (SSO Stub)`,
        token: result.token,
        user: {
          id: result.user.id,
          name: result.user.name,
          email: result.user.email,
          role: result.user.role,
          department: result.user.department,
          jobRole: result.user.jobRole,
          gender: result.user.gender,
          avatar: result.user.avatar,
          phone: result.user.phone,
          phoneVerified: result.user.phoneVerified,
          timezone: result.user.timezone,
          profileCompleted: userProf ? userProf.profileCompleted : false,
        },
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }
}
