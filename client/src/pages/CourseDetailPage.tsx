import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Course, CourseModule, Certificate, CourseMaterial } from '../types';
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
  Download,
  Eye,
  Trash2,
  UploadCloud,
  Lock,
  Plus,
  AlertCircle,
  Check,
  FileCode,
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

function formatBytes(bytes: number): string {
  if (!bytes) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const CourseDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

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

  // Course Study Materials (PDF) State
  const [materials, setMaterials] = useState<CourseMaterial[]>([]);
  const [uploadModalOpen, setUploadModalOpen] = useState<boolean>(false);
  const [uploadTitle, setUploadTitle] = useState<string>('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [materialMessage, setMaterialMessage] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchCourseDetails();
    }
  }, [id, user]);

  const fetchCourseDetails = async (showSpinner = true) => {
    try {
      if (showSpinner) setLoading(true);
      const res = await api.get(`/courses/${id}`);
      setCourse(res.data);
      setMaterials(res.data.materials || []);

      if (res.data.userEnrollment) {
        setIsEnrolled(true);
        setCompletedModules(new Set(res.data.userEnrollment.completedModules || []));
      } else {
        setIsEnrolled(false);
        setCompletedModules(new Set());
      }

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
            if (compMods.length > 0) {
              setCompletedModules(new Set(compMods));
            }
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
      if (showSpinner) setLoading(false);
    }
  };

  const handleEnroll = async (autoOpenQuiz = false, quizModule?: { id: string; title: string }) => {
    if (!id || !user) {
      navigate(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    try {
      setEnrolling(true);
      const res = await api.post('/enrollments', { courseId: id || course?.id });
      setIsEnrolled(true);
      if (res.data?.enrollment?.completedModules) {
        const mods = Array.isArray(res.data.enrollment.completedModules)
          ? res.data.enrollment.completedModules
          : JSON.parse(res.data.enrollment.completedModules || '[]');
        setCompletedModules(new Set(mods));
      }
      await fetchCourseDetails(false);
      if (autoOpenQuiz && quizModule) {
        setActiveQuizModule(quizModule);
        setShowAssessment(true);
      }
    } catch (err: any) {
      console.error('Enrollment error:', err);
      if (err.response?.status === 200 || err.response?.data?.message?.includes('Already enrolled')) {
        setIsEnrolled(true);
        await fetchCourseDetails(false);
        if (autoOpenQuiz && quizModule) {
          setActiveQuizModule(quizModule);
          setShowAssessment(true);
        }
      }
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

  const canManageMaterials =
    user?.role === 'admin' || (user?.role === 'trainer' && course?.trainerId === user?.id);
  const canAccessMaterials = isEnrolled || canManageMaterials;

  const handleAccessMaterial = async (mat: CourseMaterial, inline = false) => {
    if (!canAccessMaterials) {
      setMaterialMessage('Enrollment required: Please enroll in this course to view or download study materials.');
      setTimeout(() => setMaterialMessage(null), 5000);
      return;
    }

    try {
      setDownloadingId(mat.id);
      const res = await api.get(`/courses/${id}/materials/${mat.id}/download${inline ? '?view=true' : ''}`, {
        responseType: 'blob',
      });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const fileUrl = window.URL.createObjectURL(blob);

      if (inline) {
        window.open(fileUrl, '_blank');
      } else {
        const link = document.createElement('a');
        link.href = fileUrl;
        link.setAttribute('download', mat.fileName);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      setTimeout(() => window.URL.revokeObjectURL(fileUrl), 10000);
    } catch (err: any) {
      console.error('Failed to access material:', err);
      setMaterialMessage('Failed to download study material. Please try again.');
      setTimeout(() => setMaterialMessage(null), 5000);
    } finally {
      setDownloadingId(null);
    }
  };

  const handleUploadMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile || !id) return;

    if (!uploadFile.name.toLowerCase().endsWith('.pdf')) {
      setUploadError('Only PDF files (.pdf) are allowed.');
      return;
    }

    if (uploadFile.size > 15 * 1024 * 1024) {
      setUploadError('File size exceeds the 15 MB limit.');
      return;
    }

    try {
      setUploading(true);
      setUploadError(null);
      const formData = new FormData();
      formData.append('file', uploadFile);
      if (uploadTitle.trim()) {
        formData.append('title', uploadTitle.trim());
      }

      const res = await api.post(`/courses/${id}/materials`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setMaterials((prev) => [...prev, res.data.material]);
      setUploadFile(null);
      setUploadTitle('');
      setUploadModalOpen(false);
      setMaterialMessage('Study material uploaded successfully!');
      setTimeout(() => setMaterialMessage(null), 4000);
    } catch (err: any) {
      console.error('Failed to upload material:', err);
      setUploadError(err.response?.data?.error || 'Failed to upload PDF study material.');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteMaterial = async (matId: string) => {
    if (!id || !window.confirm('Are you sure you want to permanently delete this study material?')) return;

    try {
      await api.delete(`/courses/${id}/materials/${matId}`);
      setMaterials((prev) => prev.filter((m) => m.id !== matId));
      setMaterialMessage('Study material deleted successfully.');
      setTimeout(() => setMaterialMessage(null), 4000);
    } catch (err: any) {
      console.error('Failed to delete material:', err);
      setMaterialMessage('Failed to delete material.');
      setTimeout(() => setMaterialMessage(null), 4000);
    }
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
                    onClick={() => handleEnroll()}
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

        {/* Full-Width Course Completion Progress Bar (for Enrolled Learners) */}
        {isEnrolled && (
          <div className="bg-surface rounded-2xl p-5 border border-surfaceBorder shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-accent/15 border border-accent/30 text-accent flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-accent" />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-textPrimary">
                    Course Completion Progress
                  </h3>
                  <p className="text-xs text-textSecondary">
                    {completedModules.size} of {course.modules.length} modules complete — {progressPercent}%
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {progressPercent === 100 ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-accent/20 border border-accent/40 text-accent rounded-full text-xs font-bold font-mono shadow-[0_0_8px_rgba(57,255,20,0.3)]">
                    <CheckCircle className="w-3.5 h-3.5" /> 100% Completed
                  </span>
                ) : (
                  <span className="text-xs font-mono font-bold text-accent bg-background px-3 py-1 rounded-full border border-surfaceBorder">
                    {course.modules.length - completedModules.size} module{course.modules.length - completedModules.size === 1 ? '' : 's'} remaining
                  </span>
                )}
              </div>
            </div>

            <div className="w-full bg-background rounded-full h-3 overflow-hidden border border-surfaceBorder p-0.5">
              <div
                className="bg-accent h-full rounded-full transition-all duration-500 shadow-[0_0_12px_rgba(57,255,20,0.6)]"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

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
                        : isCompleted
                        ? 'bg-surface border-primary/20 hover:border-primary/40'
                        : 'bg-surface border-border hover:border-primary/30 hover:bg-surface2'
                    }`}
                  >
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between gap-1.5 text-[10px]">
                        <span className="text-textSecondary flex items-center gap-1 font-medium">
                          Module {idx + 1} • <Clock className="w-3 h-3" /> {module.durationMinutes} mins
                        </span>
                        {isEnrolled && (
                          isCompleted ? (
                            <span className="inline-flex items-center gap-1 font-bold text-primary bg-primarySoft border border-primary/30 px-1.5 py-0.5 rounded text-[9px]">
                              <CheckCircle className="w-2.5 h-2.5" /> Done
                            </span>
                          ) : (
                            <span className="text-textSecondary/60 text-[9px]">
                              Incomplete
                            </span>
                          )
                        )}
                      </div>
                      <p className={`font-semibold line-clamp-2 ${isSelected ? 'text-primary' : isCompleted ? 'text-textPrimary' : 'text-textPrimary/80'}`}>
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
                        <CheckCircle className={`w-5 h-5 ${isCompleted ? 'fill-primarySoft text-primary' : ''}`} />
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

                  {isEnrolled ? (
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
                          <Award className="w-4 h-4" /> Take Module Quiz (10 Questions)
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
                  ) : (
                    <button
                      onClick={() => handleEnroll(true, { id: activeModule.id, title: activeModule.title })}
                      disabled={enrolling}
                      className="px-4 py-2 bg-accent hover:bg-accentMuted text-background rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-[0_0_10px_rgba(57,255,20,0.3)]"
                    >
                      <Award className="w-4 h-4" /> {enrolling ? 'Enrolling...' : 'Enroll & Take Module Quiz'}
                    </button>
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
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] text-textSecondary px-1 font-medium">
                      <span className="flex items-center gap-1">
                        <PlayCircle className="w-3.5 h-3.5 text-accent" /> Interactive Video Lecture
                      </span>
                      <span>Duration: ~{activeModule.durationMinutes} mins</span>
                    </div>
                    {/* Creative Commons License Attribution (shown only when module has attribution) */}
                    {activeModule.attribution && (
                      <div className="text-[11px] text-textSecondary bg-background/80 px-3 py-2 rounded-xl border border-border font-mono">
                        <span>{activeModule.attribution}</span>
                      </div>
                    )}
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

                {/* Course Study Materials (PDF) Section */}
                <div className="bg-surface border border-border rounded-2xl p-5 shadow-paper-sm">
                  <div className="flex items-center justify-between pb-3 border-b border-border/80">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-textPrimary flex items-center gap-2">
                          Course Study Materials (PDF)
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-surface2 text-textSecondary border border-border">
                            {materials.length} {materials.length === 1 ? 'file' : 'files'}
                          </span>
                        </h4>
                        <p className="text-xs text-textSecondary mt-0.5">
                          Official references, technical cheat-sheets, and offline study guides.
                        </p>
                      </div>
                    </div>

                    {canManageMaterials && (
                      <button
                        onClick={() => {
                          setUploadError(null);
                          setUploadFile(null);
                          setUploadTitle('');
                          setUploadModalOpen(true);
                        }}
                        className="px-3 py-1.5 bg-primary hover:bg-primaryHover text-primaryContrast rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
                      >
                        <Plus className="w-3.5 h-3.5" /> Upload PDF
                      </button>
                    )}
                  </div>

                  {materialMessage && (
                    <div className="mt-3 p-3 rounded-lg text-xs flex items-center gap-2 bg-primary/10 text-primary border border-primary/20">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{materialMessage}</span>
                    </div>
                  )}

                  <div className="mt-3 space-y-2">
                    {materials.length === 0 ? (
                      <div className="py-6 text-center text-xs text-textSecondary">
                        No study materials uploaded for this course yet.
                      </div>
                    ) : (
                      materials.map((mat) => (
                        <div
                          key={mat.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl bg-surface2/60 hover:bg-surface2 border border-border/70 transition gap-3"
                        >
                          <div className="flex items-start gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-lg bg-red-500/10 text-red-500 border border-red-500/20 flex items-center justify-center shrink-0 mt-0.5">
                              <FileText className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-textPrimary truncate">{mat.title}</p>
                              <div className="flex items-center gap-2 mt-0.5 text-[11px] text-textSecondary">
                                <span className="truncate max-w-[200px]">{mat.fileName}</span>
                                <span>•</span>
                                <span>{formatBytes(mat.fileSize)}</span>
                                <span>•</span>
                                <span>{new Date(mat.uploadedAt).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                            {canAccessMaterials ? (
                              <>
                                <button
                                  onClick={() => handleAccessMaterial(mat, true)}
                                  disabled={downloadingId === mat.id}
                                  className="px-2.5 py-1.5 rounded-lg border border-border hover:bg-surface text-textSecondary hover:text-textPrimary text-xs font-medium flex items-center gap-1 transition"
                                  title="View in new tab"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>View</span>
                                </button>
                                <button
                                  onClick={() => handleAccessMaterial(mat, false)}
                                  disabled={downloadingId === mat.id}
                                  className="px-2.5 py-1.5 rounded-lg bg-surface hover:bg-surface2 border border-border text-primary font-semibold text-xs flex items-center gap-1 transition shadow-paper-sm"
                                  title="Download PDF"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                  <span>{downloadingId === mat.id ? 'Downloading...' : 'Download'}</span>
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => {
                                  setMaterialMessage('Enrollment required: Please enroll in this course to view or download study materials.');
                                  setTimeout(() => setMaterialMessage(null), 5000);
                                }}
                                className="px-2.5 py-1.5 rounded-lg bg-surface2 text-textSecondary text-xs font-medium flex items-center gap-1.5 border border-border opacity-85 hover:opacity-100"
                                title="Enroll to unlock"
                              >
                                <Lock className="w-3.5 h-3.5 text-warning" />
                                <span>Enroll to Access</span>
                              </button>
                            )}

                            {canManageMaterials && (
                              <button
                                onClick={() => handleDeleteMaterial(mat.id)}
                                className="p-1.5 rounded-lg text-textSecondary hover:text-red-500 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition"
                                title="Delete study material"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
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
                        onClick={() => {
                          if (!isEnrolled) {
                            handleEnroll(true, { id: activeModule.id, title: activeModule.title });
                          } else if (activeModule) {
                            setActiveQuizModule({ id: activeModule.id, title: activeModule.title });
                            setShowAssessment(true);
                          }
                        }}
                        className="px-4 py-2 bg-primary hover:bg-primaryHover text-primaryContrast rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-paper-sm disabled:opacity-50"
                      >
                        <Award className="w-4 h-4" /> Take Final Module Quiz (10 Questions)
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
            fetchCourseDetails(false);
          }}
        />
      )}

      {/* Certificate Display Modal */}
      {showCertificate && certificate && (
        <CertificateModal
          certificate={certificate}
          onClose={() => setShowCertificate(false)}
        />
      )}

      {/* Upload Material Modal (Trainer / Admin) */}
      {uploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface border border-border rounded-2xl p-6 max-w-md w-full shadow-paper-lg space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <UploadCloud className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-textPrimary">Upload Course Study Material</h3>
              </div>
              <button
                onClick={() => setUploadModalOpen(false)}
                className="text-textSecondary hover:text-textPrimary text-xs px-2 py-1 rounded"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUploadMaterial} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-textSecondary uppercase tracking-wider mb-1.5">
                  Document Title (Optional)
                </label>
                <input
                  type="text"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="e.g., Python Quick Reference & Cheat Sheet"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-surface2 border border-border text-textPrimary focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-textSecondary uppercase tracking-wider mb-1.5">
                  Select PDF File (Max 15 MB) *
                </label>
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  required
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setUploadFile(file);
                    if (file && !uploadTitle.trim()) {
                      setUploadTitle(file.name.replace(/\.pdf$/i, ''));
                    }
                  }}
                  className="w-full text-xs text-textSecondary file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-primaryContrast hover:file:bg-primaryHover cursor-pointer"
                />
                {uploadFile && (
                  <p className="mt-1 text-[11px] text-textSecondary">
                    Selected: {uploadFile.name} ({formatBytes(uploadFile.size)})
                  </p>
                )}
              </div>

              {uploadError && (
                <div className="p-3 rounded-lg text-xs bg-red-500/10 text-red-500 border border-red-500/20 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setUploadModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-textSecondary hover:bg-surface2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading || !uploadFile}
                  className="px-4 py-1.5 bg-primary hover:bg-primaryHover text-primaryContrast rounded-lg text-xs font-bold transition shadow-paper-sm disabled:opacity-50 flex items-center gap-1.5"
                >
                  {uploading ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-3.5 h-3.5" />
                      Upload PDF
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
