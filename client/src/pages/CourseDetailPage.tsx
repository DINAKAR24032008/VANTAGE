import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Course, CourseModule, Certificate } from '../types';
import { AssessmentModal } from '../components/AssessmentModal';
import { CertificateModal } from '../components/CertificateModal';
import { HeadingEmoji } from '../components/HeadingEmoji';
import {
  BookOpen,
  CheckCircle,
  PlayCircle,
  Award,
  Clock,
  User,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  ArrowLeft,
  FileText,
} from 'lucide-react';

function getYouTubeEmbedUrl(url?: string): string | null {
  if (!url) return null;
  const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
  const match = url.match(regExp);
  if (!match || !match[1]) return null;

  const videoId = match[1];
  let params = '?rel=0&modestbranding=1';

  try {
    const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
    const start = parsed.searchParams.get('start') || parsed.searchParams.get('t');
    const end = parsed.searchParams.get('end');
    if (start) {
      const cleanStart = parseInt(start.replace('s', ''), 10);
      if (!isNaN(cleanStart)) params += `&start=${cleanStart}`;
    }
    if (end) {
      const cleanEnd = parseInt(end.replace('s', ''), 10);
      if (!isNaN(cleanEnd)) params += `&end=${cleanEnd}`;
    }
  } catch (e) {
    // URL parsing fallback
  }

  return `https://www.youtube-nocookie.com/embed/${videoId}${params}`;
}

export const CourseDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [course, setCourse] = useState<Course | null>(null);
  const [activeModuleIndex, setActiveModuleIndex] = useState<number>(0);
  const [completedModules, setCompletedModules] = useState<Set<string>>(new Set());
  const [isEnrolled, setIsEnrolled] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [enrolling, setEnrolling] = useState<boolean>(false);
  const [showAssessment, setShowAssessment] = useState<boolean>(false);
  const [activeQuizModule, setActiveQuizModule] = useState<{ id: string; title: string } | null>(null);
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [showCertificate, setShowCertificate] = useState<boolean>(false);

  useEffect(() => {
    if (id) {
      fetchCourseDetails();
    }
  }, [id, user]);

  const fetchCourseDetails = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/courses/${id}`);
      setCourse(res.data);

      if (user) {
        try {
          const enrollRes = await api.get('/enrollments/my');
          const myEnrollment = enrollRes.data.find((e: any) => e.courseId === id);
          if (myEnrollment) {
            setIsEnrolled(true);
            let compMods: string[] = [];
            if (Array.isArray(myEnrollment.completedModules)) {
              compMods = myEnrollment.completedModules;
            } else if (typeof myEnrollment.completedModules === 'string') {
              try {
                compMods = JSON.parse(myEnrollment.completedModules);
              } catch (e) {
                compMods = [];
              }
            }
            setCompletedModules(new Set(compMods));
          }
        } catch (err) {
          console.error('Failed to load enrollments:', err);
        }

        try {
          const certRes = await api.get('/certificates/my');
          const myCert = certRes.data.find((c: any) => c.courseId === id);
          if (myCert) {
            setCertificate(myCert);
          }
        } catch (err) {
          console.error('Failed to load certificate:', err);
        }
      }
    } catch (err) {
      console.error('Failed to load course details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async () => {
    if (!id || !user) return;
    try {
      setEnrolling(true);
      await api.post('/enrollments', { courseId: id });
      setIsEnrolled(true);
      fetchCourseDetails();
    } catch (err) {
      console.error('Enrollment error:', err);
    } finally {
      setEnrolling(false);
    }
  };

  const handleToggleModuleComplete = async (moduleId: string) => {
    if (!id || !isEnrolled) return;
    try {
      const nextSet = new Set(completedModules);
      if (nextSet.has(moduleId)) {
        nextSet.delete(moduleId);
      } else {
        nextSet.add(moduleId);
      }
      setCompletedModules(nextSet);

      await api.put(`/enrollments/course/${id}/progress`, {
        completedModules: Array.from(nextSet),
      });
    } catch (err) {
      console.error('Failed to update progress:', err);
    }
  };

  const handleAssessmentPassed = (cert: any, _attemptResult?: any) => {
    if (cert) {
      setCertificate(cert);
      setShowAssessment(false);
      setShowCertificate(true);
    } else if (activeQuizModule) {
      // Per-module quiz passed
      handleToggleModuleComplete(activeQuizModule.id);
      setShowAssessment(false);
    }
    fetchCourseDetails();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-xs font-semibold text-textSecondary">Loading course syllabus...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-textSecondary text-xs">
        Course not found.
      </div>
    );
  }

  const activeModule: CourseModule | undefined = course.modules[activeModuleIndex];
  const progressPercent = course.modules.length > 0
    ? Math.round((completedModules.size / course.modules.length) * 100)
    : 0;

  const activeModuleEmbedUrl = getYouTubeEmbedUrl(activeModule?.videoUrl);
  const hasModuleAssessments = Boolean(course.assessments && course.assessments.length > 0);
  const activeModuleQuiz = activeModule ? course.assessments?.find((a) => a.moduleId === activeModule.id) : undefined;
  const hasActiveModuleQuiz = Boolean(activeModuleQuiz);
  const isActiveModuleCompleted = activeModule ? completedModules.has(activeModule.id) : false;

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-semibold text-textSecondary">
          <Link to="/catalog" className="hover:text-primary flex items-center gap-1 transition">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Curriculum Catalog
          </Link>
        </div>

        {/* Course Header Banner */}
        <div className="bg-surface text-textPrimary rounded-3xl p-6 sm:p-8 shadow-paper-sm border border-border">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2 max-w-3xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-primarySoft text-primary border border-primary/30">
                  {course.difficultyLevel} Specialization
                </span>
                <span className="text-xs text-textSecondary flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-textSecondary" /> Instructor:{' '}
                  <Link
                    to={`/profile/${course.trainerId}`}
                    className="text-textPrimary hover:text-primary hover:underline font-bold"
                  >
                    {course.trainer?.name}
                  </Link>
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-bold text-textPrimary tracking-tight">
                <HeadingEmoji emoji="📖" />{course.title}
              </h1>
              <p className="text-xs sm:text-sm text-textSecondary leading-relaxed">
                {course.description}
              </p>

              <div className="flex flex-wrap gap-2 pt-2">
                {course.competencyTags.map((tag) => (
                  <span
                    key={tag.id}
                    className="text-[11px] bg-surface2 text-textSecondary px-2.5 py-1 rounded-lg border border-border font-medium"
                  >
                    Target: <strong className="text-textPrimary">{tag.competency.name}</strong> (Level {tag.targetLevel})
                  </span>
                ))}
              </div>
            </div>

            {/* Action Card */}
            <div className="bg-surface2 p-5 rounded-2xl border border-border text-center min-w-[240px] space-y-3">
              {certificate ? (
                <div>
                  <div className="w-12 h-12 rounded-full bg-primarySoft border border-primary/30 text-primary mx-auto flex items-center justify-center mb-2">
                    <Award className="w-6 h-6" />
                  </div>
                  <div className="text-xs font-bold text-primary">Course Passed</div>
                  <p className="text-[10px] text-textSecondary">Certificate Issued</p>
                  <button
                    onClick={() => setShowCertificate(true)}
                    className="mt-3 w-full py-2 bg-primary hover:bg-primaryHover text-primaryContrast font-bold text-xs rounded-xl transition shadow-paper-sm"
                  >
                    View Official Certificate
                  </button>
                </div>
              ) : isEnrolled ? (
                <div>
                  <div className="text-xs text-textSecondary mb-1">Your Progress</div>
                  <div className="text-3xl font-black text-primary">{progressPercent}%</div>
                  <div className="w-full bg-border rounded-full h-2 my-2 overflow-hidden">
                    <div
                      className="bg-primary h-full transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-textSecondary">
                    {completedModules.size} of {course.modules.length} Modules Finished
                  </p>

                  {hasModuleAssessments ? (
                    <div className="mt-3 text-[11px] text-primary bg-primarySoft border border-primary/30 rounded-xl p-2 font-medium">
                      Pass each module quiz (≥70%) to progress &amp; earn certification.
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setActiveQuizModule(null);
                        setShowAssessment(true);
                      }}
                      className="mt-3 w-full py-2 bg-primary hover:bg-primaryHover text-primaryContrast font-bold text-xs rounded-xl transition shadow-paper-sm flex items-center justify-center gap-1.5"
                    >
                      <Award className="w-4 h-4" /> Take Competency Quiz
                    </button>
                  )}
                </div>
              ) : (
                <div>
                  <div className="text-xs text-textSecondary mb-2">Enrollment Status</div>
                  <button
                    onClick={handleEnroll}
                    disabled={enrolling}
                    className="w-full py-3 bg-primary hover:bg-primaryHover text-primaryContrast font-bold text-xs rounded-xl transition shadow-paper-sm flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {enrolling ? 'Enrolling...' : 'Enroll in Course'}
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <p className="text-[10px] text-textSecondary mt-2">
                    Includes practical assignments &amp; verified certification
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Course Modules & Lesson Viewer */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Module List Sidebar */}
          <div className="lg:col-span-1 bg-surface p-5 rounded-2xl border border-border shadow-paper-sm space-y-4">
            <h3 className="font-bold text-sm text-textPrimary flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-accent" />
              Instructional Modules ({course.modules.length})
            </h3>

            <div className="space-y-2">
              {course.modules.map((module, idx) => {
                const isSelected = activeModuleIndex === idx;
                const isCompleted = completedModules.has(module.id);
                const hasQuiz = course.assessments?.some((a) => a.moduleId === module.id);

                return (
                  <div
                    key={module.id}
                    onClick={() => setActiveModuleIndex(idx)}
                    className={`p-3.5 rounded-xl border text-xs cursor-pointer transition flex items-start justify-between gap-3 ${
                      isSelected
                        ? 'bg-primarySoft border-primary text-primary font-bold shadow-paper-sm'
                        : 'bg-surface border-border hover:border-primary/30 hover:bg-surface2'
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5 text-[10px] text-textSecondary mb-0.5 font-medium">
                        <span>Module {idx + 1}</span>
                        <span>•</span>
                        <Clock className="w-3 h-3" />
                        <span>{module.durationMinutes} mins</span>
                      </div>
                      <p className={`font-semibold ${isSelected ? 'text-primary' : 'text-textPrimary'}`}>
                        {module.title}
                      </p>
                    </div>

                    {isEnrolled && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveModuleIndex(idx);
                          if (hasQuiz && !isCompleted) {
                            setActiveQuizModule({ id: module.id, title: module.title });
                            setShowAssessment(true);
                          } else if (!hasQuiz) {
                            handleToggleModuleComplete(module.id);
                          }
                        }}
                        className={`p-1 rounded-md transition ${
                          isCompleted
                            ? 'text-primary'
                            : hasQuiz
                            ? 'text-accent'
                            : 'text-textSecondary/40 hover:text-textSecondary'
                        }`}
                        title={
                          isCompleted
                            ? 'Completed'
                            : hasQuiz
                            ? 'Quiz required to complete'
                            : 'Mark completed'
                        }
                      >
                        <CheckCircle className={`w-5 h-5 ${isCompleted ? 'fill-primarySoft' : ''}`} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Module Reader / Content Player */}
          <div className="lg:col-span-2 bg-surface p-6 sm:p-8 rounded-2xl border border-border shadow-paper-sm space-y-6">
            {activeModule ? (
              <>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-border gap-2">
                  <div>
                    <span className="text-[10px] text-accent font-bold uppercase">
                      Module {activeModuleIndex + 1}
                    </span>
                    <h2 className="text-xl font-bold text-textPrimary mt-0.5">{activeModule.title}</h2>
                  </div>

                  {isEnrolled && (
                    hasActiveModuleQuiz ? (
                      isActiveModuleCompleted ? (
                        <div className="flex items-center gap-2">
                          <span className="px-3.5 py-2 rounded-xl text-xs font-bold bg-primarySoft text-primary border border-primary/30 flex items-center gap-1.5 shadow-paper-sm">
                            <CheckCircle className="w-4 h-4" /> Quiz Passed (Complete)
                          </span>
                          <button
                            onClick={() => {
                              setActiveQuizModule({ id: activeModule.id, title: activeModule.title });
                              setShowAssessment(true);
                            }}
                            className="px-3 py-2 text-xs text-textSecondary hover:text-textPrimary border border-border rounded-xl hover:bg-surface2 transition font-semibold"
                          >
                            Retake Quiz
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setActiveQuizModule({ id: activeModule.id, title: activeModule.title });
                            setShowAssessment(true);
                          }}
                          className="px-4 py-2 bg-primary hover:bg-primaryHover text-primaryContrast rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-paper-sm"
                        >
                          <Award className="w-4 h-4" /> Take Module Quiz (5 Questions)
                        </button>
                      )
                    ) : (
                      <button
                        onClick={() => handleToggleModuleComplete(activeModule.id)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                          isActiveModuleCompleted
                            ? 'bg-primarySoft text-primary border border-primary/30'
                            : 'bg-primary hover:bg-primaryHover text-primaryContrast shadow-paper-sm'
                        }`}
                      >
                        <CheckCircle className="w-4 h-4" />
                        {isActiveModuleCompleted ? 'Completed' : 'Mark as Complete'}
                      </button>
                    )
                  )}
                </div>

                {/* Module Video Player if videoUrl exists */}
                {activeModuleEmbedUrl && (
                  <div className="space-y-2">
                    <div className="w-full aspect-video rounded-2xl overflow-hidden bg-surface2 shadow-paper-sm border border-border">
                      <iframe
                        src={activeModuleEmbedUrl}
                        title={activeModule.title}
                        className="w-full h-full border-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-textSecondary px-1 font-medium">
                      <span className="flex items-center gap-1">
                        <PlayCircle className="w-3.5 h-3.5 text-accent" /> Interactive Video Lecture
                      </span>
                      <span>Duration: ~{activeModule.durationMinutes} mins</span>
                    </div>
                  </div>
                )}

                {/* Lesson Notes & Technical Specs */}
                <div className="prose max-w-none text-xs sm:text-sm leading-relaxed text-textPrimary bg-surface2 p-6 rounded-2xl border border-border whitespace-pre-wrap">
                  {activeModule.contentMarkdown || (
                    <div>
                      <p className="font-semibold text-textPrimary">Module Overview:</p>
                      <p className="text-textSecondary mt-1">
                        This module covers key principles, syntax, operational workflows, and data structures
                        utilized across scientific workflows. Please review the video lecture and technical
                        notes before attempting the evaluation quiz.
                      </p>
                    </div>
                  )}
                </div>

                {/* Quick Next Module CTA */}
                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <button
                    disabled={activeModuleIndex === 0}
                    onClick={() => setActiveModuleIndex((prev) => prev - 1)}
                    className="px-3 py-1.5 rounded-lg border border-border text-xs font-semibold text-textSecondary hover:text-textPrimary hover:bg-surface2 disabled:opacity-30"
                  >
                    Previous Module
                  </button>

                  {activeModuleIndex < course.modules.length - 1 ? (
                    <button
                      onClick={() => setActiveModuleIndex((prev) => prev + 1)}
                      className="px-4 py-1.5 bg-primary hover:bg-primaryHover text-primaryContrast rounded-lg text-xs font-bold flex items-center gap-1 transition shadow-paper-sm"
                    >
                      Next Module <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  ) : hasModuleAssessments ? (
                    certificate ? (
                      <button
                        onClick={() => setShowCertificate(true)}
                        className="px-4 py-2 bg-primary hover:bg-primaryHover text-primaryContrast rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-paper-sm"
                      >
                        <Award className="w-4 h-4" /> View Course Certificate
                      </button>
                    ) : (
                      <button
                        disabled={!isActiveModuleCompleted}
                        onClick={() => {
                          if (activeModule) {
                            setActiveQuizModule({ id: activeModule.id, title: activeModule.title });
                            setShowAssessment(true);
                          }
                        }}
                        className="px-4 py-2 bg-primary hover:bg-primaryHover text-primaryContrast rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-paper-sm disabled:opacity-50"
                      >
                        <Award className="w-4 h-4" /> Final Module Quiz
                      </button>
                    )
                  ) : (
                    <button
                      onClick={() => {
                        setActiveQuizModule(null);
                        setShowAssessment(true);
                      }}
                      className="px-4 py-2 bg-primary hover:bg-primaryHover text-primaryContrast rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-paper-sm"
                    >
                      <Award className="w-4 h-4" /> Take Final Assessment
                    </button>
                  )}
                </div>
              </>
            ) : (
              <div className="py-12 text-center text-textSecondary text-xs">
                Select a module from the list to view lessons and video content.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Assessment Evaluation Modal */}
      {showAssessment && (
        <AssessmentModal
          courseId={course.id}
          courseTitle={course.title}
          moduleId={activeQuizModule?.id}
          moduleTitle={activeQuizModule?.title}
          onClose={() => setShowAssessment(false)}
          onAssessmentPassed={handleAssessmentPassed}
        />
      )}

      {/* Certificate Display Modal */}
      {showCertificate && (
        <CertificateModal
          certificate={certificate}
          onClose={() => setShowCertificate(false)}
        />
      )}
    </div>
  );
};
