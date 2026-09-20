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

const RootRedirect: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'admin' || user.role === 'trainer') return <Navigate to="/catalog" replace />;
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

                {/* Legacy / Admin Redirect */}
                <Route path="/admin" element={<Navigate to="/catalog" replace />} />

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
