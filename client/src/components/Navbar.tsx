import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Compass,
  BookOpen,
  Award,
  BarChart3,
  MessageSquare,
  LogOut,
  UserCheck,
  Layers,
  ChevronDown,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout, switchDemoUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSwitching, setIsSwitching] = useState(false);

  const handleRoleSwitch = async (role: 'admin' | 'trainer' | 'learner') => {
    setIsSwitching(true);
    await switchDemoUser(role);
    setIsSwitching(false);
    if (role === 'admin') navigate('/admin');
    else if (role === 'trainer') navigate('/trainer');
    else navigate('/dashboard');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-surface text-textPrimary border-b border-surfaceBorder sticky top-0 z-50 shadow-lg shadow-background/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Brand Logo & Gov Info */}
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-background border border-surfaceBorder flex items-center justify-center text-accent shadow-[0_0_15px_rgba(57,255,20,0.25)] font-bold text-xl tracking-tighter group-hover:border-accent/60 transition">
                V
              </div>
              <div>
                <span className="font-display italic text-2xl sm:text-[26px] tracking-wide text-accent block leading-none drop-shadow-[0_0_8px_rgba(57,255,20,0.4)]">
                  Vantage
                </span>
                <p className="text-[11px] text-textSecondary font-medium leading-none mt-1">
                  Ministry of Earth Sciences • Smart Education
                </p>
              </div>
            </Link>

            {/* Nav Links */}
            {user && (
              <div className="hidden md:flex items-center gap-1 ml-6 border-l border-surfaceBorder pl-4">
                {user.role === 'learner' && (
                  <>
                    <Link
                      to="/dashboard"
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                        isActive('/dashboard')
                          ? 'bg-background border border-accent/50 text-accent shadow-[0_0_10px_rgba(57,255,20,0.2)]'
                          : 'text-textSecondary hover:text-textPrimary hover:bg-surfaceBorder/30'
                      }`}
                    >
                      <Compass className="w-3.5 h-3.5" /> My Learning & Gaps
                    </Link>
                    <Link
                      to="/catalog"
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                        isActive('/catalog')
                          ? 'bg-background border border-accent/50 text-accent shadow-[0_0_10px_rgba(57,255,20,0.2)]'
                          : 'text-textSecondary hover:text-textPrimary hover:bg-surfaceBorder/30'
                      }`}
                    >
                      <BookOpen className="w-3.5 h-3.5" /> Course Catalog
                    </Link>
                    <Link
                      to="/onboarding"
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                        isActive('/onboarding')
                          ? 'bg-background border border-accent/50 text-accent shadow-[0_0_10px_rgba(57,255,20,0.2)]'
                          : 'text-textSecondary hover:text-textPrimary hover:bg-surfaceBorder/30'
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5" /> Self-Assessment
                    </Link>
                  </>
                )}

                {user.role === 'trainer' && (
                  <>
                    <Link
                      to="/trainer"
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                        isActive('/trainer')
                          ? 'bg-background border border-accent/50 text-accent shadow-[0_0_10px_rgba(57,255,20,0.2)]'
                          : 'text-textSecondary hover:text-textPrimary hover:bg-surfaceBorder/30'
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5" /> Trainer Hub & Courses
                    </Link>
                    <Link
                      to="/catalog"
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                        isActive('/catalog')
                          ? 'bg-background border border-accent/50 text-accent shadow-[0_0_10px_rgba(57,255,20,0.2)]'
                          : 'text-textSecondary hover:text-textPrimary hover:bg-surfaceBorder/30'
                      }`}
                    >
                      <BookOpen className="w-3.5 h-3.5" /> Browse Catalog
                    </Link>
                  </>
                )}

                {user.role === 'admin' && (
                  <>
                    <Link
                      to="/admin"
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                        isActive('/admin')
                          ? 'bg-background border border-accent/50 text-accent shadow-[0_0_10px_rgba(57,255,20,0.2)]'
                          : 'text-textSecondary hover:text-textPrimary hover:bg-surfaceBorder/30'
                      }`}
                    >
                      <BarChart3 className="w-3.5 h-3.5" /> Executive Analytics & Heatmap
                    </Link>
                    <Link
                      to="/catalog"
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                        isActive('/catalog')
                          ? 'bg-background border border-accent/50 text-accent shadow-[0_0_10px_rgba(57,255,20,0.2)]'
                          : 'text-textSecondary hover:text-textPrimary hover:bg-surfaceBorder/30'
                      }`}
                    >
                      <BookOpen className="w-3.5 h-3.5" /> All Courses
                    </Link>
                  </>
                )}

                <Link
                  to="/forum"
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    isActive('/forum')
                      ? 'bg-background border border-accent/50 text-accent shadow-[0_0_10px_rgba(57,255,20,0.2)]'
                      : 'text-textSecondary hover:text-textPrimary hover:bg-surfaceBorder/30'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" /> MoES Forum
                </Link>
              </div>
            )}
          </div>

          {/* Right Action Bar */}
          <div className="flex items-center gap-3">
            {/* Hackathon Quick Demo Switcher */}
            <div className="flex items-center bg-background border border-surfaceBorder rounded-xl p-1 gap-1">
              <span className="text-[10px] text-textSecondary font-bold uppercase tracking-wider px-2 flex items-center gap-1">
                <UserCheck className="w-3 h-3 text-accent" /> Switch:
              </span>
              <button
                onClick={() => handleRoleSwitch('learner')}
                disabled={isSwitching}
                className={`text-xs px-2.5 py-1 rounded-lg font-medium transition ${
                  user?.role === 'learner'
                    ? 'bg-accent text-background font-bold shadow-[0_0_10px_rgba(57,255,20,0.4)]'
                    : 'text-textSecondary hover:text-textPrimary hover:bg-surface'
                }`}
                title="Switch to Learner Demo Account"
              >
                Learner
              </button>
              <button
                onClick={() => handleRoleSwitch('trainer')}
                disabled={isSwitching}
                className={`text-xs px-2.5 py-1 rounded-lg font-medium transition ${
                  user?.role === 'trainer'
                    ? 'bg-accent text-background font-bold shadow-[0_0_10px_rgba(57,255,20,0.4)]'
                    : 'text-textSecondary hover:text-textPrimary hover:bg-surface'
                }`}
                title="Switch to Trainer Demo Account"
              >
                Trainer
              </button>
              <button
                onClick={() => handleRoleSwitch('admin')}
                disabled={isSwitching}
                className={`text-xs px-2.5 py-1 rounded-lg font-medium transition ${
                  user?.role === 'admin'
                    ? 'bg-accent text-background font-bold shadow-[0_0_10px_rgba(57,255,20,0.4)]'
                    : 'text-textSecondary hover:text-textPrimary hover:bg-surface'
                }`}
                title="Switch to Admin Demo Account"
              >
                Admin
              </button>
            </div>

            {user ? (
              <div className="flex items-center gap-3">
                <div className="hidden lg:block text-right">
                  <div className="text-xs font-semibold text-textPrimary leading-tight">{user.name}</div>
                  <div className="text-[10px] text-accent font-mono capitalize">
                    {user.role} • {user.department?.split(' ')[0]}
                  </div>
                </div>
                <button
                  onClick={() => {
                    logout();
                    navigate('/login');
                  }}
                  className="p-2 rounded-lg text-textSecondary hover:text-rose-400 hover:bg-surface border border-transparent hover:border-surfaceBorder transition"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="text-xs font-bold px-3 py-1.5 rounded-lg bg-accent hover:bg-accentMuted text-background transition shadow-[0_0_10px_rgba(57,255,20,0.3)]"
                >
                  Sign In
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
