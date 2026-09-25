import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Navbar } from './components/Navbar';
import { ProtectedRoute } from './components/ProtectedRoute';

import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { LearnerDashboard } from './pages/LearnerDashboard';
import { OnboardingCompetencyPage } from './pages/OnboardingCompetencyPage';
import { CourseCatalogPage } from './pages/CourseCatalogPage';
import { CourseDetailPage } from './pages/CourseDetailPage';
import { TrainerManagePage } from './pages/TrainerManagePage';
import { ForumPage } from './pages/ForumPage';
import { ProfileWizardPage } from './pages/ProfileWizardPage';
import { ProfilePage } from './pages/ProfilePage';
import { PublicProfilePage } from './pages/PublicProfilePage';
import { AdminProgressPage } from './pages/AdminProgressPage';
import { PublicUsernameProfilePage } from './pages/PublicUsernameProfilePage';
import { ReminderDemoPage } from './pages/ReminderDemoPage';
import { NetworkPage } from './pages/NetworkPage';

const RootRedirect: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.profileCompleted === false) return <Navigate to="/onboarding/profile" replace />;
  if (user.role === 'admin') return <Navigate to="/admin" replace />;
  if (user.role === 'trainer') return <Navigate to="/trainer" replace />;
  return <Navigate to="/dashboard" replace />;
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <div className="min-h-screen flex flex-col bg-background text-textPrimary font-sans transition-colors duration-150">
            <Navbar />
            <main className="flex-1">
              <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />

                {/* Profile Onboarding Wizard */}
                <Route
                  path="/onboarding/profile"
                  element={
                    <ProtectedRoute allowIncompleteProfile>
                      <ProfileWizardPage />
                    </ProtectedRoute>
                  }
                />

                {/* Main Profile & Public Learner Profile */}
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <ProfilePage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/network"
                  element={
                    <ProtectedRoute>
                      <NetworkPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile/:userId"
                  element={
                    <ProtectedRoute>
                      <PublicProfilePage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/demo/reminders"
                  element={
                    <ProtectedRoute>
                      <ReminderDemoPage />
                    </ProtectedRoute>
                  }
                />

                {/* Public @username profiles — no auth required */}
                <Route path="/u/:username" element={<PublicUsernameProfilePage />} />

                {/* Learner Flow */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute allowedRoles={['learner']}>
                      <LearnerDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/onboarding"
                  element={
                    <ProtectedRoute allowedRoles={['learner']}>
                      <OnboardingCompetencyPage />
                    </ProtectedRoute>
                  }
                />

                {/* Course Catalog & Detailed Player (Accessible to all authenticated) */}
                <Route
                  path="/catalog"
                  element={
                    <ProtectedRoute>
                      <CourseCatalogPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/courses/:id"
                  element={
                    <ProtectedRoute>
                      <CourseDetailPage />
                    </ProtectedRoute>
                  }
                />

                {/* Trainer / Admin Curriculum Portal */}
                <Route
                  path="/trainer"
                  element={
                    <ProtectedRoute allowedRoles={['trainer', 'admin']}>
                      <TrainerManagePage />
                    </ProtectedRoute>
                  }
                />

                {/* Discussion Forum */}
                <Route
                  path="/forum"
                  element={
                    <ProtectedRoute>
                      <ForumPage />
                    </ProtectedRoute>
                  }
                />

                {/* Admin Portal: Platform Analytics & Aggregated Learner Progress */}
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminProgressPage />
                    </ProtectedRoute>
                  }
                />

                {/* Root */}
                <Route path="/" element={<RootRedirect />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
          </div>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

export default App;
