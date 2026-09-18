import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Course, CourseModule, Certificate } from '../types';
import { AssessmentModal } from '../components/AssessmentModal';
import { CertificateModal } from '../components/CertificateModal';
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
  const [showCertificate, setShowCertificate] = useState<boolean>(false);
  const [certificate, setCertificate] = useState<Certificate | null>(null);

  useEffect(() => {
    if (id) {
      loadCourseDetails();
    }
  }, [id]);

  const loadCourseDetails = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/courses/${id}`);
      setCourse(res.data);

      if (res.data.userEnrollment) {
        setIsEnrolled(true);
        setCompletedModules(new Set(res.data.userEnrollment.completedModules || []));
      }

      // Check if user already holds a certificate for this course
      if (user) {
        const certRes = await api.get('/certificates/my');
        const existingCert = certRes.data.find((c: Certificate) => c.courseId === id);
        if (existingCert) {
          setCertificate(existingCert);
        }
      }
    } catch (err) {
      console.error('Failed to fetch course details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async () => {
    try {
      setEnrolling(true);
      await api.post('/enrollments', { courseId: id });
      setIsEnrolled(true);
      await loadCourseDetails();
    } catch (err) {
      console.error('Enrollment error:', err);
    } finally {
      setEnrolling(false);
    }
  };

  const handleToggleModuleComplete = async (moduleId: string) => {
    if (!isEnrolled || !id) return;

    const isDone = completedModules.has(moduleId);
    try {
      const res = await api.put(`/enrollments/${id}/progress`, {
        moduleId,
        markCompleted: !isDone,
      });

      setCompletedModules(new Set(res.data.enrollment.completedModules));
      if (course && course.userEnrollment) {
        course.userEnrollment.progressPercent = res.data.enrollment.progressPercent;
      }
    } catch (err) {
      console.error('Progress update error:', err);
    }
  };

  if (loading || !course) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const activeModule: CourseModule | undefined = course.modules[activeModuleIndex];
  const progressPercent = course.modules.length > 0
    ? Math.round((completedModules.size / course.modules.length) * 100)
    : 0;

  const hasModuleAssessments = Boolean(course.assessments && course.assessments.some((a) => a.moduleId));
  const activeModuleAssessment = course.assessments?.find((a) => a.moduleId === activeModule?.id);
  const hasActiveModuleQuiz = Boolean(activeModuleAssessment);
  const isActiveModuleCompleted = activeModule ? completedModules.has(activeModule.id) : false;
  const activeModuleEmbedUrl = activeModule ? getYouTubeEmbedUrl(activeModule.videoUrl) : null;

  return (
    <div className="min-h-screen bg-background text-textPrimary py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-semibold text-textSecondary">
          <Link to="/catalog" className="hover:text-accent flex items-center gap-1 transition">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Curriculum Catalog
          </Link>
        </div>

        {/* Course Header Banner */}
        <div className="bg-surface text-textPrimary rounded-3xl p-6 sm:p-8 shadow-xl border border-surfaceBorder">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2 max-w-3xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded bg-background text-accent border border-surfaceBorder">
                  {course.difficultyLevel} Specialization
                </span>
                <span className="text-xs text-textSecondary flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-textSecondary" /> Instructor: {course.trainer?.name}
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-display italic text-textPrimary tracking-tight">
                {course.title}
              </h1>
              <p className="text-xs sm:text-sm text-textSecondary leading-relaxed">
                {course.description}
              </p>

              <div className="flex flex-wrap gap-2 pt-2">
                {course.competencyTags.map((tag) => (
                  <span
                    key={tag.id}
                    className="text-[11px] bg-background text-textSecondary px-2.5 py-1 rounded-lg border border-border font-medium"
                  >
                    Target: <strong className="text-textPrimary">{tag.competency.name}</strong> (Level {tag.targetLevel})
                  </span>
                ))}
              </div>
            </div>

            {/* Action Card */}
            <div className="bg-background/90 p-5 rounded-2xl border border-surfaceBorder text-center min-w-[240px] space-y-3">
              {certificate ? (
                <div>
                  <div className="w-12 h-12 rounded-full bg-accent/15 border border-accent/40 text-accent mx-auto flex items-center justify-center mb-2 shadow-[0_0_10px_rgba(57,255,20,0.3)]">
                    <Award className="w-6 h-6" />
                  </div>
                  <div className="text-xs font-bold text-accent">Course Passed</div>
                  <p className="text-[10px] text-textSecondary">Certificate Issued</p>
                  <button
                    onClick={() => setShowCertificate(true)}
                    className="mt-3 w-full py-2 bg-accent hover:bg-accentMuted text-background font-bold text-xs rounded-xl transition shadow-[0_0_10px_rgba(57,255,20,0.3)]"
                  >
                    View Official Certificate
                  </button>
                </div>
              ) : isEnrolled ? (
                <div>
                  <div className="text-xs text-textSecondary mb-1">Your Progress</div>
                  <div className="text-3xl font-black text-accent">{progressPercent}%</div>
                  <div className="w-full bg-border rounded-full h-2 my-2 overflow-hidden">
                    <div
                      className="bg-accent h-full transition-all duration-300 shadow-[0_0_6px_rgba(57,255,20,0.5)]"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-textSecondary">
                    {completedModules.size} of {course.modules.length} Modules Finished
                  </p>

                  {hasModuleAssessments ? (
                    <div className="mt-3 text-[11px] text-accent bg-surface border border-accent/40 rounded-xl p-2 font-medium">
                      Pass each module quiz (≥70%) to progress & earn certification.
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setActiveQuizModule(null);
                        setShowAssessment(true);
                      }}
                      className="mt-3 w-full py-2 bg-accent hover:bg-accentMuted text-background font-bold text-xs rounded-xl transition shadow-[0_0_10px_rgba(57,255,20,0.3)] flex items-center justify-center gap-1.5"
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
                    className="w-full py-3 bg-accent hover:bg-accentMuted text-background font-bold text-xs rounded-xl transition shadow-[0_0_12px_rgba(57,255,20,0.3)] flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {enrolling ? 'Enrolling...' : 'Enroll in Course'}
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <p className="text-[10px] text-textSecondary mt-2">
                    Includes practical assignments & verified certification
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Course Modules & Lesson Viewer */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Module List Sidebar */}
          <div className="lg:col-span-1 bg-surface p-5 rounded-2xl border border-surfaceBorder shadow-sm space-y-4">
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
                        ? 'bg-background border-accent/60 shadow-[0_0_8px_rgba(57,255,20,0.15)]'
                        : 'bg-surface border-surfaceBorder hover:border-accent/30 hover:bg-background/40'
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5 text-[10px] text-textSecondary font-mono mb-0.5">
                        <span>Module {idx + 1}</span>
                        <span>•</span>
                        <Clock className="w-3 h-3" />
                        <span>{module.durationMinutes} mins</span>
                      </div>
                      <p className={`font-semibold ${isSelected ? 'text-accent' : 'text-textPrimary'}`}>
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
                            ? 'text-accent hover:text-accentMuted'
                            : hasQuiz
                            ? 'text-amber-400 hover:text-amber-300'
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
                        <CheckCircle className={`w-5 h-5 ${isCompleted ? 'fill-accent/20' : ''}`} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Module Reader / Content Player */}
          <div className="lg:col-span-2 bg-surface p-6 sm:p-8 rounded-2xl border border-surfaceBorder shadow-sm space-y-6">
            {activeModule ? (
              <>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-surfaceBorder gap-2">
                  <div>
                    <span className="text-[10px] font-mono text-accent font-bold uppercase">
                      Module {activeModuleIndex + 1}
                    </span>
                    <h2 className="text-xl font-bold text-textPrimary mt-0.5">{activeModule.title}</h2>
                  </div>

                  {isEnrolled && (
                    hasActiveModuleQuiz ? (
                      isActiveModuleCompleted ? (
                        <div className="flex items-center gap-2">
                          <span className="px-3.5 py-2 rounded-xl text-xs font-bold bg-background text-accent border border-accent/40 flex items-center gap-1.5 shadow-[0_0_6px_rgba(57,255,20,0.2)]">
                            <CheckCircle className="w-4 h-4" /> Quiz Passed (Complete)
                          </span>
                          <button
                            onClick={() => {
                              setActiveQuizModule({ id: activeModule.id, title: activeModule.title });
                              setShowAssessment(true);
                            }}
                            className="px-3 py-2 text-xs text-textSecondary hover:text-textPrimary border border-border rounded-xl hover:bg-surfaceBorder/30 transition font-semibold"
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
                          className="px-4 py-2 bg-accent hover:bg-accentMuted text-background rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-[0_0_10px_rgba(57,255,20,0.3)]"
                        >
                          <Award className="w-4 h-4" /> Take Module Quiz (5 Questions)
                        </button>
                      )
                    ) : (
                      <button
                        onClick={() => handleToggleModuleComplete(activeModule.id)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                          isActiveModuleCompleted
                            ? 'bg-background text-accent border border-accent/40'
                            : 'bg-accent hover:bg-accentMuted text-background shadow-[0_0_10px_rgba(57,255,20,0.3)]'
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
                    <div className="w-full aspect-video rounded-2xl overflow-hidden bg-black shadow-md border border-surfaceBorder">
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
                <div className="prose prose-invert max-w-none text-xs sm:text-sm leading-relaxed text-textPrimary bg-background p-6 rounded-2xl border border-border whitespace-pre-wrap">
                  {activeModule.contentMarkdown || (
                    <div>
                      <p className="font-semibold text-textPrimary">Module Overview:</p>
                      <p className="text-textSecondary">
                        This module covers key principles, syntax, operational workflows, and data structures
                        utilized across scientific workflows. Please review the video lecture and technical
                        notes before attempting the evaluation quiz.
                      </p>
                    </div>
                  )}
                </div>

                {/* Quick Next Module CTA */}
                <div className="flex items-center justify-between pt-4 border-t border-surfaceBorder">
                  <button
                    disabled={activeModuleIndex === 0}
                    onClick={() => setActiveModuleIndex((prev) => prev - 1)}
                    className="px-3 py-1.5 rounded-lg border border-border text-xs font-semibold text-textSecondary hover:text-textPrimary hover:bg-surfaceBorder/30 disabled:opacity-30"
                  >
                    Previous Module
                  </button>

                  {activeModuleIndex < course.modules.length - 1 ? (
                    <button
                      onClick={() => setActiveModuleIndex((prev) => prev + 1)}
                      className="px-4 py-1.5 bg-accent hover:bg-accentMuted text-background rounded-lg text-xs font-bold flex items-center gap-1 transition shadow-[0_0_10px_rgba(57,255,20,0.2)]"
                    >
                      Next Module <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  ) : hasModuleAssessments ? (
                    certificate ? (
                      <button
                        onClick={() => setShowCertificate(true)}
                        className="px-4 py-2 bg-accent hover:bg-accentMuted text-background rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-[0_0_10px_rgba(57,255,20,0.3)]"
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
                        className="px-4 py-2 bg-accent hover:bg-accentMuted text-background rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-[0_0_10px_rgba(57,255,20,0.3)] disabled:opacity-50"
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
                      className="px-4 py-2 bg-accent hover:bg-accentMuted text-background rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-[0_0_10px_rgba(57,255,20,0.3)]"
                    >
                      <Award className="w-4 h-4" /> Take Final Assessment
                    </button>
                  )}
                </div>
              </>
            ) : (
              <div className="py-20 text-center text-textSecondary text-xs">
                Select a module from the syllabus on the left.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Assessment Quiz Modal */}
      {showAssessment && (
        <AssessmentModal
          courseId={course.id}
          courseTitle={course.title}
          moduleId={activeQuizModule?.id}
          moduleTitle={activeQuizModule?.title}
          onClose={() => {
            setShowAssessment(false);
            setActiveQuizModule(null);
          }}
          onAssessmentPassed={(newCert) => {
            if (activeQuizModule) {
              setCompletedModules((prev) => new Set([...prev, activeQuizModule.id]));
            }
            if (newCert) {
              setCertificate(newCert);
              setShowCertificate(true);
            }
            loadCourseDetails();
          }}
        />
      )}

      {/* Certificate Viewer Modal */}
      <CertificateModal
        certificate={certificate}
        onClose={() => setShowCertificate(false)}
      />
    </div>
  );
};
