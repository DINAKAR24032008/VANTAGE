import React, { useState } from 'react';
import { Award, Plus, X, Eye, EyeOff, Check, Edit2 } from 'lucide-react';
import { UserSkillData } from '../types';
import api from '../services/api';

const SKILL_SUGGESTIONS = [
  'Python Programming', 'React.js', 'TypeScript', 'SQL & Databases',
  'Node.js & Express', 'UI/UX Design', 'Data Science', 'Machine Learning',
  'Git Version Control', 'Project Management', 'DevOps & CI/CD', 'Docker',
  'Cloud Computing (AWS/Azure)', 'System Architecture', 'Cybersecurity'
];

interface SkillsEditorProps {
  skills: UserSkillData[];
  isOwner?: boolean;
  onUpdate?: () => void;
}

export const SkillsEditor: React.FC<SkillsEditorProps> = ({ skills, isOwner = false, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [skillList, setSkillList] = useState<UserSkillData[]>(skills || []);
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillLevel, setNewSkillLevel] = useState<'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'>('INTERMEDIATE');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddSkill = () => {
    if (!newSkillName.trim()) return;
    if (skillList.length >= 20) {
      setError('Maximum 20 skills allowed.');
      return;
    }
    const clean = newSkillName.trim();
    if (skillList.some((s) => s.name.toLowerCase() === clean.toLowerCase())) {
      setError('Skill already exists in your list.');
      return;
    }

    setSkillList([
      ...skillList,
      { name: clean, level: newSkillLevel, source: 'SELF', hidden: false },
    ]);
    setNewSkillName('');
    setError(null);
  };

  const handleRemoveSkill = (index: number) => {
    setSkillList(skillList.filter((_, i) => i !== index));
  };

  const handleToggleHide = (index: number) => {
    const updated = [...skillList];
    updated[index].hidden = !updated[index].hidden;
    setSkillList(updated);
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);
      await api.put('/profile/me/skills', { skills: skillList });
      setIsEditing(false);
      if (onUpdate) onUpdate();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save skills');
    } finally {
      setLoading(false);
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'ADVANCED':
        return 'bg-primarySoft text-primary border-primary/30';
      case 'INTERMEDIATE':
        return 'bg-accentSoft text-accent border-accent/30';
      default:
        return 'bg-surface2 text-textSecondary border-border';
    }
  };

  return (
    <div className="bg-surface p-5 rounded-2xl border border-border shadow-paper-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-sm font-bold text-textPrimary flex items-center gap-1.5">
            ⚡ Skills & Competencies
          </h4>
          <p className="text-[11px] text-textSecondary">Verified and self-reported skills</p>
        </div>
        {isOwner && (
          <button
            type="button"
            onClick={() => {
              setSkillList(skills || []);
              setIsEditing(true);
            }}
            className="p-1.5 hover:bg-surface2 text-textSecondary hover:text-primary rounded-lg transition"
            title="Edit Skills"
          >
            <Edit2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {skills && skills.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {skills.map((skill, idx) => (
            <div
              key={idx}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold ${getLevelColor(
                skill.level
              )}`}
            >
              <span>{skill.name}</span>
              <span className="text-[10px] opacity-75 font-normal">({skill.level})</span>

              {skill.source === 'VANTAGE' && (
                <span
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-primary text-primaryContrast text-[9px] font-bold"
                  title="Verified on Vantage after passing course assessments"
                >
                  <Award className="w-3 h-3" />
                  Verified
                </span>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-textSecondary text-center py-4">No skills added yet.</p>
      )}

      {/* Skills Modal Editor */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-overlay backdrop-blur-xs">
          <div className="bg-surface w-full max-w-lg p-6 rounded-2xl border border-border shadow-paper-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-textPrimary">Edit Skills</h3>
              <button
                onClick={() => setIsEditing(false)}
                className="p-1 text-textSecondary hover:text-textPrimary rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-dangerSoft border border-danger/30 text-danger text-xs rounded-xl">
                {error}
              </div>
            )}

            {/* Add Skill Input */}
            <div className="p-3 bg-surface2 rounded-xl border border-border mb-4">
              <label className="block text-xs font-semibold text-textPrimary mb-2">
                Add New Skill (up to 20)
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={newSkillName}
                  onChange={(e) => setNewSkillName(e.target.value)}
                  placeholder="e.g. Python Programming"
                  list="skill-suggestions"
                  className="flex-1 px-3 py-2 bg-surface border border-border rounded-xl text-xs text-textPrimary focus:outline-none focus:border-primary"
                />
                <datalist id="skill-suggestions">
                  {SKILL_SUGGESTIONS.map((s) => (
                    <option key={s} value={s} />
                  ))}
                </datalist>

                <select
                  value={newSkillLevel}
                  onChange={(e: any) => setNewSkillLevel(e.target.value)}
                  className="px-3 py-2 bg-surface border border-border rounded-xl text-xs text-textPrimary focus:outline-none focus:border-primary"
                >
                  <option value="BEGINNER">Beginner</option>
                  <option value="INTERMEDIATE">Intermediate</option>
                  <option value="ADVANCED">Advanced</option>
                </select>

                <button
                  type="button"
                  onClick={handleAddSkill}
                  className="px-3 py-2 bg-primary hover:bg-primaryHover text-primaryContrast rounded-xl text-xs font-bold transition flex items-center justify-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  Add
                </button>
              </div>
            </div>

            {/* Current Skills List */}
            <div className="space-y-2 mb-6">
              {skillList.map((skill, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 bg-surface2 rounded-xl border border-border text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-textPrimary">{skill.name}</span>
                    <span className="text-[10px] text-textSecondary uppercase font-medium">
                      {skill.level}
                    </span>
                    {skill.source === 'VANTAGE' && (
                      <span className="px-1.5 py-0.5 rounded-full bg-primary text-primaryContrast text-[9px] font-bold">
                        Verified
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleToggleHide(idx)}
                      className="p-1.5 text-textSecondary hover:text-textPrimary"
                      title={skill.hidden ? 'Show on profile' : 'Hide on profile'}
                    >
                      {skill.hidden ? <EyeOff className="w-4 h-4 text-danger" /> : <Eye className="w-4 h-4 text-primary" />}
                    </button>
                    {skill.source !== 'VANTAGE' && (
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(idx)}
                        className="p-1.5 text-textSecondary hover:text-danger"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 bg-surface2 text-textSecondary hover:text-textPrimary rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={loading}
                className="px-4 py-2 bg-primary hover:bg-primaryHover text-primaryContrast rounded-xl text-xs font-bold transition flex items-center gap-1"
              >
                <Check className="w-4 h-4" />
                {loading ? 'Saving...' : 'Save Skills'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
