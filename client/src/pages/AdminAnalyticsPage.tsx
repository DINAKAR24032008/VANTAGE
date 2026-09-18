import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts';
import {
  BarChart3,
  Users,
  Award,
  BookOpen,
  TrendingUp,
  Sliders,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  ShieldCheck,
  Grid,
} from 'lucide-react';

export const AdminAnalyticsPage: React.FC = () => {
  const [summary, setSummary] = useState<any | null>(null);
  const [courseMetrics, setCourseMetrics] = useState<any[]>([]);
  const [heatmap, setHeatmap] = useState<any | null>(null);
  const [roleMatrices, setRoleMatrices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Matrix Editor & Feedback Loop State
  const [selectedRole, setSelectedRole] = useState('Meteorological Assistant');
  const [editingRequirements, setEditingRequirements] = useState<any[]>([]);
  const [isUpdatingMatrix, setIsUpdatingMatrix] = useState(false);
  const [feedbackNotification, setFeedbackNotification] = useState<any | null>(null);

  useEffect(() => {
    loadAnalyticsData();
  }, []);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      const [sumRes, coursesRes, heatRes, matrixRes] = await Promise.all([
        api.get('/analytics/summary'),
        api.get('/analytics/courses'),
        api.get('/analytics/heatmap'),
        api.get('/admin/matrix'),
      ]);

      setSummary(sumRes.data);
      setCourseMetrics(coursesRes.data);
      setHeatmap(heatRes.data);
      setRoleMatrices(matrixRes.data);

      const current = matrixRes.data.find((m: any) => m.jobRole === selectedRole);
      if (current) {
        setEditingRequirements(current.requirements || []);
      }
    } catch (err) {
      console.error('Failed to load analytics data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleSelect = (roleName: string) => {
    setSelectedRole(roleName);
    const found = roleMatrices.find((m) => m.jobRole === roleName);
    if (found) {
      setEditingRequirements(found.requirements || []);
    }
  };

  const handleRequirementChange = (competencyId: string, newLevel: number) => {
    setEditingRequirements((prev) =>
      prev.map((r) => (r.competencyId === competencyId ? { ...r, requiredLevel: newLevel } : r))
    );
  };

  const handleSaveMatrixFeedbackLoop = async () => {
    try {
      setIsUpdatingMatrix(true);
      setFeedbackNotification(null);

      const res = await api.put(`/admin/matrix/${encodeURIComponent(selectedRole)}`, {
        requirements: editingRequirements,
      });

      setFeedbackNotification(res.data);
      // Reload analytics to see immediate updated heatmap
      await loadAnalyticsData();
    } catch (err: any) {
      console.error('Feedback loop trigger error:', err);
      alert(err.response?.data?.error || 'Failed to update competency matrix');
    } finally {
      setIsUpdatingMatrix(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const chartData = courseMetrics.map((c) => ({
    name: c.title.length > 20 ? `${c.title.slice(0, 18)}...` : c.title,
    fullName: c.title,
    'Completion Rate (%)': c.completionRate,
    'Total Enrolled': c.totalEnrollments,
    'Avg Score': c.avgAssessmentScore,
  }));

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header */}
        <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800">
          <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-wider">
            Ministry of Earth Sciences • Executive Oversight
          </span>
          <h1 className="text-3xl sm:text-4xl font-display italic text-white mt-1 tracking-tight">
            Capacity Building Analytics & Heatmap
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            Real-time organizational telemetry tracking course completion rates, department-level competency gaps,
            and dynamic feedback loop recalibration.
          </p>
        </div>

        {/* 4 Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900">{summary?.totalLearners || 0}</div>
              <div className="text-xs text-slate-500 font-medium">Enrolled Scientists & Staff</div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-black text-emerald-600">{summary?.completionRate || 0}%</div>
              <div className="text-xs text-slate-500 font-medium">Org-wide Course Completion</div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-black text-amber-600">{summary?.totalCertificates || 0}</div>
              <div className="text-xs text-slate-500 font-medium">Verifiable Certificates Issued</div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900">{summary?.totalCourses || 0}</div>
              <div className="text-xs text-slate-500 font-medium">Accredited Specializations</div>
            </div>
          </div>
        </div>

        {/* Section 1: Org-Wide Competency-Gap Heatmap */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Grid className="w-5 h-5 text-emerald-600" />
                Inter-Departmental Competency Gap Heatmap
              </h2>
              <p className="text-xs text-slate-500">
                Aggregated skill levels vs target benchmarks across MoES institutes (IMD, INCOIS, NCS, NIOT, NCPOR).
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-emerald-500 inline-block" /> Target Met
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-amber-500 inline-block" /> Moderate Gap
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-rose-500 inline-block" /> Critical Gap
              </span>
            </div>
          </div>

          <div className="overflow-x-auto mt-4">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="p-3 font-bold text-slate-800">Institute / Department</th>
                  <th className="p-3 font-bold text-slate-800">Staff Count</th>
                  {heatmap?.competencyList?.map((comp: any) => (
                    <th key={comp.id} className="p-3 font-bold text-slate-800 text-center max-w-[140px]">
                      {comp.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {heatmap?.heatmapData?.map((row: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="p-3 font-semibold text-slate-900">{row.department}</td>
                    <td className="p-3 text-slate-500 font-mono">{row.learnerCount}</td>
                    {heatmap.competencyList.map((comp: any) => {
                      const cell = row[comp.name];
                      if (!cell) {
                        return <td key={comp.id} className="p-3 text-center text-slate-300">-</td>;
                      }

                      const gap = cell.gap;
                      let bg = 'bg-emerald-50 text-emerald-800 border border-emerald-200';
                      if (gap > 1.5) bg = 'bg-rose-50 text-rose-800 border border-rose-200';
                      else if (gap > 0) bg = 'bg-amber-50 text-amber-800 border border-amber-200';

                      return (
                        <td key={comp.id} className="p-2 text-center">
                          <div className={`p-1.5 rounded-lg text-xs font-bold ${bg}`}>
                            {cell.currentAvg} / {cell.targetBenchmark}
                            <span className="block text-[9px] font-normal">
                              {gap === 0 ? 'Optimal' : `-${gap} Gap`}
                            </span>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 2: Course Completion & Engagement Rates */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                Course Completion Rates & Learner Engagement
              </h2>
              <p className="text-xs text-slate-500">
                Tracking completion velocity and assessment performance across all specialized courses.
              </p>
            </div>
          </div>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} interval={0} angle={-10} textAnchor="end" />
                <YAxis domain={[0, 100]} stroke="#64748b" fontSize={12} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs border border-slate-700">
                          <p className="font-bold text-emerald-400 mb-1">{d.fullName}</p>
                          <p>Completion Rate: <span className="font-bold">{d['Completion Rate (%)']}%</span></p>
                          <p>Total Enrolled: <span className="font-bold">{d['Total Enrolled']}</span></p>
                          <p>Average Quiz Score: <span className="font-bold text-amber-400">{d['Avg Score']}%</span></p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="Completion Rate (%)" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Avg Score" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Section 3: Feature 9 - Automated Feedback Loop & Competency Matrix Configuration */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 text-[10px] font-bold uppercase tracking-wider font-mono">
                  SIH Stretch Goal • Feature 9
                </span>
              </div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 mt-1">
                <Sliders className="w-5 h-5 text-purple-600" />
                Automated Feedback Loop: Role Competency Matrix Tuning
              </h2>
              <p className="text-xs text-slate-500">
                When an administrator updates required competency benchmarks for any job role, the system
                automatically executes the feedback loop to recompute gaps and recommendation rankings for all learners.
              </p>
            </div>

            {/* Select Role Dropdown */}
            <select
              value={selectedRole}
              onChange={(e) => handleRoleSelect(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-purple-500"
            >
              {roleMatrices.map((m) => (
                <option key={m.id} value={m.jobRole}>{m.jobRole}</option>
              ))}
            </select>
          </div>

          {/* Feedback Loop Alert Banner */}
          {feedbackNotification && (
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl text-xs text-purple-900 space-y-2">
              <div className="flex items-center gap-2 font-bold">
                <CheckCircle className="w-4 h-4 text-purple-600" />
                <span>{feedbackNotification.message}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-2">
                {feedbackNotification.feedbackLoop?.learners?.map((l: any) => (
                  <div key={l.learnerId} className="bg-white p-2 rounded-lg border border-purple-100">
                    <span className="font-semibold text-slate-800">{l.name}</span>
                    <div className="text-[10px] text-slate-500 flex justify-between mt-0.5">
                      <span>Readiness: {l.readinessPercentage}%</span>
                      <span>Gap: {l.overallGapScore}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Role Requirements Sliders */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {editingRequirements.map((req) => (
              <div key={req.competencyId} className="p-4 bg-slate-50 rounded-xl border border-slate-200/90 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 line-clamp-1">{req.competencyName}</span>
                  <span className="text-xs font-mono font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded">
                    Level {req.requiredLevel} / 5
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={req.requiredLevel}
                  onChange={(e) => handleRequirementChange(req.competencyId, parseInt(e.target.value, 10))}
                  className="w-full h-1.5 bg-slate-200 rounded appearance-none cursor-pointer accent-purple-600"
                />
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <span className="text-xs text-slate-400">
              Target role matrix: <strong>{selectedRole}</strong>
            </span>
            <button
              onClick={handleSaveMatrixFeedbackLoop}
              disabled={isUpdatingMatrix}
              className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-purple-600/30 transition flex items-center gap-1.5 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isUpdatingMatrix ? 'animate-spin' : ''}`} />
              {isUpdatingMatrix ? 'Recalculating Org Gaps...' : 'Save Matrix & Trigger Feedback Loop'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
