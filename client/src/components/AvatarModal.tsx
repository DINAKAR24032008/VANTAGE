import React, { useState } from 'react';
import { getPresetsForGender, AVATAR_BG_COLORS, AvatarPreset } from '../utils/avatarPresets';
import { Avatar } from './Avatar';
import { HeadingEmoji } from './HeadingEmoji';
import { X, Upload, Check, Sparkles, User, Palette } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

interface Props {
  user?: any;
  onClose: () => void;
  onAvatarUpdated?: (updatedUser: any) => void;
}

export const AvatarModal: React.FC<Props> = ({ user: passedUser, onClose, onAvatarUpdated: passedOnAvatarUpdated }) => {
  const { user: authUser, updateUserAvatar } = useAuth();
  const user = passedUser || authUser;

  // Parse initial avatar settings
  let initialAvatar: any = { type: 'preset', presetId: 'm1', bgColor: '#166534' };
  if (user?.avatar) {
    if (typeof user.avatar === 'string') {
      try { initialAvatar = JSON.parse(user.avatar); } catch {}
    } else {
      initialAvatar = user.avatar;
    }
  }

  const [gender, setGender] = useState<'male' | 'female' | 'other'>(user?.gender || 'other');
  const [avatarType, setAvatarType] = useState<'preset' | 'upload' | 'initials'>(initialAvatar.type || 'preset');
  const [selectedPresetId, setSelectedPresetId] = useState<string>(
    initialAvatar.presetId || (gender === 'female' ? 'f1' : 'm1')
  );
  const [selectedBgColor, setSelectedBgColor] = useState<string>(initialAvatar.bgColor || '#166534');
  const [uploadUrl, setUploadUrl] = useState<string>(initialAvatar.url || '');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const presets = getPresetsForGender(gender);

  const handleGenderChange = (newGender: 'male' | 'female' | 'other') => {
    setGender(newGender);
    const newPresets = getPresetsForGender(newGender);
    setSelectedPresetId(newPresets[0].id);
    if (avatarType === 'initials') setAvatarType('preset');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type and size (jpg, png, webp, max 2MB)
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Please select a JPG, PNG, or WEBP image.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('File size must be 2 MB or smaller.');
      return;
    }

    try {
      setUploading(true);
      setError(null);

      const formData = new FormData();
      formData.append('avatar', file);

      const res = await api.post(`/users/${user.id}/avatar-upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const timestampedUrl = `${res.data.url}?t=${Date.now()}`;
      setUploadUrl(timestampedUrl);
      setAvatarType('upload');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to upload photo.');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      const avatarPayload = {
        type: avatarType,
        presetId: avatarType === 'preset' ? selectedPresetId : undefined,
        url: avatarType === 'upload' ? uploadUrl : undefined,
        bgColor: selectedBgColor,
      };

      if (passedOnAvatarUpdated) {
        const res = await api.put(`/users/${user.id}/avatar`, {
          gender,
          avatar: avatarPayload,
        });
        passedOnAvatarUpdated(res.data);
      } else {
        await updateUserAvatar(gender, avatarPayload);
      }
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save avatar profile.');
    } finally {
      setSaving(false);
    }
  };

  // Preview user mock object
  const previewUser = {
    name: user?.name,
    role: user?.role,
    gender,
    avatar: {
      type: avatarType,
      presetId: selectedPresetId,
      url: uploadUrl,
      bgColor: selectedBgColor,
    },
  };

  return (
    <div className="fixed inset-0 z-50 bg-overlay backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-surface rounded-3xl shadow-paper-lg max-w-xl w-full border border-border overflow-hidden text-textPrimary flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-border flex items-center justify-between bg-surface2">
          <div>
            <span className="text-[10px] text-accent font-bold uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-accent" /> Profile Identity Studio
            </span>
            <h2 className="text-xl font-bold text-textPrimary mt-0.5">
              <HeadingEmoji emoji="👤" />
              Customize Your Avatar
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-textSecondary hover:text-textPrimary rounded-xl hover:bg-border/50 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-surface">
          {error && (
            <div className="p-3 bg-dangerSoft border border-danger/30 text-danger text-xs rounded-xl font-medium">
              {error}
            </div>
          )}

          {/* Live Preview Card */}
          <div className="p-4 bg-surface2 rounded-2xl border border-border flex items-center gap-4">
            <Avatar user={previewUser} size="xl" showRoleRing={true} />
            <div>
              <div className="text-sm font-bold text-textPrimary">{user?.name}</div>
              <div className="text-xs text-primary font-semibold capitalize">{user?.role} • {gender}</div>
              <p className="text-[11px] text-textSecondary mt-0.5">
                Avatar preview with role indicator ring
              </p>
            </div>
          </div>

          {/* Step 1: Gender Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-textSecondary uppercase tracking-wider flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-accent" /> Gender Identity & Expression
            </label>
            <div className="flex flex-wrap items-center gap-2">
              {[
                { key: 'male', label: 'Male' },
                { key: 'female', label: 'Female' },
                { key: 'other', label: 'Prefer not to say / Neutral' },
              ].map((g) => (
                <button
                  key={g.key}
                  type="button"
                  onClick={() => handleGenderChange(g.key as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                    gender === g.key
                      ? 'bg-primarySoft text-primary border-primary'
                      : 'bg-surface2 text-textSecondary border-border hover:text-textPrimary'
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          {/* Step 2: Avatar Type Selection & Presets */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-textSecondary uppercase tracking-wider">
                Avatar Presets ({gender})
              </label>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setAvatarType('initials')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                    avatarType === 'initials'
                      ? 'bg-primarySoft text-primary border-primary'
                      : 'bg-surface2 text-textSecondary border-border'
                  }`}
                >
                  Use Initials
                </button>

                <label className="px-3 py-1 bg-surface2 hover:bg-border/50 text-primary border border-primary/30 rounded-lg text-xs font-bold cursor-pointer transition flex items-center gap-1">
                  <Upload className="w-3.5 h-3.5" />
                  {uploading ? 'Uploading...' : 'Upload Photo'}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </label>
              </div>
            </div>

            {/* 12 Presets Grid */}
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 p-3 bg-surface2 rounded-2xl border border-border max-h-48 overflow-y-auto">
              {presets.map((preset: AvatarPreset) => {
                const isSelected = avatarType === 'preset' && selectedPresetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      setSelectedPresetId(preset.id);
                      setAvatarType('preset');
                    }}
                    className={`p-2 rounded-xl border flex flex-col items-center justify-center transition relative ${
                      isSelected
                        ? 'bg-primarySoft border-primary shadow-paper-sm'
                        : 'bg-surface border-border hover:border-primary/40'
                    }`}
                  >
                    <div
                      className="w-10 h-10 rounded-full p-0.5 overflow-hidden"
                      style={{ backgroundColor: selectedBgColor }}
                      dangerouslySetInnerHTML={{ __html: preset.svg }}
                    />
                    <span className="text-[9px] font-bold text-textSecondary mt-1 truncate max-w-[50px]">
                      {preset.label}
                    </span>
                    {isSelected && (
                      <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-primary text-primaryContrast rounded-full flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 3: Background Color Swatches */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-textSecondary uppercase tracking-wider flex items-center gap-1">
              <Palette className="w-3.5 h-3.5 text-accent" /> Background Color Palette
            </label>
            <div className="flex flex-wrap items-center gap-2">
              {AVATAR_BG_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedBgColor(color)}
                  className={`w-7 h-7 rounded-full border-2 transition transform hover:scale-110 flex items-center justify-center ${
                    selectedBgColor === color ? 'border-primary scale-110' : 'border-border'
                  }`}
                  style={{ backgroundColor: color }}
                >
                  {selectedBgColor === color && <Check className="w-3.5 h-3.5 text-primaryContrast stroke-[3]" />}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-surface2 border-t border-border flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-textSecondary hover:text-textPrimary rounded-xl transition"
          >
            Skip for now
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 bg-primary hover:bg-primaryHover text-primaryContrast text-xs font-bold rounded-xl transition shadow-paper-sm flex items-center gap-1.5 disabled:opacity-50"
          >
            {saving ? 'Saving Avatar...' : 'Save Profile Avatar'}
          </button>
        </div>
      </div>
    </div>
  );
};
