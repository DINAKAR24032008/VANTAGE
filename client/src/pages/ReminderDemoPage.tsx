import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { HeadingEmoji } from '../components/HeadingEmoji';
import {
  Sparkles,
  Send,
  BookOpen,
  Clock,
  Calendar,
  RotateCcw,
  Smartphone,
  Play,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  ArrowLeft,
  Flame,
} from 'lucide-react';
import { SchedulerLogEntryData, NotificationPreferenceData } from '../types';
import api from '../services/api';

export const ReminderDemoPage: React.FC = () => {
  const [logs, setLogs] = useState<SchedulerLogEntryData[]>([]);
  const [pref, setPref] = useState<NotificationPreferenceData | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Live 1-minute countdown timer state
  const [countdown, setCountdown] = useState<number | null>(null);

  // Duplicate Check Result
  const [dupResult, setDupResult] = useState<any>(null);

  const fetchDemoData = async () => {
    try {
      const [logRes, prefRes, profileRes] = await Promise.all([
        api.get('/api/demo/scheduler-log'),
        api.get('/notifications/preferences'),
        api.get('/api/profile/me'),
      ]);
      setLogs(logRes.data.logs || []);
      setPref(prefRes.data || null);
      setUserProfile(profileRes.data?.profile || null);
    } catch (err) {
      console.error('Failed to fetch demo panel data:', err);
    }
  };

  useEffect(() => {
    fetchDemoData();
    const interval = setInterval(fetchDemoData, 5000);
    return () => clearInterval(interval);
  }, []);

  // Countdown timer effect
  useEffect(() => {
    if (countdown !== null && countdown > 0) {
      const timer = setInterval(() => {
        setCountdown((prev) => (prev !== null && prev > 1 ? prev - 1 : 0));
      }, 1000);
      return () => clearInterval(timer);
    } else if (countdown === 0) {
      // Countdown complete, trigger scheduler refresh
      fetchDemoData();
    }
  }, [countdown]);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMsg({ type, text });
    setTimeout(() => setToastMsg(null), 5000);
  };

  const handleSendNow = async () => {
    try {
      setLoadingAction('sendNow');
      const res = await api.post('/api/demo/reminders/send-now');
      showToast('success', res.data.message || 'Test reminder sent!');
      fetchDemoData();
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to send test reminder');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleSimulateEnrollment = async () => {
    try {
      setLoadingAction('enrollment');
      const res = await api.post('/api/demo/reminders/simulate-enrollment');
      showToast('success', res.data.message || 'Simulated course enrollment!');
      fetchDemoData();
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to simulate enrollment');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleScheduleIn1Min = async () => {
    try {
      setLoadingAction('schedule1min');
      const res = await api.post('/api/demo/reminders/schedule-in-1-min');
      setCountdown(60);
      showToast('success', `${res.data.message}. Firing in 60s...`);
      fetchDemoData();
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to schedule 1-min test');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleSimulateNextDay = async () => {
    try {
      setLoadingAction('nextDay');
      const res = await api.post('/api/demo/reminders/simulate-next-day');
      showToast('success', res.data.message || 'Simulated next day!');
      fetchDemoData();
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to simulate next day');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleReset = async () => {
    try {
      setLoadingAction('reset');
      const res = await api.post('/api/demo/reminders/reset');
      setCountdown(null);
      showToast('success', res.data.message || 'Reset today reminder status');
      fetchDemoData();
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to reset reminder state');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleSmsTest = async () => {
    try {
      setLoadingAction('smsTest');
      const res = await api.post('/api/demo/reminders/send-sms-test');
      showToast('success', `SMS Simulation: "${res.data.sms.formattedText}"`);
      fetchDemoData();
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed SMS test');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleRunDailyRemindersOnDemand = async () => {
    try {
      setLoadingAction('runJob');
      const res = await api.post('/api/dev/run-daily-reminders');
      setDupResult(res.data.summary);
      showToast('success', 'Executed daily reminder cron job on demand!');
      fetchDemoData();
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to run daily reminders');
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 bg-background text-textPrimary max-w-6xl mx-auto space-y-6">
      {/* Top Navigation Back Link */}
      <Link
        to="/profile"
        className="inline-flex items-center gap-1.5 text-xs text-textSecondary hover:text-primary font-semibold mb-2"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Profile & Settings
      </Link>

      {/* Page Title */}
      <div className="bg-surface p-6 sm:p-8 rounded-2xl border border-border shadow-paper-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accentSoft text-accent text-xs font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5" /> Built-In Demo Suite
          </div>
          <h1 className="text-2xl font-extrabold text-textPrimary flex items-center gap-2">
            <HeadingEmoji emoji="🚀" /> Course Reminder System Demo
          </h1>
          <p className="text-xs text-textSecondary mt-1">
            Instantly test daily reminders, enrolment alerts, timezone quiet hours, duplicate prevention, and scheduler logs.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchDemoData}
          className="px-3.5 py-2 bg-surface2 hover:bg-border/50 border border-border rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
        >
          <RefreshCw className="w-3.5 h-3.5 text-primary" /> Refresh Logs
        </button>
      </div>

      {/* Toast Alert */}
      {toastMsg && (
        <div
          className={`p-4 rounded-2xl border shadow-paper-md flex items-center justify-between transition animate-in fade-in slide-in-from-top-2 ${
            toastMsg.type === 'success'
              ? 'bg-primarySoft border-primary/30 text-primary'
              : 'bg-dangerSoft border-danger/30 text-danger'
          }`}
        >
          <div className="flex items-center gap-2 text-xs font-bold">
            {toastMsg.type === 'success' ? (
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
            )}
            <span>{toastMsg.text}</span>
          </div>
        </div>
      )}

      {/* 6 Interactive Action Buttons Grid */}
      <div className="bg-surface p-6 rounded-2xl border border-border shadow-paper-sm space-y-4">
        <h3 className="text-sm font-bold text-textPrimary flex items-center gap-1.5">
          <HeadingEmoji emoji="⚡" /> Interactive Reminder Controls
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* Action 1 */}
          <button
            type="button"
            onClick={handleSendNow}
            disabled={loadingAction !== null}
            className="p-4 bg-surface2 hover:bg-primarySoft text-textPrimary hover:text-primary border border-border rounded-xl text-left transition flex items-start justify-between group disabled:opacity-50"
          >
            <div>
              <span className="text-xs font-bold block flex items-center gap-1.5">
                <Send className="w-3.5 h-3.5 text-primary" /> 1. Send Test Reminder Now
              </span>
              <span className="text-[11px] text-textSecondary mt-1 block leading-normal">
                Immediately dispatches a smart reminder to the bell & toast for this account.
              </span>
            </div>
            {loadingAction === 'sendNow' && <RefreshCw className="w-4 h-4 text-primary animate-spin" />}
          </button>

          {/* Action 2 */}
          <button
            type="button"
            onClick={handleSimulateEnrollment}
            disabled={loadingAction !== null}
            className="p-4 bg-surface2 hover:bg-primarySoft text-textPrimary hover:text-primary border border-border rounded-xl text-left transition flex items-start justify-between group disabled:opacity-50"
          >
            <div>
              <span className="text-xs font-bold block flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-primary" /> 2. Simulate Enrollment
              </span>
              <span className="text-[11px] text-textSecondary mt-1 block leading-normal">
                Enrolls in demo course and triggers instant ENROLLMENT alerts for student & trainer.
              </span>
            </div>
            {loadingAction === 'enrollment' && <RefreshCw className="w-4 h-4 text-primary animate-spin" />}
          </button>

          {/* Action 3 */}
          <button
            type="button"
            onClick={handleScheduleIn1Min}
            disabled={loadingAction !== null}
            className="p-4 bg-surface2 hover:bg-amber-500/10 text-textPrimary hover:text-amber-500 border border-border rounded-xl text-left transition flex items-start justify-between group disabled:opacity-50"
          >
            <div>
              <span className="text-xs font-bold block flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-500" /> 3. Run Reminder in 1 Min
              </span>
              <span className="text-[11px] text-textSecondary mt-1 block leading-normal">
                Sets schedule to current time + 1 min. Real node-cron then executes it.
              </span>
              {countdown !== null && countdown > 0 && (
                <span className="inline-block mt-2 px-2 py-0.5 rounded-md bg-amber-500 text-white text-[10px] font-extrabold animate-pulse">
                  ⏳ Firing in {countdown}s
                </span>
              )}
            </div>
            {loadingAction === 'schedule1min' && <RefreshCw className="w-4 h-4 text-amber-500 animate-spin" />}
          </button>

          {/* Action 4 */}
          <button
            type="button"
            onClick={handleSimulateNextDay}
            disabled={loadingAction !== null}
            className="p-4 bg-surface2 hover:bg-primarySoft text-textPrimary hover:text-primary border border-border rounded-xl text-left transition flex items-start justify-between group disabled:opacity-50"
          >
            <div>
              <span className="text-xs font-bold block flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-primary" /> 4. Simulate Next Day
              </span>
              <span className="text-[11px] text-textSecondary mt-1 block leading-normal">
                Moves lastReminderSentOn back by 1 day so the next scheduler run sends again.
              </span>
            </div>
            {loadingAction === 'nextDay' && <RefreshCw className="w-4 h-4 text-primary animate-spin" />}
          </button>

          {/* Action 5 */}
          <button
            type="button"
            onClick={handleReset}
            disabled={loadingAction !== null}
            className="p-4 bg-surface2 hover:bg-dangerSoft text-textPrimary hover:text-danger border border-border rounded-xl text-left transition flex items-start justify-between group disabled:opacity-50"
          >
            <div>
              <span className="text-xs font-bold block flex items-center gap-1.5">
                <RotateCcw className="w-3.5 h-3.5 text-danger" /> 5. Reset Today's Reminder
              </span>
              <span className="text-[11px] text-textSecondary mt-1 block leading-normal">
                Clears lastReminderSentOn and deletes recent demo notifications.
              </span>
            </div>
            {loadingAction === 'reset' && <RefreshCw className="w-4 h-4 text-danger animate-spin" />}
          </button>

          {/* Action 6 */}
          <button
            type="button"
            onClick={handleSmsTest}
            disabled={loadingAction !== null}
            className="p-4 bg-surface2 hover:bg-accentSoft text-textPrimary hover:text-accent border border-border rounded-xl text-left transition flex items-start justify-between group disabled:opacity-50"
          >
            <div>
              <span className="text-xs font-bold block flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-accent" /> 6. Send SMS Test
              </span>
              <span className="text-[11px] text-textSecondary mt-1 block leading-normal">
                Runs simulated console SMS gateway and displays text output without external calls.
              </span>
            </div>
            {loadingAction === 'smsTest' && <RefreshCw className="w-4 h-4 text-accent animate-spin" />}
          </button>
        </div>
      </div>

      {/* 2-Column Info & Duplicate Check Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Preferences & State Card */}
        <div className="bg-surface p-6 rounded-2xl border border-border shadow-paper-sm space-y-4">
          <h3 className="text-sm font-bold text-textPrimary flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-primary" /> Current Preferences & Learning State
          </h3>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between p-2.5 bg-surface2 rounded-xl border border-border">
              <span className="text-textSecondary">Daily Reminders Enabled:</span>
              <span className={`font-bold ${pref?.dailyReminderEnabled ? 'text-primary' : 'text-danger'}`}>
                {pref?.dailyReminderEnabled ? 'ENABLED' : 'DISABLED'}
              </span>
            </div>

            <div className="flex justify-between p-2.5 bg-surface2 rounded-xl border border-border">
              <span className="text-textSecondary">Scheduled Reminder Time:</span>
              <span className="font-bold text-textPrimary">{pref?.reminderTime || '09:00'} ({pref?.timezone || 'Asia/Kolkata'})</span>
            </div>

            <div className="flex justify-between p-2.5 bg-surface2 rounded-xl border border-border">
              <span className="text-textSecondary">Quiet Hours Window:</span>
              <span className="font-bold text-textPrimary">{pref?.quietHoursStart || '22:00'} to {pref?.quietHoursEnd || '07:00'}</span>
            </div>

            <div className="flex justify-between p-2.5 bg-surface2 rounded-xl border border-border">
              <span className="text-textSecondary">Last Reminder Sent On:</span>
              <span className="font-bold text-textPrimary">
                {pref?.lastReminderSentOn ? pref.lastReminderSentOn : <span className="text-textSecondary italic">None today</span>}
              </span>
            </div>

            <div className="flex justify-between p-2.5 bg-surface2 rounded-xl border border-border">
              <span className="text-textSecondary flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-amber-500" /> Learning Streak Counter:
              </span>
              <span className="font-bold text-amber-500">{userProfile?.streakCount || 0} days</span>
            </div>
          </div>
        </div>

        {/* Duplicate Check Card */}
        <div className="bg-surface p-6 rounded-2xl border border-border shadow-paper-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-textPrimary flex items-center gap-1.5">
              <Play className="w-4 h-4 text-primary" /> Duplicate Check & Manual Execution
            </h3>

            <button
              type="button"
              onClick={handleRunDailyRemindersOnDemand}
              disabled={loadingAction !== null}
              className="px-3 py-1.5 bg-primary hover:bg-primaryHover text-primaryContrast rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-paper-sm disabled:opacity-50"
            >
              <Play className="w-3 h-3" /> Run Cron Job Now
            </button>
          </div>

          <p className="text-xs text-textSecondary leading-relaxed">
            Running the reminder scheduler twice on the same day guarantees that <strong>only ONE reminder is generated</strong>.
            Subsequent runs are safely skipped because <code className="bg-surface2 px-1 rounded text-textPrimary">lastReminderSentOn</code> is updated atomically in the same transaction.
          </p>

          {dupResult && (
            <div className="p-3 bg-surface2 rounded-xl border border-border space-y-1.5 text-xs">
              <div className="font-bold text-textPrimary border-b border-border pb-1">Execution Result Summary:</div>
              <div className="flex justify-between text-textSecondary">
                <span>Processed Preferences:</span>
                <span className="font-bold text-textPrimary">{dupResult.processedCount}</span>
              </div>
              <div className="flex justify-between text-textSecondary">
                <span>Reminders Sent:</span>
                <span className="font-bold text-primary">{dupResult.sentCount}</span>
              </div>
              <div className="flex justify-between text-textSecondary">
                <span>Skipped (Duplicates/Quiet/Off):</span>
                <span className="font-bold text-amber-500">{dupResult.skippedCount}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Live Scheduler Log Card */}
      <div className="bg-surface p-6 rounded-2xl border border-border shadow-paper-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-textPrimary flex items-center gap-1.5">
              📜 Live Scheduler Event Log (Last 20 Events)
            </h3>
            <p className="text-xs text-textSecondary mt-0.5">
              Real-time audit log of node-cron execution decisions and skip reasons.
            </p>
          </div>

          <span className="px-2.5 py-0.5 rounded-full bg-surface2 text-textSecondary text-[10px] font-bold">
            Auto-refreshing 5s
          </span>
        </div>

        <div className="bg-surface2 rounded-xl border border-border overflow-hidden">
          <div className="max-h-72 overflow-y-auto divide-y divide-border">
            {logs.length > 0 ? (
              logs.map((log) => (
                <div key={log.id} className="p-3 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                        log.action === 'CREATED'
                          ? 'bg-primarySoft text-primary border border-primary/30'
                          : log.action === 'SKIPPED'
                          ? 'bg-amber-500/10 text-amber-500 border border-amber-500/30'
                          : 'bg-dangerSoft text-danger border border-danger/30'
                      }`}
                    >
                      {log.action}
                    </span>
                    <span className="font-bold text-textPrimary">{log.userName}</span>
                  </div>

                  <span className="text-textSecondary flex-1 sm:mx-3 font-mono text-[11px] truncate">
                    {log.reason}
                  </span>

                  <span className="text-[10px] text-textSecondary flex-shrink-0">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-xs text-textSecondary italic">
                No scheduler logs recorded yet. Click "Send Test Reminder Now" or "Run Cron Job Now" to trigger events.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
