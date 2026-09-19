import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { CertificateModal } from '../components/CertificateModal';
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

  useEffect(() => {
    if (user?.id) {
      loadDashboardData();
    }
  }, [user?.id]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [coursesRes, enrollsRes, certsRes] = await Promise.all([
        api.get('/courses'),
        api.get('/enrollments/my'),
        api.get('/certificates/my'),
      ]);
      setCourses(coursesRes.data);
      setEnrollments(enrollsRes.data);
      setCertificates(certsRes.data);
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
          <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
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
        {/* Welcome Hero Banner */}
        <div className="bg-surface rounded-3xl p-6 sm:p-8 text-textPrimary shadow-xl relative overflow-hidden border border-surfaceBorder">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-accent/5 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 relative z-10">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 rounded-full bg-background text-accent text-[11px] font-mono font-bold uppercase tracking-wider border border-surfaceBorder">
                  Learner Dashboard
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-display italic text-textPrimary tracking-tight">
                Welcome back, {user?.name}
              </h1>
              <p className="text-xs sm:text-sm text-textSecondary mt-1 max-w-2xl">
                Track your course progress, watch video lectures, complete interactive quizzes, and earn verifiable certificates.
              </p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="bg-background/80 border border-surfaceBorder p-3.5 rounded-2xl text-center min-w-[100px]">
                <div className="text-2xl font-black text-accent">{enrollments.length}</div>
                <div className="text-[10px] text-textSecondary uppercase font-semibold mt-0.5">Enrolled</div>
              </div>
              <div className="bg-background/80 border border-surfaceBorder p-3.5 rounded-2xl text-center min-w-[100px]">
                <div className="text-2xl font-black text-accent">
                  {enrollments.filter((e) => e.status === 'completed').length}
                </div>
                <div className="text-[10px] text-textSecondary uppercase font-semibold mt-0.5">Completed</div>
              </div>
              <div className="bg-background/80 border border-surfaceBorder p-3.5 rounded-2xl text-center min-w-[100px] col-span-2 sm:col-span-1">
                <div className="text-2xl font-black text-accent">{certificates.length}</div>
                <div className="text-[10px] text-textSecondary uppercase font-semibold mt-0.5">Certificates</div>
              </div>
            </div>
          </div>
        </div>

        {/* Featured Program: Introduction to Python */}
        {pythonCourse && (
          <div className="bg-surface rounded-3xl p-6 sm:p-8 border border-surfaceBorder shadow-xl relative overflow-hidden">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div className="space-y-3 max-w-2xl">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded bg-background text-accent border border-surfaceBorder">
                    {pythonCourse.difficultyLevel} Level
                  </span>
                  <span className="text-xs text-textSecondary font-medium flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-accent" /> 6 Modular Video Lessons & Assessments
                  </span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-display italic text-textPrimary">
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
                      <span className="text-accent font-mono font-bold">
                        {pythonEnrollment.progressPercent}%
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-background rounded-full overflow-hidden border border-surfaceBorder">
                      <div
                        className="h-full bg-accent rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(57,255,20,0.5)]"
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
                    className="px-6 py-3 bg-accent hover:bg-accentMuted text-background font-bold text-sm rounded-xl transition flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(57,255,20,0.35)]"
                  >
                    <PlayCircle className="w-4 h-4" /> Continue Learning
                  </Link>
                ) : (
                  <button
                    onClick={() => handleEnroll(pythonCourse.id)}
                    disabled={enrollingCourseId === pythonCourse.id}
                    className="px-6 py-3 bg-accent hover:bg-accentMuted text-background font-bold text-sm rounded-xl transition flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(57,255,20,0.35)] disabled:opacity-50"
                  >
                    {enrollingCourseId === pythonCourse.id ? 'Enrolling...' : 'Enroll & Start Course'}
                  </button>
                )}

                <Link
                  to={`/courses/${pythonCourse.id}`}
                  className="px-6 py-3 bg-background border border-surfaceBorder hover:border-accent/40 text-textSecondary hover:text-textPrimary font-semibold text-xs rounded-xl transition flex items-center justify-center gap-1.5"
                >
                  View Full Syllabus <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Modules Overview */}
            {pythonCourse.modules && (
              <div className="mt-8 pt-6 border-t border-surfaceBorder">
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
                            ? 'bg-background/90 border-accent/40 text-textPrimary'
                            : 'bg-background/40 border-border text-textSecondary'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-mono text-accent">Module {idx + 1}</span>
                          {isDone ? (
                            <span className="flex items-center gap-1 text-[10px] font-semibold text-accent">
                              <CheckCircle2 className="w-3 h-3" /> Completed
                            </span>
                          ) : (
                            <span className="text-[10px] text-textSecondary font-mono">{m.durationMinutes} min</span>
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
              <Award className="w-5 h-5 text-accent" />
              Earned Certificates ({certificates.length})
            </h2>
          </div>

          {certificates.length === 0 ? (
            <div className="p-8 text-center bg-surface rounded-2xl border border-surfaceBorder text-xs text-textSecondary">
              Complete all course modules and pass the module quizzes to earn your verified certificate.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {certificates.map((cert) => (
                <div
                  key={cert.id}
                  className="bg-surface p-5 rounded-2xl border border-surfaceBorder shadow-sm flex flex-col justify-between group hover:border-accent/40 transition"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-mono font-bold text-accent px-2 py-0.5 rounded bg-background border border-surfaceBorder">
                        {cert.certificateNumber}
                      </span>
                      <Award className="w-5 h-5 text-accent" />
                    </div>
                    <h3 className="font-bold text-sm text-textPrimary group-hover:text-accent transition">
                      {cert.course?.title || 'Introduction to Python'}
                    </h3>
                    <p className="text-[11px] text-textSecondary mt-1">
                      Issued on {new Date(cert.issuedAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-surfaceBorder flex items-center justify-between">
                    <span className="text-[10px] font-mono text-accent flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-accent" /> Verified
                    </span>
                    <button
                      onClick={() => setSelectedCert(cert)}
                      className="px-3 py-1.5 bg-background hover:bg-surface border border-surfaceBorder hover:border-accent/50 text-xs font-bold text-textPrimary hover:text-accent rounded-lg transition"
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
