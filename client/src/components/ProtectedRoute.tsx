import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

interface ProtectedRouteProps {
  children: React.ReactElement;
  allowedRoles?: UserRole[];
  allowIncompleteProfile?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  allowIncompleteProfile = false,
}) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-semibold text-textSecondary">Authenticating Vantage session...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Enforcement: Incomplete profile must go to /onboarding/profile
  if (user.profileCompleted === false && location.pathname !== '/onboarding/profile' && !allowIncompleteProfile) {
    return <Navigate to="/onboarding/profile" replace />;
  }

  // Prevent complete users from viewing wizard again by accident
  if (user.profileCompleted === true && location.pathname === '/onboarding/profile') {
    return <Navigate to="/dashboard" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === 'admin' || user.role === 'trainer') return <Navigate to="/trainer" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};
