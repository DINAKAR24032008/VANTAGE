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
    <nav className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Brand Logo & Gov Info */}
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 font-bold text-xl tracking-tighter">
                V
              </div>
              <div>
                <span className="font-extrabold text-lg tracking-tight text-white block">
                  Vantage
                </span>
                <p className="text-[11px] text-slate-400 font-medium leading-none mt-0.5">
                  Ministry of Earth Sciences • Smart Education
                </p>
              </div>
            </Link>

            {/* Nav Links */}
            {user && (
              <div className="hidden md:flex items-center gap-1 ml-6 border-l border-slate-800 pl-4">
                {user.role === 'learner' && (
                  <>
                    <Link
                      to="/dashboard"
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                        isActive('/dashboard') ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <Compass className="w-3.5 h-3.5" /> My Learning & Gaps
                    </Link>
                    <Link
                      to="/catalog"
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                        isActive('/catalog') ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <BookOpen className="w-3.5 h-3.5" /> Course Catalog
                    </Link>
                    <Link
                      to="/onboarding"
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                        isActive('/onboarding') ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-slate-800'
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
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                        isActive('/trainer') ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5" /> Trainer Hub & Courses
                    </Link>
                    <Link
                      to="/catalog"
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                        isActive('/catalog') ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-slate-800'
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
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                        isActive('/admin') ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <BarChart3 className="w-3.5 h-3.5" /> Executive Analytics & Heatmap
                    </Link>
                    <Link
                      to="/catalog"
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                        isActive('/catalog') ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <BookOpen className="w-3.5 h-3.5" /> All Courses
                    </Link>
                  </>
                )}

                <Link
                  to="/forum"
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                    isActive('/forum') ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-slate-800'
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
            <div className="flex items-center bg-slate-800/90 border border-slate-700/80 rounded-xl p-1 gap-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider px-2 flex items-center gap-1">
                <UserCheck className="w-3 h-3 text-emerald-400" /> Switch:
              </span>
              <button
                onClick={() => handleRoleSwitch('learner')}
                disabled={isSwitching}
                className={`text-xs px-2.5 py-1 rounded-lg font-medium transition ${
                  user?.role === 'learner'
                    ? 'bg-emerald-500 text-white font-bold shadow'
                    : 'text-slate-300 hover:bg-slate-700'
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
                    ? 'bg-emerald-500 text-white font-bold shadow'
                    : 'text-slate-300 hover:bg-slate-700'
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
                    ? 'bg-emerald-500 text-white font-bold shadow'
                    : 'text-slate-300 hover:bg-slate-700'
                }`}
                title="Switch to Admin Demo Account"
              >
                Admin
              </button>
            </div>

            {user ? (
              <div className="flex items-center gap-3">
                <div className="hidden lg:block text-right">
                  <div className="text-xs font-semibold text-white leading-tight">{user.name}</div>
                  <div className="text-[10px] text-emerald-400 font-mono capitalize">
                    {user.role} • {user.department?.split(' ')[0]}
                  </div>
                </div>
                <button
                  onClick={() => {
                    logout();
                    navigate('/login');
                  }}
                  className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition"
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
