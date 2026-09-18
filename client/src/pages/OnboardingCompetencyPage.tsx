import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Competency, SkillRating } from '../types';
import { Layers, CheckCircle2, ArrowRight, Info, AlertCircle } from 'lucide-react';

const LEVEL_DESCRIPTIONS: Record<number, { label: string; desc: string }> = {
  1: { label: 'Level 1 - Novice', desc: 'Basic conceptual awareness; requires direct supervision.' },
  2: { label: 'Level 2 - Advanced Beginner', desc: 'Can execute standard protocols with occasional guidance.' },
  3: { label: 'Level 3 - Competent', desc: 'Independent practitioner capable of routine operational decisions.' },
  4: { label: 'Level 4 - Proficient', desc: 'Deep domain mastery; troubleshoots non-standard anomalies.' },
  5: { label: 'Level 5 - Expert / Master', desc: 'Authority in field; leads research, calibration, and doctrine design.' },
};

export const OnboardingCompetencyPage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [competencies, setCompetencies] = useState<Competency[]>([]);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [jobRole, setJobRole] = useState(user?.jobRole || 'Meteorological Assistant');
  const [department, setDepartment] = useState(user?.department || 'India Meteorological Department (IMD)');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchCompetencies();
  }, []);

  const fetchCompetencies = async () => {
    try {
      setLoading(true);
      const [compRes, profileRes] = await Promise.all([
        api.get('/competencies'),
        user ? api.get(`/learners/${user.id}/profile`) : Promise.resolve({ data: { skills: [] } }),
      ]);

      setCompetencies(compRes.data);

      // Populate existing ratings if present
      const initialRatings: Record<string, number> = {};
      compRes.data.forEach((c: Competency) => {
        initialRatings[c.id] = 1; // default level 1
      });

      if (profileRes.data.skills && Array.isArray(profileRes.data.skills)) {
        profileRes.data.skills.forEach((s: SkillRating) => {
          initialRatings[s.competencyId] = s.currentLevel;
        });
      }

      setRatings(initialRatings);
    } catch (err) {
      console.error('Failed to load competency questionnaire:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSliderChange = (competencyId: string, level: number) => {
    setRatings((prev) => ({
      ...prev,
      [competencyId]: level,
    }));
  };

  const handleSave = async () => {
    if (!user) return;

    try {
      setSaving(true);
      setMessage(null);

      const skillsPayload: SkillRating[] = competencies.map((comp) => ({
        competencyId: comp.id,
        competencyName: comp.name,
        currentLevel: ratings[comp.id] || 1,
      }));

      await api.put(`/learners/${user.id}/profile`, {
        jobRole,
        department,
        skills: skillsPayload,
      });

      await refreshUser();
      setMessage('Competency profile saved! Recalculating gap analysis...');
      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);
    } catch (err: any) {
      console.error('Failed to save profile:', err);
      setMessage('Failed to save competency profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Intro */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase tracking-wider font-mono">
              Learner Self-Assessment • MoES Standard
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900">
            Competency Baseline Assessment
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Rate your current operational experience across Earth Sciences domain areas. This calibrates your
            individual skill gap profile and dynamically customizes your training path.
          </p>

          {/* Role and Department Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 pt-6 border-t border-slate-100">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Designated Job Role / Benchmark Target
              </label>
              <select
                value={jobRole}
                onChange={(e) => setJobRole(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500"
              >
                <option>Meteorological Assistant</option>
                <option>Ocean Data Analyst</option>
                <option>Seismological Field Officer</option>
                <option>Marine Research Fellow</option>
                <option>Polar Research Assistant</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                MoES Institute / Department
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500"
              >
                <option>India Meteorological Department (IMD)</option>
                <option>Indian National Centre for Ocean Information Services (INCOIS)</option>
                <option>National Centre for Seismology (NCS)</option>
                <option>National Institute of Ocean Technology (NIOT)</option>
                <option>National Centre for Polar and Ocean Research (NCPOR)</option>
              </select>
            </div>
          </div>
        </div>

        {message && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{message}</span>
          </div>
        )}

        {/* Competency Rating Cards */}
        <div className="space-y-4">
          {competencies.map((comp) => {
            const currentVal = ratings[comp.id] || 1;
            const levelInfo = LEVEL_DESCRIPTIONS[currentVal];

            return (
              <div
                key={comp.id}
                className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-mono text-emerald-700 font-bold uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded">
                      {comp.category}
                    </span>
                    <h3 className="font-bold text-sm text-slate-900 mt-1">{comp.name}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{comp.description}</p>
                  </div>
                  <div className="flex-shrink-0">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-900 text-white font-mono">
                      Level {currentVal} / 5
                    </span>
                  </div>
                </div>

                {/* Slider Input */}
                <div className="space-y-2">
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="1"
                    value={currentVal}
                    onChange={(e) => handleSliderChange(comp.id, parseInt(e.target.value, 10))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                  />

                  {/* Level Rubric Guide */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-2">
                    <Info className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-slate-800">{levelInfo.label}</p>
                      <p className="text-[11px] text-slate-500">{levelInfo.desc}</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Button */}
        <div className="sticky bottom-6 bg-white/90 backdrop-blur p-4 rounded-2xl border border-slate-200 shadow-xl flex items-center justify-between">
          <span className="text-xs text-slate-500">
            {competencies.length} Competencies evaluated against MoES Framework
          </span>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/30 transition flex items-center gap-1.5 disabled:opacity-50"
          >
            {saving ? 'Computing Gap Matrix...' : 'Save Profile & View Gap Analysis'}
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
