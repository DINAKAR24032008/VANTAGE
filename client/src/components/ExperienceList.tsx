import React, { useState } from 'react';
import { Briefcase, Calendar, Plus, Edit2, Trash2, X, Check } from 'lucide-react';
import { ExperienceData } from '../types';
import api from '../services/api';

interface ExperienceListProps {
  experiences: ExperienceData[];
  isOwner?: boolean;
  onUpdate?: () => void;
}

export const ExperienceList: React.FC<ExperienceListProps> = ({ experiences, isOwner = false, onUpdate }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ExperienceData | null>(null);
  const [formData, setFormData] = useState<ExperienceData>({
    jobTitle: '',
    company: '',
    employmentType: 'Full-time',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    description: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      jobTitle: '',
      company: '',
      employmentType: 'Full-time',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      description: '',
    });
    setError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: ExperienceData) => {
    setEditingItem(item);
    setFormData({
      jobTitle: item.jobTitle,
      company: item.company,
      employmentType: item.employmentType || 'Full-time',
      startDate: item.startDate ? item.startDate.split('T')[0] : '',
      endDate: item.endDate ? item.endDate.split('T')[0] : '',
      description: item.description || '',
    });
    setError(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this experience record?')) return;
    try {
      await api.delete(`/profile/me/experience/${id}`);
      setError(null);
      if (onUpdate) onUpdate();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete experience record');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.jobTitle.trim() || !formData.company.trim()) {
      setError('Job Title and Company are required.');
      return;
    }

    try {
      setLoading(true);
      if (editingItem && editingItem.id) {
        await api.put(`/profile/me/experience/${editingItem.id}`, formData);
      } else {
        await api.post('/profile/me/experience', formData);
      }
      setIsModalOpen(false);
      if (onUpdate) onUpdate();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save experience');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-surface p-5 rounded-2xl border border-border shadow-paper-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-sm font-bold text-textPrimary flex items-center gap-1.5">
            💼 Work Experience
          </h4>
          <p className="text-[11px] text-textSecondary">Professional career history</p>
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

      {experiences && experiences.length > 0 ? (
        <div className="space-y-3">
          {experiences.map((item, idx) => (
            <div key={item.id || idx} className="p-4 bg-surface2 rounded-xl border border-border">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-surface border border-border text-primary">
                    <Briefcase className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-textPrimary">{item.jobTitle}</h5>
                    <p className="text-xs font-semibold text-textSecondary">{item.company}</p>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-textSecondary">
                      <span className="px-2 py-0.5 rounded bg-surface border border-border">
                        {item.employmentType}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-textSecondary/70" />
                        {new Date(item.startDate).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                        })}{' '}
                        -{' '}
                        {item.endDate
                          ? new Date(item.endDate).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                            })
                          : 'Present'}
                      </span>
                    </div>
                  </div>
                </div>

                {isOwner && item.id && (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(item)}
                      className="p-1.5 text-textSecondary hover:text-primary rounded-lg"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(item.id!)}
                      className="p-1.5 text-textSecondary hover:text-danger rounded-lg"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {item.description && (
                <p className="mt-3 text-xs text-textSecondary leading-relaxed border-t border-border pt-2">
                  {item.description}
                </p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-textSecondary text-center py-4">No work experience added yet.</p>
      )}

      {/* Experience Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-overlay backdrop-blur-xs">
          <div className="bg-surface w-full max-w-lg p-6 rounded-2xl border border-border shadow-paper-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-textPrimary">
                {editingItem ? 'Edit Experience' : 'Add Work Experience'}
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
                <label className="block text-xs font-medium text-textSecondary mb-1">Job Title *</label>
                <input
                  type="text"
                  required
                  value={formData.jobTitle}
                  onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                  placeholder="e.g. Software Engineer / Web Developer Intern"
                  className="w-full px-3 py-2 bg-surface2 border border-border rounded-xl text-xs text-textPrimary focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-textSecondary mb-1">Company / Organization *</label>
                <input
                  type="text"
                  required
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  placeholder="e.g. InnovateTech Solutions"
                  className="w-full px-3 py-2 bg-surface2 border border-border rounded-xl text-xs text-textPrimary focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-textSecondary mb-1">Employment Type</label>
                  <select
                    value={formData.employmentType}
                    onChange={(e) => setFormData({ ...formData, employmentType: e.target.value })}
                    className="w-full px-3 py-2 bg-surface2 border border-border rounded-xl text-xs text-textPrimary focus:outline-none focus:border-primary"
                  >
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Internship">Internship</option>
                    <option value="Freelance">Freelance</option>
                    <option value="Contract">Contract</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-textSecondary mb-1">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.startDate || ''}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3 py-2 bg-surface2 border border-border rounded-xl text-xs text-textPrimary focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-textSecondary mb-1">
                  End Date (Leave blank if current position)
                </label>
                <input
                  type="date"
                  value={formData.endDate || ''}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full px-3 py-2 bg-surface2 border border-border rounded-xl text-xs text-textPrimary focus:outline-none focus:border-primary"
                />
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
                  placeholder="Key responsibilities, technologies used, achievements..."
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
                  {loading ? 'Saving...' : 'Save Experience'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
