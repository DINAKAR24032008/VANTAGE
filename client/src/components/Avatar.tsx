import React from 'react';
import { MALE_AVATAR_PRESETS, FEMALE_AVATAR_PRESETS, NEUTRAL_AVATAR_PRESETS } from '../utils/avatarPresets';

interface AvatarProps {
  user?: any;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  onClick?: () => void;
  showRoleRing?: boolean;
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  user,
  size = 'md',
  onClick,
  showRoleRing = true,
  className = '',
}) => {
  const name = user?.name || 'User';
  const role = user?.role || 'learner';

  // Parse avatar object if passed as string JSON
  let avatarObj: any = {};
  if (user?.avatar) {
    if (typeof user.avatar === 'string') {
      try {
        avatarObj = JSON.parse(user.avatar);
      } catch {
        avatarObj = { type: 'initials' };
      }
    } else {
      avatarObj = user.avatar;
    }
  }

  // Size styling map
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-base',
    xl: 'w-20 h-20 text-2xl',
  }[size];

  // Role Ring Styling (Theme aware: Learner = --primary, Trainer = --accent, Admin = --admin-ring)
  const ringClasses = showRoleRing
    ? role === 'admin'
      ? 'border-2 border-adminRing'
      : role === 'trainer'
      ? 'border-2 border-accent'
      : 'border-2 border-primary'
    : 'border border-border';

  // Compute initials
  const initials = name
    .split(' ')
    .filter(Boolean)
    .map((n: string) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  const bgColor = avatarObj?.bgColor || 'var(--primary)';

  // Determine preset SVG if applicable
  let presetSvg = '';
  if (avatarObj?.type === 'preset' && avatarObj?.presetId) {
    const allPresets = [...MALE_AVATAR_PRESETS, ...FEMALE_AVATAR_PRESETS, ...NEUTRAL_AVATAR_PRESETS];
    const match = allPresets.find((p) => p.id === avatarObj.presetId);
    if (match) presetSvg = match.svg;
  }

  return (
    <div
      onClick={onClick}
      className={`relative inline-flex items-center justify-center rounded-full overflow-hidden shrink-0 transition-transform ${
        onClick ? 'cursor-pointer hover:scale-105 active:scale-95' : ''
      } ${sizeClasses} ${ringClasses} ${className}`}
      style={{ backgroundColor: bgColor }}
      title={`${name} (${role})`}
    >
      {avatarObj?.type === 'upload' && avatarObj?.url ? (
        <img
          src={avatarObj.url}
          alt={name}
          className="w-full h-full object-cover rounded-full"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLElement).style.display = 'none';
          }}
        />
      ) : presetSvg ? (
        <div
          className="w-full h-full flex items-center justify-center p-0.5"
          dangerouslySetInnerHTML={{ __html: presetSvg }}
        />
      ) : (
        <span className="font-bold text-primaryContrast tracking-wider leading-none">
          {initials}
        </span>
      )}
    </div>
  );
};
