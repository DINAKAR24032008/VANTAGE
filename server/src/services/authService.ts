import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { AuthUserPayload, UserRole } from '../types';

export const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'vantage_jwt_secret_sih26075_earth_sciences_key_2026';
const JWT_EXPIRES_IN = '7d';

export class AuthService {
  static async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }

  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  static generateToken(user: {
    id: string;
    email: string;
    role: string;
    name: string;
    department: string;
    jobRole: string;
  }): string {
    const payload: AuthUserPayload = {
      userId: user.id,
      email: user.email,
      role: user.role as UserRole,
      name: user.name,
      department: user.department,
      jobRole: user.jobRole,
    };

    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  }

  /**
   * SSO Abstraction Layer Stub
   * Extensible interface for Parichay / iGOT Karmayogi / Jan Parichay OAuth2
   */
  static async authenticateWithSSOStub(provider: string, ssoMockEmail: string) {
    // In production, this verifies OAuth2 code/token with Government Identity Provider
    let user = await prisma.user.findUnique({
      where: { email: ssoMockEmail },
    });

    if (!user) {
      const defaultHash = await this.hashPassword('SSO_Generated_Pass@2026');
      user = await prisma.user.create({
        data: {
          name: 'MoES Officer (SSO Verified)',
          email: ssoMockEmail,
          passwordHash: defaultHash,
          role: 'learner',
          department: 'Meteorological Department (IMD)',
          jobRole: 'Scientific Officer',
        },
      });
    }

    const token = this.generateToken(user);
    return { user, token, provider };
  }
}
