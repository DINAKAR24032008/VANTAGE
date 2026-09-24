import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Clock, Smartphone, Moon, Sparkles, Check, AlertCircle, ShieldCheck, RefreshCw } from 'lucide-react';
import { NotificationPreferenceData } from '../types';
import api from '../services/api';
import { HeadingEmoji } from './HeadingEmoji';

const TIMEZONE_OPTIONS = [
  'Asia/Kolkata',
  'UTC',
  'America/New_York',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Asia/Tokyo',
  'Australia/Sydney',
];

const COUNTRY_CODES = [
  { code: '+91', label: '🇮🇳 India (+91)' },
  { code: '+1', label: '🇺🇸 USA/Canada (+1)' },
  { code: '+44', label: '🇬🇧 UK (+44)' },
  { code: '+61', label: '🇦🇺 Australia (+61)' },
  { code: '+81', label: '🇯🇵 Japan (+81)' },
  { code: '+49', label: '🇩🇪 Germany (+49)' },
  { code: '+33', label: '🇫🇷 France (+33)' },
  { code: '+971', label: '🇦🇪 UAE (+971)' },
  { code: '+65', label: '🇸🇬 Singapore (+65)' },
];

export const NotificationSettings: React.FC = () => {
  const [pref, setPref] = useState<NotificationPreferenceData>({
    inAppEnabled: true,
    smsEnabled: false,
    dailyReminderEnabled: true,
    reminderTime: '09:00',
    timezone: 'Asia/Kolkata',
    quietHoursStart: '22:00',
    quietHoursEnd: '07:00',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Mobile & OTP States
  const [countryCode, setCountryCode] = useState('+91');
  const [mobileNumber, setMobileNumber] = useState('');
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [verifiedPhone, setVerifiedPhone] = useState<string | null>(null);
  const [isEditingPhone, setIsEditingPhone] = useState(false);

  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [smsError, setSmsError] = useState<string | null>(null);
  const [smsSuccess, setSmsSuccess] = useState<string | null>(null);

  // useRef to manage timer cleanly across re-renders and unmounts
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startCountdownTimer = (seconds: number = 60) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setCountdown(seconds);
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          timerRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [prefRes, userRes] = await Promise.all([
          api.get('/notifications/preferences'),
          api.get('/auth/me').catch(() => null),
        ]);

        if (prefRes.data) {
          const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata';
          setPref({
            inAppEnabled: prefRes.data.inAppEnabled ?? true,
            smsEnabled: prefRes.data.smsEnabled ?? false,
            dailyReminderEnabled: prefRes.data.dailyReminderEnabled ?? true,
            reminderTime: prefRes.data.reminderTime || '09:00',
            timezone: prefRes.data.timezone || browserTz,
            quietHoursStart: prefRes.data.quietHoursStart || '22:00',
            quietHoursEnd: prefRes.data.quietHoursEnd || '07:00',
            lastReminderSentOn: prefRes.data.lastReminderSentOn,
          });
        }

        if (userRes?.data?.user) {
          const u = userRes.data.user;
          if (u.phone) {
            setVerifiedPhone(u.phone);
            const matchedCode = COUNTRY_CODES.find((c) => u.phone.startsWith(c.code));
            if (matchedCode) {
              setCountryCode(matchedCode.code);
              setMobileNumber(u.phone.replace(matchedCode.code, ''));
            } else {
              setMobileNumber(u.phone.replace(/^\+/, ''));
            }
          }
          setPhoneVerified(Boolean(u.phoneVerified));
        }
      } catch (err: any) {
        console.error('Failed to load notification settings:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const normalizeTime = (val: string) => {
    if (!val) return '09:00';
    let str = val.trim();
    if (/^([0-1][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/.test(str)) {
      str = str.slice(0, 5);
    }
    if (/^[0-9]:[0-5][0-9]$/.test(str)) {
      str = '0' + str;
    }
    return str;
  };

  const fullPhoneNumber = `${countryCode}${mobileNumber.trim()}`;

  const handleSendOtp = async () => {
    setSmsError(null);
    setSmsSuccess(null);

    const cleanNum = mobileNumber.replace(/\D/g, '');
    if (cleanNum.length < 10) {
      setSmsError('Please enter a valid 10-digit mobile number.');
      return;
    }

    try {
      setSendingOtp(true);
      // Call POST /api/otp/send
      const res = await api.post('/otp/send', { phone: fullPhoneNumber });

      if (res.data?.success) {
        setOtpSent(true);
        startCountdownTimer(60); // 60s cooldown timer
        setSmsSuccess(`Verification code sent to ${fullPhoneNumber}`);
      }
    } catch (err: any) {
      const serverErr = err.response?.data?.message || err.response?.data?.error || err.message;
      setSmsError(serverErr || 'Failed to send verification code');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    setSmsError(null);
    setSmsSuccess(null);

    if (!otpCode || otpCode.trim().length !== 6) {
      setSmsError('Please enter the 6-digit verification code.');
      return;
    }

    try {
      setVerifyingOtp(true);
      // Call POST /api/otp/verify
      const res = await api.post('/otp/verify', {
        phone: fullPhoneNumber,
        otp: otpCode.trim(),
      });

      if (res.data?.success) {
        setPhoneVerified(true);
        setVerifiedPhone(fullPhoneNumber);
        setPref((prev) => ({ ...prev, smsEnabled: true }));
        setOtpSent(false);
        setOtpCode('');
        setIsEditingPhone(false);
        setSmsSuccess('Mobile number verified, SMS alerts enabled ✓');
      }
    } catch (err: any) {
      const serverErr = err.response?.data?.message || err.response?.data?.error || err.message;
      setSmsError(serverErr || 'Failed to verify OTP code');
    } finally {
      setVerifyingOtp(false);
    }
  };

  // Auto-submit OTP when 6 digits are typed
  const handleOtpInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
    setOtpCode(val);
    if (val.length === 6 && !verifyingOtp) {
      // Auto verify when 6 digits entered
      setTimeout(() => {
        handleVerifyOtpWithCode(val);
      }, 100);
    }
  };

  const handleVerifyOtpWithCode = async (code: string) => {
    setSmsError(null);
    setSmsSuccess(null);
    try {
      setVerifyingOtp(true);
      const res = await api.post('/otp/verify', {
        phone: fullPhoneNumber,
        otp: code,
      });

      if (res.data?.success) {
        setPhoneVerified(true);
        setVerifiedPhone(fullPhoneNumber);
        setPref((prev) => ({ ...prev, smsEnabled: true }));
        setOtpSent(false);
        setOtpCode('');
        setIsEditingPhone(false);
        setSmsSuccess('Mobile number verified, SMS alerts enabled ✓');
      }
    } catch (err: any) {
      const serverErr = err.response?.data?.message || err.response?.data?.error || err.message;
      setSmsError(serverErr || 'Failed to verify OTP code');
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      setSaving(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      if (pref.smsEnabled && !phoneVerified) {
        setErrorMsg('Verify your mobile number to enable SMS alerts.');
        setSaving(false);
        return;
      }

      const payload = {
        inAppEnabled: Boolean(pref.inAppEnabled),
        smsEnabled: Boolean(pref.smsEnabled),
        dailyReminderEnabled: Boolean(pref.dailyReminderEnabled),
        reminderTime: normalizeTime(pref.reminderTime),
        timezone: pref.timezone || 'Asia/Kolkata',
        quietHoursStart: normalizeTime(pref.quietHoursStart),
        quietHoursEnd: normalizeTime(pref.quietHoursEnd),
      };

      const res = await api.put('/notifications/preferences', payload);
      if (res.data) {
        setPref({
          inAppEnabled: res.data.inAppEnabled ?? true,
          smsEnabled: res.data.smsEnabled ?? false,
          dailyReminderEnabled: res.data.dailyReminderEnabled ?? true,
          reminderTime: res.data.reminderTime || '09:00',
          timezone: res.data.timezone || 'Asia/Kolkata',
          quietHoursStart: res.data.quietHoursStart || '22:00',
          quietHoursEnd: res.data.quietHoursEnd || '07:00',
          lastReminderSentOn: res.data.lastReminderSentOn,
        });
      }
      setSuccessMsg('Notification preferences updated successfully!');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      const serverMessage = err.response?.data?.message || err.response?.data?.error || err.message;
      setErrorMsg(serverMessage || 'Failed to save notification preferences');
    } finally {
      setSaving(false);
    }
  };

  const format12Hour = (timeStr: string) => {
    if (!timeStr) return '9:00 AM';
    const [h, m] = timeStr.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 === 0 ? 12 : h % 12;
    return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
  };

  if (loading) {
    return (
      <div className="bg-surface p-5 rounded-2xl border border-border shadow-paper-sm flex items-center justify-center py-8">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const activeChannels: string[] = [];
  if (pref.inAppEnabled) activeChannels.push('In-App Bell');
  if (pref.smsEnabled && phoneVerified) activeChannels.push('SMS Alerts');

  return (
    <div className="bg-surface p-5 sm:p-6 rounded-2xl border border-border shadow-paper-sm space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-textPrimary flex items-center gap-2">
            <HeadingEmoji emoji="🔔" /> Reminders & Notification Preferences
          </h3>
          <p className="text-xs text-textSecondary mt-0.5">
            Customize daily course reminder schedules, quiet hours, and alert channels.
          </p>
        </div>

        {/* Demo Mode Action Link */}
        <Link
          to="/demo/reminders"
          className="px-3 py-1.5 bg-accentSoft text-accent border border-accent/30 rounded-xl text-xs font-bold hover:bg-accent/20 transition flex items-center gap-1.5 shadow-paper-sm"
        >
          <Sparkles className="w-3.5 h-3.5 text-accent" />
          Reminder Demo
        </Link>
      </div>

      {/* Messages */}
      {successMsg && (
        <div className="p-3 bg-primarySoft border border-primary/30 text-primary text-xs rounded-xl flex items-center gap-2">
          <Check className="w-4 h-4 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-dangerSoft border border-danger/30 text-danger text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSave} className="space-y-4">
        {/* Live Preview Banner */}
        <div className="p-3.5 bg-surface2 rounded-xl border border-border flex items-center gap-2.5">
          <Clock className="w-4 h-4 text-primary flex-shrink-0" />
          <span className="text-xs text-textPrimary font-semibold">
            Preview:{' '}
            {pref.dailyReminderEnabled ? (
              <span>
                You'll get one reminder every day at <strong className="text-primary">{format12Hour(pref.reminderTime)}</strong> ({pref.timezone})
                {activeChannels.length > 0 ? (
                  <span> via <strong className="text-primary">{activeChannels.join(' + ')}</strong>.</span>
                ) : (
                  <span> (No active channels selected).</span>
                )}
              </span>
            ) : (
              <span className="text-textSecondary italic">Daily reminders are currently turned OFF.</span>
            )}
          </span>
        </div>

        {/* Channel Toggles */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Daily Reminder Toggle */}
          <label className="p-3.5 bg-surface2 rounded-xl border border-border flex items-start justify-between cursor-pointer hover:border-primary/40 transition">
            <div className="flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-primary" />
              <div>
                <span className="text-xs font-bold text-textPrimary block">Daily Reminders</span>
                <span className="text-[10px] text-textSecondary">Smart course progress alerts</span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={pref.dailyReminderEnabled}
              onChange={(e) => setPref({ ...pref, dailyReminderEnabled: e.target.checked })}
              className="mt-0.5 rounded border-border text-primary focus:ring-primary"
            />
          </label>

          {/* In-App Bell Toggle */}
          <label className="p-3.5 bg-surface2 rounded-xl border border-border flex items-start justify-between cursor-pointer hover:border-primary/40 transition">
            <div className="flex items-center gap-2.5">
              <Bell className="w-4 h-4 text-primary" />
              <div>
                <span className="text-xs font-bold text-textPrimary block">In-App Bell</span>
                <span className="text-[10px] text-textSecondary">Header badge & toast popups</span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={pref.inAppEnabled}
              onChange={(e) => setPref({ ...pref, inAppEnabled: e.target.checked })}
              className="mt-0.5 rounded border-border text-primary focus:ring-primary"
            />
          </label>

          {/* SMS Toggle */}
          <label className="p-3.5 bg-surface2 rounded-xl border border-border flex items-start justify-between cursor-pointer hover:border-primary/40 transition">
            <div className="flex items-center gap-2.5">
              <Smartphone className="w-4 h-4 text-primary" />
              <div>
                <span className="text-xs font-bold text-textPrimary block">SMS Alerts</span>
                <span className="text-[10px] text-textSecondary">
                  {phoneVerified ? 'Verified ✓' : 'Requires verified mobile'}
                </span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={pref.smsEnabled}
              onChange={(e) => {
                const checked = e.target.checked;
                setPref({ ...pref, smsEnabled: checked });
                if (checked && !phoneVerified) {
                  setErrorMsg('Verify your mobile number to enable SMS alerts.');
                } else {
                  setErrorMsg(null);
                }
              }}
              className="mt-0.5 rounded border-border text-primary focus:ring-primary"
            />
          </label>
        </div>

        {/* Mobile Verification Panel */}
        <div className="p-4 bg-surface2 rounded-xl border border-border space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-textPrimary flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-primary" /> Mobile Number & Verification
            </span>
            {phoneVerified && !isEditingPhone && (
              <span className="px-2.5 py-0.5 bg-primarySoft text-primary border border-primary/30 rounded-full text-[11px] font-bold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Verified ✓
              </span>
            )}
          </div>

          {/* Phone Input Row */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="flex items-center gap-2 flex-1">
              {/* Country Code Dropdown */}
              <select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                disabled={phoneVerified && !isEditingPhone}
                className="px-2.5 py-1.5 bg-surface border border-border rounded-xl text-xs text-textPrimary focus:outline-none focus:border-primary disabled:opacity-60"
              >
                {COUNTRY_CODES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label}
                  </option>
                ))}
              </select>

              {/* 10-Digit Mobile Input */}
              <input
                type="tel"
                inputMode="numeric"
                placeholder="10-digit mobile number"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                disabled={phoneVerified && !isEditingPhone}
                className="flex-1 px-3 py-1.5 bg-surface border border-border rounded-xl text-xs text-textPrimary focus:outline-none focus:border-primary disabled:opacity-60 font-mono"
              />
            </div>

            {/* Action Buttons */}
            {phoneVerified && !isEditingPhone ? (
              <button
                type="button"
                onClick={() => {
                  setIsEditingPhone(true);
                  setPhoneVerified(false);
                  setOtpSent(false);
                  setOtpCode('');
                  setSmsError(null);
                  setSmsSuccess(null);
                }}
                className="px-3 py-1.5 bg-surface border border-border hover:border-primary/40 text-textSecondary hover:text-textPrimary rounded-xl text-xs font-semibold transition flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" /> Change Number
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={sendingOtp || countdown > 0 || mobileNumber.length < 10}
                className="px-3.5 py-1.5 bg-primary hover:bg-primaryHover text-primaryContrast rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {sendingOtp ? (
                  <span className="w-3.5 h-3.5 border-2 border-primaryContrast border-t-transparent rounded-full animate-spin" />
                ) : countdown > 0 ? (
                  `Resend in ${countdown}s`
                ) : (
                  'Send OTP'
                )}
              </button>
            )}
          </div>

          {/* OTP Input Form when OTP sent */}
          {otpSent && (!phoneVerified || isEditingPhone) && (
            <div className="p-3 bg-surface rounded-xl border border-primary/30 space-y-2 animate-fadeIn">
              <p className="text-[11px] text-textSecondary font-medium">
                Enter the 6-digit code sent to <strong className="text-textPrimary font-mono">{fullPhoneNumber}</strong>:
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  placeholder="6-digit OTP"
                  value={otpCode}
                  onChange={handleOtpInputChange}
                  className="w-32 px-3 py-1.5 bg-surface2 border border-border rounded-xl text-center text-sm font-mono font-bold tracking-widest text-textPrimary focus:outline-none focus:border-primary"
                />
                <button
                  type="button"
                  onClick={handleVerifyOtp}
                  disabled={verifyingOtp || otpCode.length !== 6}
                  className="px-4 py-1.5 bg-primary hover:bg-primaryHover text-primaryContrast rounded-xl text-xs font-bold transition flex items-center gap-1 disabled:opacity-50"
                >
                  {verifyingOtp ? (
                    <span className="w-3.5 h-3.5 border-2 border-primaryContrast border-t-transparent rounded-full animate-spin" />
                  ) : (
                    'Verify OTP'
                  )}
                </button>
              </div>
            </div>
          )}

          {/* SMS Inline Feedback */}
          {smsError && (
            <div className="p-2.5 bg-dangerSoft border border-danger/30 text-danger text-[11px] rounded-lg flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{smsError}</span>
            </div>
          )}

          {smsSuccess && (
            <div className="p-2.5 bg-primarySoft border border-primary/30 text-primary text-[11px] rounded-lg flex items-center gap-2">
              <Check className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{smsSuccess}</span>
            </div>
          )}

          {!phoneVerified && pref.smsEnabled && (
            <p className="text-[11px] text-accent font-semibold flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              Verify your mobile number to enable SMS alerts.
            </p>
          )}
        </div>

        {/* Schedule & Quiet Hours Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {/* Reminder Time & Timezone */}
          <div className="space-y-3 p-4 bg-surface2 rounded-xl border border-border">
            <span className="text-xs font-bold text-textPrimary flex items-center gap-1.5 mb-2">
              <Clock className="w-3.5 h-3.5 text-primary" /> Preferred Reminder Schedule
            </span>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] text-textSecondary mb-1 font-medium">Daily Time</label>
                <input
                  type="time"
                  value={pref.reminderTime}
                  onChange={(e) => setPref({ ...pref, reminderTime: e.target.value })}
                  className="w-full px-3 py-1.5 bg-surface border border-border rounded-xl text-xs text-textPrimary focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-[11px] text-textSecondary mb-1 font-medium">Timezone</label>
                <select
                  value={pref.timezone}
                  onChange={(e) => setPref({ ...pref, timezone: e.target.value })}
                  className="w-full px-2 py-1.5 bg-surface border border-border rounded-xl text-xs text-textPrimary focus:outline-none focus:border-primary"
                >
                  {TIMEZONE_OPTIONS.map((tz) => (
                    <option key={tz} value={tz}>
                      {tz}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Quiet Hours Window */}
          <div className="space-y-3 p-4 bg-surface2 rounded-xl border border-border">
            <span className="text-xs font-bold text-textPrimary flex items-center gap-1.5 mb-2">
              <Moon className="w-3.5 h-3.5 text-primary" /> Quiet Hours (No Disturb Window)
            </span>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] text-textSecondary mb-1 font-medium">Start Time</label>
                <input
                  type="time"
                  value={pref.quietHoursStart}
                  onChange={(e) => setPref({ ...pref, quietHoursStart: e.target.value })}
                  className="w-full px-3 py-1.5 bg-surface border border-border rounded-xl text-xs text-textPrimary focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-[11px] text-textSecondary mb-1 font-medium">End Time</label>
                <input
                  type="time"
                  value={pref.quietHoursEnd}
                  onChange={(e) => setPref({ ...pref, quietHoursEnd: e.target.value })}
                  className="w-full px-3 py-1.5 bg-surface border border-border rounded-xl text-xs text-textPrimary focus:outline-none focus:border-primary"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-primary hover:bg-primaryHover text-primaryContrast rounded-xl text-xs font-bold shadow-paper-sm transition flex items-center gap-1.5 disabled:opacity-50"
          >
            <Check className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      </form>
    </div>
  );
};
