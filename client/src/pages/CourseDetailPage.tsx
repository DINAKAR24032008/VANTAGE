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
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
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
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <Link to="/catalog" className="hover:text-emerald-600 flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Curriculum Catalog
          </Link>
        </div>

        {/* Course Header Banner */}
        <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2 max-w-3xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {course.difficultyLevel} Specialization
                </span>
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-slate-400" /> Instructor: {course.trainer?.name}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                {course.title}
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {course.description}
              </p>

              <div className="flex flex-wrap gap-2 pt-2">
                {course.competencyTags.map((tag) => (
                  <span
                    key={tag.id}
                    className="text-[11px] bg-slate-800 text-slate-200 px-2.5 py-1 rounded-lg border border-slate-700 font-medium"
                  >
                    Target: {tag.competency.name} (Level {tag.targetLevel})
                  </span>
                ))}
              </div>
            </div>

            {/* Action Card */}
            <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700 text-center min-w-[240px] space-y-3">
              {certificate ? (
                <div>
                  <div className="w-12 h-12 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-400 mx-auto flex items-center justify-center mb-2">
                    <Award className="w-6 h-6" />
                  </div>
                  <div className="text-xs font-bold text-amber-400">Course Passed</div>
                  <p className="text-[10px] text-slate-400">Certificate Issued</p>
                  <button
                    onClick={() => setShowCertificate(true)}
                    className="mt-3 w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition shadow"
                  >
                    View Official Certificate
                  </button>
                </div>
              ) : isEnrolled ? (
                <div>
                  <div className="text-xs text-slate-400 mb-1">Your Progress</div>
                  <div className="text-3xl font-black text-emerald-400">{progressPercent}%</div>
                  <div className="w-full bg-slate-700 rounded-full h-2 my-2 overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-400">
                    {completedModules.size} of {course.modules.length} Modules Finished
                  </p>

                  {hasModuleAssessments ? (
                    <div className="mt-3 text-[11px] text-emerald-400 bg-emerald-950/40 border border-emerald-800/60 rounded-xl p-2 font-medium">
                      Pass each module quiz (≥70%) to progress & earn certification.
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setActiveQuizModule(null);
                        setShowAssessment(true);
                      }}
                      className="mt-3 w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition shadow flex items-center justify-center gap-1.5"
                    >
                      <Award className="w-4 h-4" /> Take Competency Quiz
                    </button>
                  )}
                </div>
              ) : (
                <div>
                  <div className="text-xs text-slate-400 mb-2">Enrollment Status</div>
                  <button
                    onClick={handleEnroll}
                    disabled={enrolling}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition shadow flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {enrolling ? 'Enrolling...' : 'Enroll in Course'}
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <p className="text-[10px] text-slate-400 mt-2">
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
          <div className="lg:col-span-1 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-emerald-600" />
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
                        ? 'bg-emerald-50/80 border-emerald-500 shadow-sm'
                        : 'bg-slate-50 border-slate-200/80 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono mb-0.5">
                        <span>Module {idx + 1}</span>
                        <span>•</span>
                        <Clock className="w-3 h-3" />
                        <span>{module.durationMinutes} mins</span>
                      </div>
                      <p className={`font-semibold ${isSelected ? 'text-emerald-950' : 'text-slate-800'}`}>
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
                            ? 'text-emerald-600 hover:text-emerald-700'
                            : hasQuiz
                            ? 'text-amber-500 hover:text-amber-600'
                            : 'text-slate-300 hover:text-slate-500'
                        }`}
                        title={
                          isCompleted
                            ? 'Completed'
                            : hasQuiz
                            ? 'Quiz required to complete'
                            : 'Mark completed'
                        }
                      >
                        <CheckCircle className={`w-5 h-5 ${isCompleted ? 'fill-emerald-100' : ''}`} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Module Reader / Content Player */}
          <div className="lg:col-span-2 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/90 shadow-sm space-y-6">
            {activeModule ? (
              <>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
                  <div>
                    <span className="text-[10px] font-mono text-emerald-600 font-bold uppercase">
                      Module {activeModuleIndex + 1}
                    </span>
                    <h2 className="text-xl font-black text-slate-900 mt-0.5">{activeModule.title}</h2>
                  </div>

                  {isEnrolled && (
                    hasActiveModuleQuiz ? (
                      isActiveModuleCompleted ? (
                        <div className="flex items-center gap-2">
                          <span className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1.5">
                            <CheckCircle className="w-4 h-4" /> Quiz Passed (Complete)
                          </span>
                          <button
                            onClick={() => {
                              setActiveQuizModule({ id: activeModule.id, title: activeModule.title });
                              setShowAssessment(true);
                            }}
                            className="px-3 py-2 text-xs text-slate-600 hover:text-slate-900 border border-slate-200 rounded-xl hover:bg-slate-50 transition font-semibold"
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
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow"
                        >
                          <Award className="w-4 h-4" /> Take Module Quiz (5 Questions)
                        </button>
                      )
                    ) : (
                      <button
                        onClick={() => handleToggleModuleComplete(activeModule.id)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                          isActiveModuleCompleted
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-slate-900 text-white hover:bg-slate-800 shadow'
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
                    <div className="w-full aspect-video rounded-2xl overflow-hidden bg-slate-950 shadow-md border border-slate-200">
                      <iframe
                        src={activeModuleEmbedUrl}
                        title={activeModule.title}
                        className="w-full h-full border-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 px-1 font-medium">
                      <span className="flex items-center gap-1">
                        <PlayCircle className="w-3.5 h-3.5 text-rose-600" /> Interactive Video Lecture
                      </span>
                      <span>Duration: ~{activeModule.durationMinutes} mins</span>
                    </div>
                  </div>
                )}

                {/* Lesson Notes & Technical Specs */}
                <div className="prose prose-slate max-w-none text-xs sm:text-sm leading-relaxed text-slate-700 bg-slate-50/50 p-6 rounded-2xl border border-slate-200/60 whitespace-pre-wrap">
                  {activeModule.contentMarkdown || (
                    <div>
                      <p className="font-semibold text-slate-900">Module Overview:</p>
                      <p>
                        This module covers key principles, syntax, operational workflows, and data structures
                        utilized across scientific workflows. Please review the video lecture and technical
                        notes before attempting the evaluation quiz.
                      </p>
                    </div>
                  )}
                </div>

                {/* Quick Next Module CTA */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <button
                    disabled={activeModuleIndex === 0}
                    onClick={() => setActiveModuleIndex((prev) => prev - 1)}
                    className="px-3 py-1.5 rounded-lg border text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-30"
                  >
                    Previous Module
                  </button>

                  {activeModuleIndex < course.modules.length - 1 ? (
                    <button
                      onClick={() => setActiveModuleIndex((prev) => prev + 1)}
                      className="px-4 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 flex items-center gap-1"
                    >
                      Next Module <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  ) : hasModuleAssessments ? (
                    certificate ? (
                      <button
                        onClick={() => setShowCertificate(true)}
                        className="px-4 py-2 bg-amber-500 text-slate-950 rounded-xl text-xs font-bold hover:bg-amber-400 flex items-center gap-1.5 shadow"
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
                        className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-500 flex items-center gap-1.5 shadow disabled:opacity-50"
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
                      className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-500 flex items-center gap-1.5 shadow"
                    >
                      <Award className="w-4 h-4" /> Take Final Assessment
                    </button>
                  )}
                </div>
              </>
            ) : (
              <div className="py-20 text-center text-slate-400 text-xs">
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
