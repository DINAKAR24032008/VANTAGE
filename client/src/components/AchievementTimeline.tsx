import React, { useState } from 'react';
import { Trophy, Award, FolderGit2, BookOpen, Code2, ShieldCheck, Plus, Edit2, Trash2, X, Check } from 'lucide-react';
import { AchievementData } from '../types';
import api from '../services/api';

interface AchievementTimelineProps {
  achievements: AchievementData[];
  isOwner?: boolean;
  onUpdate?: () => void;
}

export const AchievementTimeline: React.FC<AchievementTimelineProps> = ({
  achievements,
  isOwner = false,
  onUpdate,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AchievementData | null>(null);
  const [formData, setFormData] = useState<AchievementData>({
    title: '',
    organization: '',
    type: 'AWARD',
    description: '',
    date: new Date().toISOString().split('T')[0],
    link: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'AWARD':
        return <Trophy className="w-4 h-4 text-amber-500" />;
      case 'PROJECT':
        return <FolderGit2 className="w-4 h-4 text-primary" />;
      case 'PUBLICATION':
        return <BookOpen className="w-4 h-4 text-blue-500" />;
      case 'HACKATHON':
        return <Code2 className="w-4 h-4 text-purple-500" />;
      case 'CERTIFICATION':
        return <ShieldCheck className="w-4 h-4 text-emerald-500" />;
      default:
        return <Award className="w-4 h-4 text-accent" />;
    }
  };

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      title: '',
      organization: '',
      type: 'AWARD',
      description: '',
      date: new Date().toISOString().split('T')[0],
      link: '',
    });
    setError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: AchievementData) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      organization: item.organization,
      type: item.type,
      description: item.description || '',
      date: item.date ? item.date.split('T')[0] : '',
      link: item.link || '',
    });
    setError(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this achievement?')) return;
    try {
      await api.delete(`/profile/me/achievements/${id}`);
      setError(null);
      if (onUpdate) onUpdate();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete achievement');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.title.trim() || !formData.organization.trim()) {
      setError('Title and Organization are required.');
      return;
    }

    try {
      setLoading(true);
      if (editingItem && editingItem.id) {
        await api.put(`/profile/me/achievements/${editingItem.id}`, formData);
      } else {
        await api.post('/profile/me/achievements', formData);
      }
      setIsModalOpen(false);
      if (onUpdate) onUpdate();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save achievement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-surface p-5 rounded-2xl border border-border shadow-paper-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-sm font-bold text-textPrimary flex items-center gap-1.5">
            🏆 Career & Academic Achievements
          </h4>
          <p className="text-[11px] text-textSecondary">Awards, projects, hackathons & publications</p>
        </div>
        {isOwner && (
          <button
            type="button"
            onClick={handleOpenAdd}
            className="px-3 py-1.5 bg-primarySoft text-primary border border-primary/30 rounded-xl text-xs font-bold hover:bg-primary/20 transition flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> Add
          </button>
        )}
      </div>

      {error && !isModalOpen && (
        <div className="mb-4 p-3 bg-dangerSoft border border-danger/30 text-danger text-xs rounded-xl">
          {error}
        </div>
      )}

      {achievements && achievements.length > 0 ? (
        <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
          {achievements.map((item, idx) => (
            <div key={item.id || idx} className="relative group">
              {/* Timeline Dot */}
              <div className="absolute -left-6 top-1.5 w-5 h-5 rounded-full bg-surface border-2 border-primary flex items-center justify-center">
                {getTypeIcon(item.type)}
              </div>

              <div className="p-3.5 bg-surface2 rounded-xl border border-border">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase text-primary tracking-wider">
                      {item.type}
                    </span>
                    <h5 className="text-xs font-bold text-textPrimary">{item.title}</h5>
                    <p className="text-[11px] font-semibold text-textSecondary">{item.organization}</p>
                  </div>
                  {item.date && (
                    <span className="text-[10px] text-textSecondary bg-surface px-2 py-0.5 rounded-md border border-border">
                      {new Date(item.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short' })}
                    </span>
                  )}
                </div>

                {item.description && (
                  <p className="mt-2 text-xs text-textSecondary leading-relaxed">{item.description}</p>
                )}

                {isOwner && item.id && (
                  <div className="mt-3 pt-2 border-t border-border flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(item)}
                      className="text-[11px] text-textSecondary hover:text-primary flex items-center gap-1"
                    >
                      <Edit2 className="w-3 h-3" /> Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(item.id!)}
                      className="text-[11px] text-textSecondary hover:text-danger flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" /> Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-textSecondary text-center py-4">No achievements added yet.</p>
      )}

      {/* Achievement Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-overlay backdrop-blur-xs">
          <div className="bg-surface w-full max-w-lg p-6 rounded-2xl border border-border shadow-paper-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-textPrimary">
                {editingItem ? 'Edit Achievement' : 'Add Achievement'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
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

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-textSecondary mb-1">Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. National Hackathon Winner"
                  className="w-full px-3 py-2 bg-surface2 border border-border rounded-xl text-xs text-textPrimary focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-textSecondary mb-1">Organization / Event *</label>
                <input
                  type="text"
                  required
                  value={formData.organization}
                  onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                  placeholder="e.g. Tech-Fest 2026 / Vantage Platform"
                  className="w-full px-3 py-2 bg-surface2 border border-border rounded-xl text-xs text-textPrimary focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-textSecondary mb-1">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e: any) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2 bg-surface2 border border-border rounded-xl text-xs text-textPrimary focus:outline-none focus:border-primary"
                  >
                    <option value="AWARD">Award / Recognition</option>
                    <option value="PROJECT">Key Project</option>
                    <option value="HACKATHON">Hackathon</option>
                    <option value="CERTIFICATION">External Certification</option>
                    <option value="PUBLICATION">Publication / Paper</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-textSecondary mb-1">Date</label>
                  <input
                    type="date"
                    value={formData.date || ''}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 bg-surface2 border border-border rounded-xl text-xs text-textPrimary focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-textSecondary mb-1">
                  Description (max 300 chars)
                </label>
                <textarea
                  rows={3}
                  maxLength={300}
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe your role, impact, or key highlights..."
                  className="w-full px-3 py-2 bg-surface2 border border-border rounded-xl text-xs text-textPrimary focus:outline-none focus:border-primary resize-none"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-surface2 text-textSecondary hover:text-textPrimary rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-primary hover:bg-primaryHover text-primaryContrast rounded-xl text-xs font-bold transition flex items-center gap-1"
                >
                  <Check className="w-4 h-4" />
                  {loading ? 'Saving...' : 'Save Achievement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
