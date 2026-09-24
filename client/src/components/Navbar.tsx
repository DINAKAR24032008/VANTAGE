import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  Compass,
  BookOpen,
  MessageSquare,
  LogOut,
  UserCheck,
  Layers,
  Sun,
  Moon,
  Users,
  Search,
} from 'lucide-react';
import { Avatar } from './Avatar';
import { AvatarModal } from './AvatarModal';
import { NotificationBell } from './NotificationBell';
import { NavbarSearchModal } from './NavbarSearchModal';

export const Navbar: React.FC = () => {
  const { user, logout, switchDemoUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSwitching, setIsSwitching] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);

  const handleRoleSwitch = async (role: 'admin' | 'trainer' | 'learner') => {
    setIsSwitching(true);
    await switchDemoUser(role);
    setIsSwitching(false);
    if (role === 'learner') navigate('/dashboard');
    else navigate('/catalog');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      <nav className="bg-surface text-textPrimary border-b border-border sticky top-0 z-50 shadow-paper-sm transition-colors duration-150">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Brand Logo */}
            <div className="flex items-center gap-3">
              <Link to="/" className="flex items-center gap-2.5 group">
                <div className="w-10 h-10 rounded-xl bg-primary text-primaryContrast flex items-center justify-center font-bold text-xl tracking-tighter shadow-paper-sm group-hover:bg-primaryHover transition">
                  V
                </div>
                <div>
                  <span className="font-bold text-2xl sm:text-[26px] tracking-wide text-primary block leading-none">
                    Vantage
                  </span>
                </div>
              </Link>

              {/* Nav Links */}
              {user && (
                <div className="hidden md:flex items-center gap-1 ml-6 border-l border-border pl-4">
                  {user.role === 'learner' && (
                    <Link
                      to="/dashboard"
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                        isActive('/dashboard')
                          ? 'bg-primarySoft text-primary border border-primary/30 font-bold'
                          : 'text-textSecondary hover:text-textPrimary hover:bg-surface2'
                      }`}
                    >
                      <Compass className="w-3.5 h-3.5" /> My Learning
                    </Link>
                  )}

                  <Link
                    to="/catalog"
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                      isActive('/catalog')
                        ? 'bg-primarySoft text-primary border border-primary/30 font-bold'
                        : 'text-textSecondary hover:text-textPrimary hover:bg-surface2'
                    }`}
                  >
                    <BookOpen className="w-3.5 h-3.5" /> All Courses
                  </Link>

                  <Link
                    to="/network"
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                      isActive('/network')
                        ? 'bg-primarySoft text-primary border border-primary/30 font-bold'
                        : 'text-textSecondary hover:text-textPrimary hover:bg-surface2'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" /> Network
                  </Link>

                  {(user.role === 'trainer' || user.role === 'admin') && (
                    <Link
                      to="/trainer"
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                        isActive('/trainer')
                          ? 'bg-primarySoft text-primary border border-primary/30 font-bold'
                          : 'text-textSecondary hover:text-textPrimary hover:bg-surface2'
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5" /> Course Management
                    </Link>
                  )}

                  <Link
                    to="/forum"
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                      isActive('/forum')
                        ? 'bg-primarySoft text-primary border border-primary/30 font-bold'
                        : 'text-textSecondary hover:text-textPrimary hover:bg-surface2'
                    }`}
                  >
                    <MessageSquare className="w-3.5 h-3.5" /> Discussion Forum
                  </Link>
                </div>
              )}
            </div>

            {/* Right Action Bar */}
            <div className="flex items-center gap-3">
              {/* Quick Search Icon Button */}
              {user && (
                <button
                  type="button"
                  onClick={() => setShowSearchModal(true)}
                  className="p-2 text-textSecondary hover:text-textPrimary hover:bg-surface2 rounded-xl border border-border transition flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-primary/40"
                  aria-label="Search people"
                  title="Search people (Name, Username, Profession)"
                >
                  <Search className="w-4 h-4" />
                </button>
              )}

              {/* Quick Role Switcher */}
              <div className="flex items-center bg-surface2 border border-border rounded-xl p-1 gap-1">
                <span className="text-[10px] text-textSecondary font-bold uppercase tracking-wider px-2 flex items-center gap-1">
                  <UserCheck className="w-3 h-3 text-primary" /> Switch:
                </span>
                <button
                  onClick={() => handleRoleSwitch('learner')}
                  disabled={isSwitching}
                  className={`text-xs px-2.5 py-1 rounded-lg font-medium transition ${
                    user?.role === 'learner'
                      ? 'bg-primary text-primaryContrast font-bold shadow-paper-sm'
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
                      ? 'bg-primary text-primaryContrast font-bold shadow-paper-sm'
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
                      ? 'bg-primary text-primaryContrast font-bold shadow-paper-sm'
                      : 'text-textSecondary hover:text-textPrimary hover:bg-surface'
                  }`}
                  title="Switch to Admin Demo Account"
                >
                  Admin
                </button>
              </div>

              {/* Theme Toggle Button */}
              <button
                onClick={toggleTheme}
                className="p-2 text-textSecondary hover:text-textPrimary hover:bg-surface2 rounded-xl border border-border transition-colors duration-150 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-primary/40"
                aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {theme === 'dark' ? (
                  <Sun className="w-4 h-4 text-warning" />
                ) : (
                  <Moon className="w-4 h-4 text-textSecondary" />
                )}
              </button>

              {/* Notification Bell */}
              {user && <NotificationBell />}

              {user ? (
                <div className="flex items-center gap-3 relative">
                  <Link
                    to="/profile"
                    className={`hidden lg:block text-right hover:opacity-80 transition ${
                      isActive('/profile') ? 'text-primary font-bold' : ''
                    }`}
                  >
                    <div className="text-xs font-semibold text-textPrimary leading-tight">{user.name}</div>
                    <div className="text-[10px] text-primary font-bold capitalize">
                      {user.role} • Profile
                    </div>
                  </Link>
                  {/* Avatar & Profile Menu */}
                  <div className="flex items-center gap-1.5">
                    <Link
                      to="/profile"
                      title="View My Profile"
                      className={`ring-0 focus:outline-none rounded-full p-0.5 transition ${
                        isActive('/profile') ? 'ring-2 ring-primary' : ''
                      }`}
                    >
                      <Avatar user={user} size="md" showRoleRing />
                    </Link>
                    <button
                      type="button"
                      onClick={() => setShowAvatarModal(true)}
                      className="p-1.5 rounded-lg text-textSecondary hover:text-textPrimary hover:bg-surface2 transition text-xs font-bold"
                      title="Edit Avatar"
                    >
                      Edit Avatar
                    </button>
                    <button
                      onClick={() => {
                        logout();
                        navigate('/login');
                      }}
                      className="p-2 rounded-lg text-textSecondary hover:text-danger hover:bg-dangerSoft border border-transparent transition"
                      title="Sign Out"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    to="/login"
                    className="text-xs font-bold px-3 py-1.5 rounded-lg bg-primary hover:bg-primaryHover text-primaryContrast transition shadow-paper-sm"
                  >
                    Sign In
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Avatar Setup Modal */}
      {user && showAvatarModal && (
        <AvatarModal onClose={() => setShowAvatarModal(false)} />
      )}

      {/* Quick Search Modal */}
      {user && (
        <NavbarSearchModal
          isOpen={showSearchModal}
          onClose={() => setShowSearchModal(false)}
        />
      )}
    </>
  );
};
