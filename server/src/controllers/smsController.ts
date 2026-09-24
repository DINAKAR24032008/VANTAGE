import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { prisma } from '../services/authService';
import { SmsService } from '../services/smsService';

export class SmsController {
  /**
   * POST /api/otp/send & POST /api/sms/send-otp
   * Generate, hash, and dispatch a 6-digit OTP code to phone number.
   * Rate limits:
   *  - 60s cooldown between resends
   *  - Max 3 sends per 10 minutes
   */
  static async sendOtp(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required', code: 'UNAUTHORIZED' });
      }

      const { phone } = req.body;
      const norm = SmsService.normalizeE164(phone);
      if (!norm.isValid) {
        return res.status(400).json({
          message: norm.reason || 'Invalid phone format. Please provide a valid mobile number.',
          code: 'INVALID_PHONE',
        });
      }

      const formattedPhone = norm.formatted;
      const currentUserId = req.user.userId;

      const SIXTY_SECS_AGO = new Date(Date.now() - 60 * 1000);
      const TEN_MINS_AGO = new Date(Date.now() - 10 * 60 * 1000);

      // 1. 60-second cooldown check
      const recentResend = await prisma.otpCode.findFirst({
        where: {
          OR: [{ userId: currentUserId }, { phone: formattedPhone }],
          createdAt: { gte: SIXTY_SECS_AGO },
        },
      });

      if (recentResend) {
        return res.status(429).json({
          message: 'Please wait 60 seconds before requesting another verification code.',
          code: 'RATE_LIMITED',
        });
      }

      // 2. 10-minute (3 max sends) rate limit check
      const tenMinCount = await prisma.otpCode.count({
        where: {
          OR: [{ userId: currentUserId }, { phone: formattedPhone }],
          createdAt: { gte: TEN_MINS_AGO },
        },
      });

      if (tenMinCount >= 3) {
        return res.status(429).json({
          message: 'OTP request rate limit reached. Maximum 3 verification codes per 10 minutes.',
          code: 'RATE_LIMITED',
        });
      }

      // 3. Account duplication check (phone registered & verified elsewhere)
      const existingUser = await prisma.user.findFirst({
        where: {
          phone: formattedPhone,
          phoneVerified: true,
          id: { not: currentUserId },
        },
      });

      if (existingUser) {
        return res.status(400).json({
          message: 'This mobile number is already registered and verified on another account.',
          code: 'INVALID_PHONE',
        });
      }

      // 4. Generate cryptographically secure 6-digit OTP & bcrypt hash
      const plainOtp = SmsService.generateOtp();
      const codeHash = await SmsService.hashOtp(plainOtp);
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

      // Store in OtpCode table
      await prisma.otpCode.create({
        data: {
          userId: currentUserId,
          phone: formattedPhone,
          codeHash,
          purpose: 'VERIFY_PHONE',
          expiresAt,
          attempts: 0,
        },
      });

      // 5. Dispatch SMS via configured provider
      const smsMessage = `[Vantage] Your verification code is: ${plainOtp}. Valid for 5 minutes. Do not share this code with anyone.`;
      const sendResult = await SmsService.sendSms({
        toPhone: formattedPhone,
        message: smsMessage,
        otpCode: plainOtp,
      });

      // Log delivery status in NotificationLog
      await prisma.notificationLog.create({
        data: {
          userId: currentUserId,
          channel: 'SMS',
          recipient: formattedPhone,
          message: `OTP Code Sent`,
          provider: sendResult.provider,
          providerMessageId: sendResult.providerMessageId || null,
          status: sendResult.success ? 'SENT' : 'FAILED',
        },
      });

      // 6. Strict check: If provider fails, return PROVIDER_FAILED error (Do NOT swallow error!)
      if (!sendResult.success) {
        return res.status(502).json({
          message: sendResult.error || 'SMS provider failed to deliver OTP message.',
          code: 'PROVIDER_FAILED',
          provider: sendResult.provider,
        });
      }

      return res.json({
        success: true,
        message: `Verification code sent to ${formattedPhone}`,
        phone: formattedPhone,
        expiresInSeconds: 300,
      });
    } catch (err: any) {
      console.error('[SendOTP Error]:', err);
      return res.status(500).json({ message: 'Failed to send verification code', code: 'SERVER_ERROR' });
    }
  }

  /**
   * POST /api/otp/verify & POST /api/sms/verify-otp
   * Verify 6-digit OTP code, mark phone verified, and enable SMS alerts.
   */
  static async verifyOtp(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required', code: 'UNAUTHORIZED' });
      }

      const { phone, otp } = req.body;
      if (!phone || !otp) {
        return res.status(400).json({ message: 'Phone number and OTP code are required', code: 'OTP_INVALID' });
      }

      const norm = SmsService.normalizeE164(phone);
      const formattedPhone = norm.formatted || String(phone).trim();
      const cleanOtp = String(otp).trim();
      const currentUserId = req.user.userId;

      // Find latest unconsumed OTP record
      const otpRecord = await prisma.otpCode.findFirst({
        where: {
          phone: formattedPhone,
          purpose: 'VERIFY_PHONE',
          consumedAt: null,
        },
        orderBy: { createdAt: 'desc' },
      });

      if (!otpRecord) {
        return res.status(400).json({
          message: 'No active verification code found for this phone number. Please request a new code.',
          code: 'OTP_INVALID',
        });
      }

      // 1. Check expiry
      if (new Date() > new Date(otpRecord.expiresAt)) {
        return res.status(400).json({
          message: 'Verification code has expired. Please request a new code.',
          code: 'OTP_EXPIRED',
        });
      }

      // 2. Lockout check (5 failed attempts)
      if (otpRecord.attempts >= 5) {
        return res.status(400).json({
          message: 'Too many failed verification attempts. This code has been locked for 15 minutes.',
          code: 'TOO_MANY_ATTEMPTS',
        });
      }

      // 3. Compare hash
      const isValid = await SmsService.verifyOtpHash(cleanOtp, otpRecord.codeHash);

      if (!isValid) {
        // Increment attempt count
        const updatedRecord = await prisma.otpCode.update({
          where: { id: otpRecord.id },
          data: { attempts: { increment: 1 } },
        });

        if (updatedRecord.attempts >= 5) {
          return res.status(400).json({
            message: 'Too many failed attempts. Code locked for 15 minutes. Please request a new code.',
            code: 'TOO_MANY_ATTEMPTS',
          });
        }

        const remainingAttempts = 5 - updatedRecord.attempts;
        return res.status(400).json({
          message: `Invalid verification code. ${remainingAttempts} attempt${remainingAttempts === 1 ? '' : 's'} remaining.`,
          code: 'OTP_INVALID',
        });
      }

      // 4. Mark OTP as consumed (one-time use)
      await prisma.otpCode.update({
        where: { id: otpRecord.id },
        data: { consumedAt: new Date() },
      });

      // 5. Update User profile with verified phone
      await prisma.user.update({
        where: { id: currentUserId },
        data: {
          phone: formattedPhone,
          phoneVerified: true,
          phoneVerifiedAt: new Date(),
        },
      });

      // 6. Enable SMS Alerts in NotificationPreference
      await prisma.notificationPreference.upsert({
        where: { userId: currentUserId },
        update: { smsEnabled: true },
        create: {
          userId: currentUserId,
          smsEnabled: true,
          dailyReminderEnabled: true,
          inAppEnabled: true,
        },
      });

      return res.json({
        success: true,
        message: 'Mobile number verified, SMS alerts enabled',
        phone: formattedPhone,
        phoneVerified: true,
      });
    } catch (err: any) {
      console.error('[VerifyOTP Error]:', err);
      return res.status(500).json({ message: 'Failed to verify OTP code', code: 'SERVER_ERROR' });
    }
  }

  /**
   * POST /api/sms/webhook
   * Opt-out webhook for SMS providers (Twilio / MSG91 incoming SMS)
   */
  static async handleWebhook(req: any, res: Response) {
    try {
      const fromPhone = req.body?.From || req.body?.mobile || req.body?.sender || '';
      const bodyText = req.body?.Body || req.body?.text || req.body?.message || '';

      console.log(`📩 [SMS Webhook Received] From: ${fromPhone} | Body: "${bodyText}"`);

      if (fromPhone && /STOP|CANCEL|UNSUBSCRIBE|QUIT|OPT\s*OUT/i.test(bodyText)) {
        const norm = SmsService.normalizeE164(fromPhone);
        const formattedPhone = norm.formatted || fromPhone;

        const user = await prisma.user.findFirst({
          where: { phone: formattedPhone },
        });

        if (user) {
          await prisma.notificationPreference.updateMany({
            where: { userId: user.id },
            data: { smsEnabled: false },
          });

          await prisma.notificationLog.create({
            data: {
              userId: user.id,
              channel: 'SMS',
              recipient: formattedPhone,
              message: `User opted out via SMS reply (${bodyText})`,
              provider: 'WEBHOOK_STOP',
              status: 'OPT_OUT',
            },
          });
          console.log(`✅ User ${user.id} (${formattedPhone}) opted out of SMS alerts.`);
        }
      }

      res.type('text/xml');
      return res.send('<Response></Response>');
    } catch (err: any) {
      console.error('[SMS Webhook Error]:', err);
      return res.status(500).send('<Response></Response>');
    }
  }
}
