import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { User, Mail, Lock, Building, Briefcase, ArrowRight, ShieldAlert } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    department: 'India Meteorological Department (IMD)',
    jobRole: 'Meteorological Assistant',
    role: 'learner',
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      const res = await api.post('/auth/register', formData);
      login(res.data.token, res.data.user);
      navigate('/onboarding');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-background text-textPrimary">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <h2 className="text-3xl sm:text-4xl font-display italic text-accent tracking-normal">Create Learner Account</h2>
        <p className="mt-1 text-xs text-textSecondary font-semibold uppercase tracking-wider">
          Vantage • Onboarding
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-surface py-8 px-6 shadow-2xl rounded-2xl sm:px-10 border border-surfaceBorder backdrop-blur-md">
          {error && (
            <div className="mb-4 p-3 bg-rose-950/80 border border-rose-800 text-rose-300 text-xs rounded-xl flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 flex-shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-medium text-textSecondary mb-1">Full Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-textSecondary">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Dr. Sunita Rao"
                  className="w-full pl-9 pr-3 py-2 bg-background border border-surfaceBorder rounded-xl text-xs text-textPrimary placeholder-textSecondary/50 focus:outline-none focus:border-accent"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-textSecondary mb-1">Official Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-textSecondary">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="name@moes.gov.in"
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
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-3 py-2 bg-background border border-surfaceBorder rounded-xl text-xs text-textPrimary placeholder-textSecondary/50 focus:outline-none focus:border-accent"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-textSecondary mb-1">MoES Department / Institute</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-textSecondary">
                  <Building className="w-4 h-4" />
                </div>
                <select
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 bg-background border border-surfaceBorder rounded-xl text-xs text-textPrimary focus:outline-none focus:border-accent"
                >
                  <option>India Meteorological Department (IMD)</option>
                  <option>Indian National Centre for Ocean Information Services (INCOIS)</option>
                  <option>National Centre for Seismology (NCS)</option>
                  <option>National Institute of Ocean Technology (NIOT)</option>
                  <option>National Centre for Polar and Ocean Research (NCPOR)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-textSecondary mb-1">Designation / Job Role</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-textSecondary">
                  <Briefcase className="w-4 h-4" />
                </div>
                <select
                  value={formData.jobRole}
                  onChange={(e) => setFormData({ ...formData, jobRole: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 bg-background border border-surfaceBorder rounded-xl text-xs text-textPrimary focus:outline-none focus:border-accent"
                >
                  <option>Meteorological Assistant</option>
                  <option>Ocean Data Analyst</option>
                  <option>Seismological Field Officer</option>
                  <option>Marine Research Fellow</option>
                  <option>Polar Research Assistant</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 px-4 rounded-xl bg-accent hover:bg-accent/90 text-background font-bold text-xs shadow-lg shadow-accent/20 transition flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {loading ? 'Creating Profile...' : 'Complete Registration & Continue'}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-textSecondary">
            Already registered?{' '}
            <Link to="/login" className="text-accent font-semibold hover:underline">
              Sign in here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
