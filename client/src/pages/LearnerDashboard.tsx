import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { CertificateModal } from '../components/CertificateModal';
import { Avatar } from '../components/Avatar';
import { HeadingEmoji } from '../components/HeadingEmoji';
import {
  Enrollment,
  Certificate,
  Course,
} from '../types';
import {
  BookOpen,
  Award,
  PlayCircle,
  CheckCircle2,
  Clock,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export const LearnerDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrollingCourseId, setEnrollingCourseId] = useState<string | null>(null);

  const [profileCompletion, setProfileCompletion] = useState<number>(100);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadDashboardData();
    }
  }, [user?.id]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [coursesRes, enrollsRes, certsRes, profileRes] = await Promise.all([
        api.get('/courses'),
        api.get('/enrollments/my'),
        api.get('/certificates/my'),
        api.get('/profile/me'),
      ]);
      setCourses(coursesRes.data);
      setEnrollments(enrollsRes.data);
      setCertificates(certsRes.data);
      setProfileCompletion(profileRes.data.completionPercent || 100);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async (courseId: string) => {
    try {
      setEnrollingCourseId(courseId);
      await api.post('/enrollments', { courseId });
      await loadDashboardData();
      navigate(`/courses/${courseId}`);
    } catch (err) {
      console.error('Enrollment error:', err);
    } finally {
      setEnrollingCourseId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-xs font-semibold text-textSecondary">
            Loading your courses & learning progress...
          </p>
        </div>
      </div>
    );
  }

  // Find Python course (or first available course)
  const pythonCourse = courses.find((c) => c.title.toLowerCase().includes('python')) || courses[0];
  const pythonEnrollment = enrollments.find((e) => e.courseId === pythonCourse?.id);

  let completedModulesList: string[] = [];
  if (pythonEnrollment?.completedModules) {
    if (Array.isArray(pythonEnrollment.completedModules)) {
      completedModulesList = pythonEnrollment.completedModules;
    } else if (typeof pythonEnrollment.completedModules === 'string') {
      try {
        completedModulesList = JSON.parse(pythonEnrollment.completedModules);
      } catch (e) {
        completedModulesList = [];
      }
    }
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Dismissible Profile Completion Banner */}
        {profileCompletion < 100 && !bannerDismissed && (
          <div className="bg-primarySoft border border-primary/30 rounded-2xl p-4 text-textPrimary flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-paper-sm">
            <div className="flex items-center gap-3">
              <span className="text-xl">🎯</span>
              <div>
                <h4 className="text-xs font-bold text-primary">
                  Profile {profileCompletion}% Complete
                </h4>
                <p className="text-xs text-textSecondary">
                  Add your bio, achievements, and LinkedIn link to showcase your career accomplishments.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Link
                to="/profile"
                className="px-3.5 py-1.5 bg-primary hover:bg-primaryHover text-primaryContrast rounded-xl text-xs font-bold transition shadow-paper-sm text-center"
              >
                Complete Profile
              </Link>
              <button
                type="button"
                onClick={() => setBannerDismissed(true)}
                className="px-2.5 py-1.5 text-textSecondary hover:text-textPrimary text-xs font-semibold"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Welcome Hero Banner */}
        <div className="bg-surface rounded-3xl p-6 sm:p-8 text-textPrimary shadow-paper-sm relative overflow-hidden border border-border">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 relative z-10">
            <div className="flex items-start gap-5">
              {/* Avatar */}
              <div className="hidden sm:block">
                <Avatar user={user!} size="xl" showRoleRing />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-primarySoft text-primary text-[11px] font-bold uppercase tracking-wider border border-primary/30">
                    🚀 Learner Dashboard
                  </span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-bold text-textPrimary tracking-tight">
                  <HeadingEmoji emoji="👋" />Welcome back, {user?.name}
                </h1>
                <p className="text-xs sm:text-sm text-textSecondary mt-1 max-w-2xl">
                  Track your course progress, watch video lectures, complete interactive quizzes, and earn verifiable certificates.
                </p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="bg-surface2 border border-border p-3.5 rounded-2xl text-center min-w-[100px]">
                <div className="text-2xl font-black text-primary">{enrollments.length}</div>
                <div className="text-[10px] text-textSecondary uppercase font-semibold mt-0.5">Enrolled</div>
              </div>
              <div className="bg-surface2 border border-border p-3.5 rounded-2xl text-center min-w-[100px]">
                <div className="text-2xl font-black text-primary">
                  {enrollments.filter((e) => e.status === 'completed').length}
                </div>
                <div className="text-[10px] text-textSecondary uppercase font-semibold mt-0.5">Completed</div>
              </div>
              <div className="bg-surface2 border border-border p-3.5 rounded-2xl text-center min-w-[100px] col-span-2 sm:col-span-1">
                <div className="text-2xl font-black text-primary">{certificates.length}</div>
                <div className="text-[10px] text-textSecondary uppercase font-semibold mt-0.5">Certificates</div>
              </div>
            </div>
          </div>
        </div>

        {/* Featured Program: Introduction to Python */}
        {pythonCourse && (
          <div className="bg-surface rounded-3xl p-6 sm:p-8 border border-border shadow-paper-sm relative overflow-hidden">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div className="space-y-3 max-w-2xl">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-primarySoft text-primary border border-primary/30">
                    {pythonCourse.difficultyLevel} Level
                  </span>
                  <span className="text-xs text-textSecondary font-medium flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-primary" /> 6 Modular Video Lessons & Assessments
                  </span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-bold text-textPrimary">
                  {pythonCourse.title}
                </h2>
                <p className="text-xs sm:text-sm text-textSecondary leading-relaxed">
                  {pythonCourse.description}
                </p>

                {/* Progress Bar if enrolled */}
                {pythonEnrollment ? (
                  <div className="space-y-2 pt-2">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-textSecondary">
                        Course Progress ({completedModulesList.length} of {pythonCourse.modules?.length || 6} Modules Finished)
                      </span>
                      <span className="text-primary font-bold">
                        {pythonEnrollment.progressPercent}%
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-border rounded-full overflow-hidden border border-borderStrong">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-500"
                        style={{ width: `${pythonEnrollment.progressPercent}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 pt-2 text-xs text-textSecondary">
                    <Sparkles className="w-4 h-4 text-accent" />
                    <span>Includes 6 video tutorials, hands-on modules, and 6 end-of-module quizzes.</span>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <div className="w-full lg:w-auto flex flex-col sm:flex-row lg:flex-col gap-3">
                {pythonEnrollment ? (
                  <Link
                    to={`/courses/${pythonCourse.id}`}
                    className="px-6 py-3 bg-primary hover:bg-primaryHover text-primaryContrast font-bold text-sm rounded-xl transition flex items-center justify-center gap-2 shadow-paper-sm"
                  >
                    <PlayCircle className="w-4 h-4" /> Continue Learning
                  </Link>
                ) : (
                  <button
                    onClick={() => handleEnroll(pythonCourse.id)}
                    disabled={enrollingCourseId === pythonCourse.id}
                    className="px-6 py-3 bg-primary hover:bg-primaryHover text-primaryContrast font-bold text-sm rounded-xl transition flex items-center justify-center gap-2 shadow-paper-sm disabled:opacity-50"
                  >
                    {enrollingCourseId === pythonCourse.id ? 'Enrolling...' : 'Enroll & Start Course'}
                  </button>
                )}

                <Link
                  to={`/courses/${pythonCourse.id}`}
                  className="px-6 py-3 bg-surface2 border border-border hover:border-primary/40 text-textSecondary hover:text-textPrimary font-semibold text-xs rounded-xl transition flex items-center justify-center gap-1.5"
                >
                  View Full Syllabus <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Modules Overview */}
            {pythonCourse.modules && (
              <div className="mt-8 pt-6 border-t border-border">
                <h3 className="text-xs font-bold uppercase tracking-wider text-textSecondary mb-4">
                  Curriculum Modules & Assessment Status
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {pythonCourse.modules.map((m, idx) => {
                    const isDone = completedModulesList.includes(m.id);
                    return (
                      <div
                        key={m.id}
                        className={`p-3.5 rounded-xl border text-xs transition ${
                          isDone
                            ? 'bg-primarySoft/60 border-primary/40 text-textPrimary'
                            : 'bg-surface2 border-border text-textSecondary'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] text-primary font-bold">Module {idx + 1}</span>
                          {isDone ? (
                            <span className="flex items-center gap-1 text-[10px] font-semibold text-primary">
                              <CheckCircle2 className="w-3 h-3" /> Completed
                            </span>
                          ) : (
                            <span className="text-[10px] text-textSecondary">{m.durationMinutes} min</span>
                          )}
                        </div>
                        <div className="font-semibold text-textPrimary line-clamp-1">{m.title}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Section: Earned Official Certificates */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-textPrimary flex items-center gap-2">
              <HeadingEmoji emoji="🏆" />Earned Certificates ({certificates.length})
            </h2>
          </div>

          {certificates.length === 0 ? (
            <div className="p-8 text-center bg-surface rounded-2xl border border-border text-xs text-textSecondary">
              Complete all course modules and pass the module quizzes to earn your verified certificate.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {certificates.map((cert) => (
                <div
                  key={cert.id}
                  className="bg-surface p-5 rounded-2xl border border-border shadow-paper-sm flex flex-col justify-between group hover:border-primary/40 transition"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-bold text-primary px-2 py-0.5 rounded bg-primarySoft border border-primary/30">
                        {cert.certificateNumber}
                      </span>
                      <Award className="w-5 h-5 text-accent" />
                    </div>
                    <h3 className="font-bold text-sm text-textPrimary group-hover:text-primary transition">
                      {cert.course?.title || 'Introduction to Python'}
                    </h3>
                    <p className="text-[11px] text-textSecondary mt-1">
                      Issued on {new Date(cert.issuedAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                    <span className="text-[10px] text-primary font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-primary" /> Verified
                    </span>
                    <button
                      onClick={() => setSelectedCert(cert)}
                      className="px-3 py-1.5 bg-surface2 hover:bg-border border border-border text-xs font-bold text-textPrimary hover:text-primary rounded-lg transition"
                    >
                      View Certificate
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Certificate Modal */}
      {selectedCert && (
        <CertificateModal
          certificate={selectedCert}
          onClose={() => setSelectedCert(null)}
        />
      )}
    </div>
  );
};
