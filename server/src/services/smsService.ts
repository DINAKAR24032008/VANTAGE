import crypto from 'crypto';
import bcrypt from 'bcryptjs';

export interface SmsMessagePayload {
  toPhone: string;
  message: string;
  templateId?: string;
  otpCode?: string;
}

export interface SmsResponse {
  success: boolean;
  provider: string;
  providerMessageId?: string;
  message: string;
  error?: string;
}

export class SmsService {
  /**
   * Helper: Generate a cryptographically secure 6-digit numeric OTP code.
   * Uses crypto.randomInt (100000 to 999999 inclusive).
   */
  static generateOtp(): string {
    return crypto.randomInt(100000, 1000000).toString();
  }

  /**
   * Helper: Hash OTP string using bcrypt for secure DB storage
   */
  static async hashOtp(otp: string): Promise<string> {
    return await bcrypt.hash(otp, 10);
  }

  /**
   * Helper: Verify plain OTP against hashed OTP using bcrypt
   */
  static async verifyOtpHash(plainOtp: string, hashedOtp: string): Promise<boolean> {
    return await bcrypt.compare(plainOtp, hashedOtp);
  }

  /**
   * Helper: Validate and normalize phone to E.164 standard (+918124925283)
   */
  static normalizeE164(phone: string, defaultCountryCode = '+91'): { isValid: boolean; formatted: string; reason?: string } {
    if (!phone || typeof phone !== 'string') {
      return { isValid: false, formatted: '', reason: 'Phone number is required' };
    }

    let clean = phone.trim().replace(/[\s\-\(\)]/g, '');
    if (!clean.startsWith('+')) {
      if (clean.length === 10) {
        clean = `${defaultCountryCode}${clean}`;
      } else {
        clean = `+${clean}`;
      }
    }

    // E.164 validation rules
    // For India (+91): Must be +91 followed by 10 digits starting with 6, 7, 8, or 9
    if (clean.startsWith('+91')) {
      const indianNumber = clean.slice(3);
      if (!/^[6-9]\d{9}$/.test(indianNumber)) {
        return {
          isValid: false,
          formatted: clean,
          reason: 'Invalid Indian mobile number. Must be 10 digits starting with 6, 7, 8, or 9.',
        };
      }
      return { isValid: true, formatted: clean };
    }

    // Generic international format (+ country code + 7-14 digits)
    if (!/^\+\d{10,15}$/.test(clean)) {
      return {
        isValid: false,
        formatted: clean,
        reason: 'Invalid E.164 phone format. Please provide a valid mobile number with country code.',
      };
    }

    return { isValid: true, formatted: clean };
  }

  /**
   * Send SMS via configured Provider (CONSOLE, TWILIO, MSG91, FAST2SMS)
   */
  static async sendSms(payload: SmsMessagePayload): Promise<SmsResponse> {
    const provider = process.env.SMS_PROVIDER || 'CONSOLE';
    const norm = SmsService.normalizeE164(payload.toPhone);
    const formattedPhone = norm.formatted || payload.toPhone;

    console.log(`\n=================== [SMS DISPATCHER] ===================`);
    console.log(`📱 Recipient    : ${formattedPhone}`);
    console.log(`⚙️ Provider     : ${provider}`);
    if (payload.otpCode) {
      console.log(`🔑 OTP Code     : ${payload.otpCode}`);
    }
    console.log(`💬 Message      : ${payload.message}`);
    console.log(`⏰ Timestamp    : ${new Date().toISOString()}`);
    console.log(`========================================================\n`);

    try {
      if (provider === 'TWILIO') {
        return await SmsService.sendTwilio(formattedPhone, payload.message);
      } else if (provider === 'MSG91') {
        return await SmsService.sendMsg91(formattedPhone, payload.message, payload.templateId);
      } else if (provider === 'FAST2SMS') {
        return await SmsService.sendFast2Sms(formattedPhone, payload.message);
      } else {
        // CONSOLE (default local dev simulation)
        return {
          success: true,
          provider: 'CONSOLE',
          providerMessageId: `sim-${Date.now()}`,
          message: payload.message,
        };
      }
    } catch (err: any) {
      console.error(`❌ [SMS ${provider} Failure]:`, err?.message || err);
      return {
        success: false,
        provider,
        message: payload.message,
        error: err?.message || 'Provider failed to deliver SMS',
      };
    }
  }

  /**
   * Twilio Provider Implementation
   */
  private static async sendTwilio(toPhone: string, message: string): Promise<SmsResponse> {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    const fromPhone = process.env.TWILIO_PHONE_NUMBER;

    if (!sid || !token || !fromPhone) {
      throw new Error('Twilio credentials missing in .env (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER required)');
    }

    const authHeader = 'Basic ' + Buffer.from(`${sid}:${token}`).toString('base64');
    const params = new URLSearchParams();
    params.append('To', toPhone);
    params.append('From', fromPhone);
    params.append('Body', message);

    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: 'POST',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const data: any = await res.json();
    if (!res.ok) {
      const twilioErrorMsg = data.message || `Twilio HTTP ${res.status}: ${res.statusText}`;
      console.error(`❌ [Twilio API Error ${data.code || res.status}]:`, twilioErrorMsg);
      throw new Error(`Twilio API Error (${data.code || res.status}): ${twilioErrorMsg}`);
    }

    return {
      success: true,
      provider: 'TWILIO',
      providerMessageId: data.sid,
      message,
    };
  }

  /**
   * MSG91 Provider Implementation (India DLT Compliant)
   */
  private static async sendMsg91(toPhone: string, message: string, templateId?: string): Promise<SmsResponse> {
    const authKey = process.env.MSG91_AUTH_KEY;
    const tplId = templateId || process.env.MSG91_TEMPLATE_ID;
    const senderId = process.env.MSG91_SENDER_ID || 'VANTAG';

    if (!authKey || !tplId) {
      throw new Error('MSG91 credentials missing in .env (MSG91_AUTH_KEY and MSG91_TEMPLATE_ID required)');
    }

    const cleanMobile = toPhone.replace(/^\+/, '');

    const bodyData = {
      template_id: tplId,
      sender: senderId,
      short_url: '1',
      recipients: [
        {
          mobiles: cleanMobile,
          message: message,
        },
      ],
    };

    const res = await fetch('https://control.msg91.com/api/v5/flow/', {
      method: 'POST',
      headers: {
        authkey: authKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify(bodyData),
    });

    const data: any = await res.json();
    if (!res.ok || data.type === 'error') {
      const msg91Err = data.message || `MSG91 error ${res.status}`;
      console.error('❌ [MSG91 Error]:', msg91Err);
      throw new Error(`MSG91 Error: ${msg91Err}`);
    }

    return {
      success: true,
      provider: 'MSG91',
      providerMessageId: data.request_id || `msg91-${Date.now()}`,
      message,
    };
  }

  /**
   * Fast2SMS Provider Implementation (Alternative India Gateway)
   */
  private static async sendFast2Sms(toPhone: string, message: string): Promise<SmsResponse> {
    const apiKey = process.env.FAST2SMS_API_KEY;
    if (!apiKey) {
      throw new Error('Fast2SMS credentials missing in .env (FAST2SMS_API_KEY required)');
    }

    const cleanNumbers = toPhone.replace(/^\+91/, '').replace(/^\+/, '');
    const res = await fetch(`https://www.fast2sms.com/dev/bulkV2?authorization=${apiKey}&route=q&message=${encodeURIComponent(message)}&flash=0&numbers=${cleanNumbers}`, {
      method: 'GET',
    });

    const data: any = await res.json();
    if (!res.ok || data.return === false) {
      const fastErr = data.message || 'Fast2SMS API call failed';
      console.error('❌ [Fast2SMS Error]:', fastErr);
      throw new Error(`Fast2SMS Error: ${fastErr}`);
    }

    return {
      success: true,
      provider: 'FAST2SMS',
      providerMessageId: data.request_id || `fast2sms-${Date.now()}`,
      message,
    };
  }
}
