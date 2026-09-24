import React, { useState } from 'react';
import { ExternalLink, Edit2, ShieldCheck, AlertCircle, X, Check } from 'lucide-react';
import api from '../services/api';

interface LinkedInCardProps {
  linkedinUrl: string | null | undefined;
  isOwner?: boolean;
  onUpdate?: (newUrl: string | null) => void;
}

// Inline SVG for LinkedIn Official Logo
const LinkedInIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
  </svg>
);

export const LinkedInCard: React.FC<LinkedInCardProps> = ({ linkedinUrl, isOwner = false, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [inputUrl, setInputUrl] = useState(linkedinUrl || '');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const validateUrl = (url: string) => {
    if (!url.trim()) return true;
    let trimmed = url.trim();
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      trimmed = 'https://' + trimmed;
    }
    const regex = /^https:\/\/(www\.|[a-z]{2}\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+\/?$/i;
    return regex.test(trimmed) || trimmed === 'https://www.linkedin.com/in/your-name';
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (inputUrl && !validateUrl(inputUrl)) {
      setError('Invalid LinkedIn URL format. Use https://linkedin.com/in/your-handle');
      return;
    }

    try {
      setLoading(true);
      const res = await api.put('/profile/me/linkedin', { linkedinUrl: inputUrl });
      if (onUpdate) onUpdate(res.data.linkedinUrl);
      setIsEditing(false);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update LinkedIn link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-surface p-5 rounded-2xl border border-border shadow-paper-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#0A66C2]/10 text-[#0A66C2] flex items-center justify-center">
            <LinkedInIcon className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-textPrimary">LinkedIn Career Showcase</h4>
            <p className="text-[11px] text-textSecondary">Verified professional network link</p>
          </div>
        </div>
        {isOwner && (
          <button
            type="button"
            onClick={() => {
              setInputUrl(linkedinUrl || '');
              setIsEditing(true);
            }}
            className="p-1.5 hover:bg-surface2 text-textSecondary hover:text-primary rounded-lg transition"
            title="Edit LinkedIn URL"
          >
            <Edit2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {linkedinUrl ? (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 bg-surface2 rounded-xl border border-border">
          <div className="flex items-center gap-2 overflow-hidden">
            <ShieldCheck className="w-4 h-4 text-primary flex-shrink-0" />
            <span className="text-xs text-textPrimary font-semibold truncate">{linkedinUrl}</span>
          </div>
          <a
            href={linkedinUrl}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="w-full sm:w-auto px-3.5 py-1.5 bg-[#0A66C2] hover:bg-[#084e96] text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-paper-sm"
          >
            <LinkedInIcon className="w-3.5 h-3.5" />
            View LinkedIn Profile
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      ) : (
        <div className="p-4 bg-surface2 rounded-xl border border-dashed border-border text-center">
          <p className="text-xs text-textSecondary mb-2">
            Add your LinkedIn profile to showcase your career achievements.
          </p>
          {isOwner && (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="px-3 py-1.5 bg-primarySoft text-primary border border-primary/30 rounded-lg text-xs font-bold hover:bg-primary/20 transition"
            >
              Add LinkedIn Handle
            </button>
          )}
        </div>
      )}

      {/* Modal Editor */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-overlay backdrop-blur-xs">
          <div className="bg-surface w-full max-w-md p-6 rounded-2xl border border-border shadow-paper-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-textPrimary flex items-center gap-2">
                <LinkedInIcon className="w-5 h-5 text-[#0A66C2]" />
                Update LinkedIn Handle
              </h3>
              <button
                onClick={() => setIsEditing(false)}
                className="p-1 text-textSecondary hover:text-textPrimary rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-dangerSoft border border-danger/30 text-danger text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-textSecondary mb-1">
                  LinkedIn Profile URL
                </label>
                <input
                  type="text"
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  placeholder="https://www.linkedin.com/in/your-name"
                  className="w-full px-3 py-2 bg-surface2 border border-border rounded-xl text-xs text-textPrimary focus:outline-none focus:border-primary"
                />
                <p className="mt-1.5 text-[11px] text-textSecondary">
                  Example: <code className="bg-surface2 px-1 rounded">https://www.linkedin.com/in/alex-morgan</code>
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 bg-surface2 text-textSecondary hover:text-textPrimary rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-primary hover:bg-primaryHover text-primaryContrast rounded-xl text-xs font-bold shadow-paper-sm transition flex items-center gap-1"
                >
                  <Check className="w-4 h-4" />
                  {loading ? 'Saving...' : 'Save Handle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
