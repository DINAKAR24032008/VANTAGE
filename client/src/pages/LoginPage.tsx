import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, DEMO_CREDENTIALS } from '../context/AuthContext';
import api from '../services/api';
import { Lock, Mail, ShieldAlert, ArrowRight, Sparkles, Building2 } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      const res = await api.post('/auth/login', { email, password });
      login(res.data.token, res.data.user);
      routeUser(res.data.user.role);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoSelect = async (role: 'admin' | 'trainer' | 'learner') => {
    const cred = DEMO_CREDENTIALS[role];
    setEmail(cred.email);
    setPassword(cred.pass);
    try {
      setLoading(true);
      setError(null);
      const res = await api.post('/auth/login', { email: cred.email, password: cred.pass });
      login(res.data.token, res.data.user);
      routeUser(res.data.user.role);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSSOMock = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.post('/auth/sso-mock', {
        provider: 'iGOT_Karmayogi_SSO',
        email: 'officer.sso@imd.gov.in',
      });
      login(res.data.token, res.data.user);
      routeUser(res.data.user.role);
    } catch (err: any) {
      setError('SSO authentication stub error');
    } finally {
      setLoading(false);
    }
  };

  const routeUser = (role: string) => {
    if (role === 'admin') navigate('/admin');
    else if (role === 'trainer') navigate('/trainer');
    else navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-background text-textPrimary">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent/15 border border-accent/40 shadow-xl shadow-accent/20 font-extrabold text-3xl mb-4 text-accent">
          V
        </div>
        <h2 className="text-4xl font-display italic tracking-wide text-accent">Vantage</h2>
        <p className="mt-1 text-xs text-textSecondary font-semibold tracking-wide uppercase">
          Digital Capacity Building & Learning Portal
        </p>
        <p className="text-xs text-textSecondary mt-1">Ministry of Earth Sciences, Government of India</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-surface py-8 px-6 shadow-2xl rounded-2xl sm:px-10 border border-surfaceBorder backdrop-blur-md">
          {error && (
            <div className="mb-4 p-3 bg-rose-950/80 border border-rose-800 text-rose-300 text-xs rounded-xl flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 flex-shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Quick Demo Pre-fill Box for Judges */}
          <div className="mb-6 p-4 rounded-xl bg-background border border-surfaceBorder">
            <span className="text-[11px] font-bold text-textPrimary flex items-center gap-1 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-accent" /> Instant Hackathon Demo Login:
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemoSelect('learner')}
                className="px-2.5 py-2 bg-surface hover:bg-surfaceBorder/60 text-accent border border-accent/40 rounded-lg text-xs font-semibold text-center transition"
              >
                Learner
                <span className="block text-[9px] text-textSecondary font-normal">Met Assistant</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoSelect('trainer')}
                className="px-2.5 py-2 bg-surface hover:bg-surfaceBorder/60 text-accentMuted border border-accentMuted/40 rounded-lg text-xs font-semibold text-center transition"
              >
                Trainer
                <span className="block text-[9px] text-textSecondary font-normal">IMD Scientist</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoSelect('admin')}
                className="px-2.5 py-2 bg-surface hover:bg-surfaceBorder/60 text-accent border border-accent/40 rounded-lg text-xs font-semibold text-center transition"
              >
                Admin
                <span className="block text-[9px] text-textSecondary font-normal">Director HQ</span>
              </button>
            </div>
          </div>

          <form className="space-y-4" onSubmit={handleLogin}>
            <div>
              <label className="block text-xs font-medium text-textSecondary mb-1">Official Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-textSecondary">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="name@vantage.gov.in"
                  className="w-full pl-9 pr-3 py-2 bg-background border border-surfaceBorder rounded-xl text-xs text-textPrimary placeholder-textSecondary/50 focus:outline-none focus:border-accent"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-textSecondary mb-1">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-textSecondary">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-3 py-2 bg-background border border-surfaceBorder rounded-xl text-xs text-textPrimary placeholder-textSecondary/50 focus:outline-none focus:border-accent"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-accent hover:bg-accent/90 text-background font-bold text-xs shadow-lg shadow-accent/20 transition flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Sign In with Credentials'}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* SSO Mock Button */}
          <div className="mt-6 border-t border-surfaceBorder pt-5">
            <button
              type="button"
              onClick={handleSSOMock}
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-surface hover:bg-surfaceBorder/60 text-textPrimary border border-surfaceBorder font-semibold text-xs transition flex items-center justify-center gap-2"
            >
              <Building2 className="w-4 h-4 text-accent" />
              Sign in with iGOT Karmayogi / Parichay (SSO Stub)
            </button>
          </div>

          <div className="mt-6 text-center text-xs text-textSecondary">
            Don't have an account?{' '}
            <Link to="/register" className="text-accent font-semibold hover:underline">
              Register New Learner
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
