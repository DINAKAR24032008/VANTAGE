import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { SkillGapRadar } from '../components/SkillGapRadar';
import { CertificateModal } from '../components/CertificateModal';
import {
  GapAnalysisResponse,
  Enrollment,
  Certificate,
} from '../types';
import {
  Sparkles,
  BookOpen,
  Award,
  Clock,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  PlayCircle,
  BarChart2,
} from 'lucide-react';

export const LearnerDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [analysis, setAnalysis] = useState<GapAnalysisResponse | null>(null);
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
      const [recsRes, enrollsRes, certsRes] = await Promise.all([
        api.get(`/learners/${user?.id}/recommendations`),
        api.get('/enrollments/my'),
        api.get('/certificates/my'),
      ]);
      setAnalysis(recsRes.data);
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
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-xs font-semibold text-slate-500">
            Running heuristic gap analysis & computing MoES recommendations...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Learner Hero Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 relative z-10">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[11px] font-mono font-bold uppercase tracking-wider border border-emerald-500/30">
                  {user?.department}
                </span>
                <span className="text-xs text-slate-400">• Designation: {user?.jobRole}</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-display italic text-white tracking-tight">
                Welcome back, {user?.name}
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
                Real-time role competency benchmarking against the Ministry of Earth Sciences National Framework.
              </p>
            </div>

            {/* Readiness Index Stat Card */}
            <div className="flex items-center gap-4 bg-slate-800/80 backdrop-blur border border-slate-700/80 p-4 rounded-2xl">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-lg">
                <TrendingUp className="w-8 h-8" />
              </div>
              <div>
                <div className="text-2xl font-black text-white">
                  {analysis?.readinessPercentage ?? 0}%
                </div>
                <div className="text-[11px] text-slate-400 uppercase font-semibold">
                  Role Readiness Index
                </div>
                <div className="text-[10px] text-amber-400 font-medium">
                  {analysis?.overallGapScore ?? 0}% Deficiency Gap Remaining
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 1: Dynamic Gap Analysis Engine Visualization */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-emerald-600" />
                Target Role Competency Gap Analysis
              </h2>
              <p className="text-xs text-slate-500">
                Benchmark: <strong>{user?.jobRole}</strong> standards vs your current validated skill levels.
              </p>
            </div>
            <Link
              to="/onboarding"
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:underline flex items-center gap-1"
            >
              Update Self-Assessment Profile <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="mt-6">
            <SkillGapRadar breakdown={analysis?.competencyBreakdown || []} />
          </div>
        </div>

        {/* Section 2: AI / Heuristic Course Recommendations */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                Ranked Course Recommendations
              </h2>
              <p className="text-xs text-slate-500">
                Calculated by prioritizing courses bridging your highest weighted competency deficits.
              </p>
            </div>
            <Link to="/catalog" className="text-xs font-semibold text-emerald-600 hover:underline">
              View All Courses →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {analysis?.recommendedCourses.slice(0, 3).map((rec) => (
              <div
                key={rec.courseId}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition flex flex-col justify-between overflow-hidden group"
              >
                <div className="p-5">
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {rec.difficultyLevel}
                    </span>
                    <span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> {rec.relevanceScore} pts match
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm leading-snug group-hover:text-emerald-600 transition line-clamp-2">
                    {rec.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-2 line-clamp-3">{rec.description}</p>

                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {rec.targetCompetencies.map((c, i) => (
                      <span
                        key={i}
                        className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-5 pt-0 border-t border-slate-100 mt-4 bg-slate-50/50 flex items-center justify-between">
                  <Link
                    to={`/courses/${rec.courseId}`}
                    className="text-xs font-bold text-slate-700 hover:text-emerald-600 flex items-center gap-1"
                  >
                    View Syllabus
                  </Link>

                  {rec.enrolled ? (
                    <Link
                      to={`/courses/${rec.courseId}`}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shadow"
                    >
                      <PlayCircle className="w-3.5 h-3.5" /> Continue Course
                    </Link>
                  ) : (
                    <button
                      onClick={() => handleEnroll(rec.courseId)}
                      disabled={enrollingCourseId === rec.courseId}
                      className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shadow disabled:opacity-50"
                    >
                      {enrollingCourseId === rec.courseId ? 'Enrolling...' : 'Enroll Now'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 3: Active Enrollments & Progress */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-emerald-600" />
            My Active Learning Programs ({enrollments.length})
          </h2>

          {enrollments.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-xs text-slate-500">
              You have not enrolled in any courses yet. Select from the recommendations above to begin.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {enrollments.map((enrollment) => (
                <div
                  key={enrollment.id}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                          enrollment.status === 'completed'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {enrollment.status === 'completed' ? 'Completed' : 'In Progress'}
                      </span>
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(enrollment.enrolledAt).toLocaleDateString()}
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-900 text-sm line-clamp-1">
                      {enrollment.course?.title}
                    </h3>

                    {/* Progress Bar */}
                    <div className="mt-4">
                      <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                        <span>Course Completion</span>
                        <span>{enrollment.progressPercent}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${
                            enrollment.progressPercent === 100 ? 'bg-emerald-500' : 'bg-blue-600'
                          }`}
                          style={{ width: `${enrollment.progressPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-5 pt-3 border-t border-slate-100">
                    {enrollment.hasCertificate && enrollment.certificate ? (
                      <button
                        onClick={() => setSelectedCert(enrollment.certificate!)}
                        className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1"
                      >
                        <Award className="w-4 h-4" /> View Certificate
                      </button>
                    ) : (
                      <span className="text-[11px] text-slate-400">Quiz assessment pending</span>
                    )}

                    <Link
                      to={`/courses/${enrollment.courseId}`}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition"
                    >
                      {enrollment.progressPercent === 100 ? 'Review Modules' : 'Resume Learning'}
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 4: Earned Official Certificates */}
        {certificates.length > 0 && (
          <div className="bg-gradient-to-r from-amber-500/10 via-amber-50 to-emerald-500/10 rounded-2xl p-6 border border-amber-200/80">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-3">
              <Award className="w-5 h-5 text-amber-600" />
              Verified Competency Credentials ({certificates.length})
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {certificates.map((cert) => (
                <div
                  key={cert.id}
                  onClick={() => setSelectedCert(cert)}
                  className="bg-white p-4 rounded-xl border border-amber-200 hover:border-amber-400 cursor-pointer shadow-sm hover:shadow transition flex flex-col justify-between"
                >
                  <div>
                    <span className="text-[9px] font-mono text-amber-700 font-bold uppercase">
                      Credential #{cert.certificateNumber}
                    </span>
                    <h4 className="font-bold text-xs text-slate-800 line-clamp-2 mt-1">
                      {cert.course?.title || 'Earth Sciences Specialization'}
                    </h4>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mt-3 pt-2 border-t border-slate-100">
                    <span>{new Date(cert.issuedAt).toLocaleDateString()}</span>
                    <span className="text-emerald-600 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Verified
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Certificate Preview Modal */}
      <CertificateModal
        certificate={selectedCert}
        onClose={() => setSelectedCert(null)}
      />
    </div>
  );
};
