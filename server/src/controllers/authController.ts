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
      });

      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      const isPasswordValid = await AuthService.verifyPassword(password, user.passwordHash);
      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Invalid email or password' });
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
          certificates: true,
        },
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
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
        profile: user.profile,
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
        },
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }
}
