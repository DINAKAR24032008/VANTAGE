import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { HeadingEmoji } from '../components/HeadingEmoji';
import {
  Users,
  BookOpen,
  Award,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  Download,
  ShieldCheck,
  TrendingUp,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

interface LearnerProgressRecord {
  id: string;
  userId: string;
  learnerName: string;
  learnerEmail: string;
  learnerDepartment: string;
  learnerJobRole: string;
  courseId: string;
  courseTitle: string;
  courseDifficulty: string;
  courseStatus: string;
  trainerName: string;
  trainerEmail: string;
  enrollmentStatus: string;
  progressPercent: number;
  completedModulesCount: number;
  totalModulesCount: number;
  enrolledAt: string;
  completedAt: string | null;
  quizAttemptsCount: number;
  passedQuizzesCount: number;
  highestQuizScore: number | null;
  averageQuizScore: number | null;
  certificate: {
    id: string;
    certificateNumber: string;
    issuedAt: string;
    certificateUrl: string;
  } | null;
}

interface AdminProgressResponse {
  summary: {
    totalEnrollments: number;
    completedEnrollments: number;
    inProgressEnrollments: number;
    totalCertificates: number;
    totalUniqueLearners: number;
    totalCourses: number;
    averageProgress: number;
  };
  courses: Array<{ id: string; title: string; difficultyLevel: string; status: string }>;
  progress: LearnerProgressRecord[];
}

export const AdminProgressPage: React.FC = () => {
  const [data, setData] = useState<AdminProgressResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  useEffect(() => {
    loadAggregatedProgress();
  }, []);

  const loadAggregatedProgress = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get<AdminProgressResponse>('/admin/learners-progress');
      setData(res.data);
    } catch (err: any) {
      console.error('Failed to load admin progress:', err);
      setError(err.response?.data?.error || 'Failed to load platform learner progression data.');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (!data || data.progress.length === 0) return;

    const headers = [
      'Learner Name',
      'Learner Email',
      'Department',
      'Course Title',
      'Instructor',
      'Status',
      'Progress %',
      'Completed Modules',
      'Total Modules',
      'Quiz Attempts',
      'Passed Quizzes',
      'Avg Quiz Score',
      'Certificate No.',
      'Enrolled Date',
      'Completed Date',
    ];

    const rows = filteredRecords.map((r) => [
      `"${r.learnerName.replace(/"/g, '""')}"`,
      `"${r.learnerEmail.replace(/"/g, '""')}"`,
      `"${r.learnerDepartment.replace(/"/g, '""')}"`,
      `"${r.courseTitle.replace(/"/g, '""')}"`,
      `"${r.trainerName.replace(/"/g, '""')}"`,
      `"${r.enrollmentStatus}"`,
      r.progressPercent,
      r.completedModulesCount,
      r.totalModulesCount,
      r.quizAttemptsCount,
      r.passedQuizzesCount,
      r.averageQuizScore !== null ? `${r.averageQuizScore}%` : 'N/A',
      r.certificate ? `"${r.certificate.certificateNumber}"` : 'None',
      new Date(r.enrolledAt).toLocaleDateString(),
      r.completedAt ? new Date(r.completedAt).toLocaleDateString() : 'N/A',
    ]);

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `vantage-cross-course-progress-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredRecords = (data?.progress || []).filter((record) => {
    const matchesSearch =
      record.learnerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.learnerEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.learnerDepartment.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.courseTitle.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCourse = selectedCourse === 'ALL' || record.courseId === selectedCourse;
    const matchesStatus = selectedStatus === 'ALL' || record.enrollmentStatus === selectedStatus;

    return matchesSearch && matchesCourse && matchesStatus;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-semibold text-textSecondary">Loading platform-wide progress data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background py-10 px-4 max-w-4xl mx-auto">
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
          <h2 className="text-base font-bold text-textPrimary">Access Restricted</h2>
          <p className="text-xs text-textSecondary">{error}</p>
          <button
            onClick={loadAggregatedProgress}
            className="px-4 py-2 bg-primary hover:bg-primaryHover text-primaryContrast text-xs font-bold rounded-xl transition"
          >
            Retry Request
          </button>
        </div>
      </div>
    );
  }

  const summary = data?.summary;

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header Banner */}
        <div className="bg-surface rounded-3xl p-6 sm:p-8 text-textPrimary shadow-paper-sm border border-border flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-primarySoft text-primary text-[11px] font-bold uppercase tracking-wider border border-primary/30 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Administrator Control Center
              </span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-textPrimary">
              <HeadingEmoji emoji="📊" /> Cross-Course Learner Progression
            </h1>
            <p className="text-xs sm:text-sm text-textSecondary max-w-2xl">
              Consolidated real-time tracking across all platform learners, enrolled curriculums, assessment scores, and verified competency certificates.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="px-4 py-2.5 bg-surface2 border border-border hover:border-primary/40 text-textPrimary rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-paper-sm"
            >
              <Download className="w-4 h-4 text-primary" /> Export Progress Report (CSV)
            </button>
          </div>
        </div>

        {/* KPI Metrics Grid */}
        {summary && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <div className="bg-surface border border-border p-4 rounded-2xl shadow-paper-sm">
              <div className="flex items-center justify-between text-textSecondary text-[11px] font-bold uppercase">
                <span>Unique Learners</span>
                <Users className="w-4 h-4 text-primary" />
              </div>
              <div className="text-2xl font-black text-textPrimary mt-2">{summary.totalUniqueLearners}</div>
              <div className="text-[10px] text-textSecondary mt-0.5">Enrolled across courses</div>
            </div>

            <div className="bg-surface border border-border p-4 rounded-2xl shadow-paper-sm">
              <div className="flex items-center justify-between text-textSecondary text-[11px] font-bold uppercase">
                <span>Active Curriculums</span>
                <BookOpen className="w-4 h-4 text-primary" />
              </div>
              <div className="text-2xl font-black text-textPrimary mt-2">{summary.totalCourses}</div>
              <div className="text-[10px] text-textSecondary mt-0.5">Published courses</div>
            </div>

            <div className="bg-surface border border-border p-4 rounded-2xl shadow-paper-sm">
              <div className="flex items-center justify-between text-textSecondary text-[11px] font-bold uppercase">
                <span>Total Enrollments</span>
                <Clock className="w-4 h-4 text-primary" />
              </div>
              <div className="text-2xl font-black text-textPrimary mt-2">{summary.totalEnrollments}</div>
              <div className="text-[10px] text-textSecondary mt-0.5">
                {summary.inProgressEnrollments} in progress
              </div>
            </div>

            <div className="bg-surface border border-border p-4 rounded-2xl shadow-paper-sm">
              <div className="flex items-center justify-between text-textSecondary text-[11px] font-bold uppercase">
                <span>Completed Courses</span>
                <CheckCircle2 className="w-4 h-4 text-primary" />
              </div>
              <div className="text-2xl font-black text-primary mt-2">{summary.completedEnrollments}</div>
              <div className="text-[10px] text-textSecondary mt-0.5">100% syllabus cleared</div>
            </div>

            <div className="bg-surface border border-border p-4 rounded-2xl shadow-paper-sm col-span-2 sm:col-span-1">
              <div className="flex items-center justify-between text-textSecondary text-[11px] font-bold uppercase">
                <span>Certificates Issued</span>
                <Award className="w-4 h-4 text-primary" />
              </div>
              <div className="text-2xl font-black text-primary mt-2">{summary.totalCertificates}</div>
              <div className="text-[10px] text-textSecondary mt-0.5">Avg Progress: {summary.averageProgress}%</div>
            </div>
          </div>
        )}

        {/* Filter and Search Bar */}
        <div className="bg-surface p-4 rounded-2xl border border-border shadow-paper-sm flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-textSecondary absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search learner name, email, department, or course..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-surface2 border border-border rounded-xl text-xs text-textPrimary placeholder:text-textSecondary focus:outline-none focus:border-primary transition"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="flex items-center gap-1.5 w-full sm:w-auto">
              <Filter className="w-3.5 h-3.5 text-textSecondary" />
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="bg-surface2 border border-border rounded-xl px-3 py-2 text-xs text-textPrimary focus:outline-none focus:border-primary transition w-full sm:w-auto"
              >
                <option value="ALL">All Curriculums</option>
                {data?.courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-surface2 border border-border rounded-xl px-3 py-2 text-xs text-textPrimary focus:outline-none focus:border-primary transition"
            >
              <option value="ALL">All Statuses</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="not_started">Not Started</option>
            </select>
          </div>
        </div>

        {/* Aggregated Progress Records Table */}
        <div className="bg-surface rounded-2xl border border-border shadow-paper-sm overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-textSecondary">
              Learner Records ({filteredRecords.length})
            </h2>
          </div>

          {filteredRecords.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <Users className="w-8 h-8 text-textSecondary mx-auto opacity-40" />
              <p className="text-xs font-semibold text-textPrimary">No progress records found matching your filters</p>
              <p className="text-[11px] text-textSecondary">Try clearing search terms or selecting another course.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border bg-surface2 text-textSecondary font-semibold">
                    <th className="py-3 px-4">Learner</th>
                    <th className="py-3 px-4">Enrolled Course</th>
                    <th className="py-3 px-4">Instructor</th>
                    <th className="py-3 px-4">Syllabus Progress</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Quiz Performance</th>
                    <th className="py-3 px-4">Credential</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredRecords.map((r) => (
                    <tr key={r.id} className="hover:bg-surface2/60 transition">
                      {/* Learner Info */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-textPrimary">{r.learnerName}</div>
                        <div className="text-[11px] text-textSecondary">{r.learnerEmail}</div>
                        <div className="text-[10px] text-textSecondary/80 mt-0.5">
                          {r.learnerDepartment} • {r.learnerJobRole}
                        </div>
                      </td>

                      {/* Course */}
                      <td className="py-3.5 px-4">
                        <Link
                          to={`/courses/${r.courseId}`}
                          className="font-bold text-textPrimary hover:text-primary transition flex items-center gap-1"
                        >
                          {r.courseTitle} <ExternalLink className="w-3 h-3 text-textSecondary" />
                        </Link>
                        <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded bg-primarySoft text-primary border border-primary/20 font-semibold">
                          {r.courseDifficulty}
                        </span>
                      </td>

                      {/* Instructor */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-textPrimary">{r.trainerName}</div>
                        <div className="text-[10px] text-textSecondary">{r.trainerEmail}</div>
                      </td>

                      {/* Progress */}
                      <td className="py-3.5 px-4 min-w-[140px]">
                        <div className="flex items-center justify-between text-[11px] font-semibold mb-1 text-textPrimary">
                          <span>{r.progressPercent}%</span>
                          <span className="text-[10px] text-textSecondary">
                            {r.completedModulesCount} / {r.totalModulesCount} mods
                          </span>
                        </div>
                        <div className="w-full bg-surface2 rounded-full h-1.5 overflow-hidden border border-border">
                          <div
                            className="bg-primary h-1.5 rounded-full transition-all duration-300"
                            style={{ width: `${r.progressPercent}%` }}
                          />
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {r.enrollmentStatus === 'completed' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-primarySoft text-primary border border-primary/30">
                            <CheckCircle2 className="w-3 h-3" /> Completed
                          </span>
                        ) : r.enrollmentStatus === 'in_progress' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/30">
                            <Clock className="w-3 h-3" /> In Progress
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-surface2 text-textSecondary border border-border">
                            Not Started
                          </span>
                        )}
                      </td>

                      {/* Quiz Performance */}
                      <td className="py-3.5 px-4">
                        {r.quizAttemptsCount > 0 ? (
                          <div className="space-y-0.5">
                            <div className="font-semibold text-textPrimary text-[11px]">
                              Avg: <span className="text-primary font-bold">{r.averageQuizScore}%</span>
                            </div>
                            <div className="text-[10px] text-textSecondary">
                              {r.passedQuizzesCount} passed / {r.quizAttemptsCount} attempts
                            </div>
                          </div>
                        ) : (
                          <span className="text-[11px] text-textSecondary italic">No attempts yet</span>
                        )}
                      </td>

                      {/* Certificate */}
                      <td className="py-3.5 px-4">
                        {r.certificate ? (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-primarySoft text-primary border border-primary/30">
                              <Award className="w-3 h-3" /> {r.certificate.certificateNumber}
                            </span>
                            <div className="text-[9px] text-textSecondary">
                              Issued {new Date(r.certificate.issuedAt).toLocaleDateString()}
                            </div>
                          </div>
                        ) : (
                          <span className="text-[11px] text-textSecondary italic">Pending completion</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminProgressPage;
