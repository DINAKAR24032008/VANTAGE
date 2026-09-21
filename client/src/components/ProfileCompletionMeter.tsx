import React from 'react';
import { CheckCircle2, Circle, AlertCircle } from 'lucide-react';
import { UserProfileData } from '../types';

interface ProfileCompletionMeterProps {
  profile: UserProfileData | null;
  completionPercent: number;
  onEditClick?: () => void;
}

export const ProfileCompletionMeter: React.FC<ProfileCompletionMeterProps> = ({
  profile,
  completionPercent,
  onEditClick,
}) => {
  const items = [
    { label: 'Full Name', done: !!profile?.fullName },
    { label: 'Country & City', done: !!profile?.country && !!profile?.city },
    { label: 'Profession & Education', done: !!profile?.profession && profile.profession !== 'OTHER' },
    { label: 'Short Bio', done: !!profile?.bio },
    { label: 'LinkedIn Profile', done: !!profile?.linkedinUrl },
    { label: 'Work Experience / Company', done: !!profile?.company || !!profile?.institution },
  ];

  return (
    <div className="bg-surface p-5 rounded-2xl border border-border shadow-paper-sm">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h4 className="text-sm font-bold text-textPrimary flex items-center gap-1.5">
            🎯 Profile Completion
          </h4>
          <p className="text-xs text-textSecondary">Keep your profile complete to unlock career recommendations.</p>
        </div>
        <span className="text-lg font-black text-primary">{completionPercent}%</span>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2.5 bg-surface2 rounded-full overflow-hidden mb-4 border border-border/40">
        <div
          className="h-full bg-primary transition-all duration-500 rounded-full"
          style={{ width: `${completionPercent}%` }}
        ></div>
      </div>

      {/* Checklist */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-center gap-2">
            {item.done ? (
              <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
            ) : (
              <Circle className="w-4 h-4 text-textSecondary/50 flex-shrink-0" />
            )}
            <span className={item.done ? 'text-textPrimary font-medium' : 'text-textSecondary'}>
              {item.label}
            </span>
          </div>
        ))}
      </div>

      {completionPercent < 100 && onEditClick && (
        <button
          type="button"
          onClick={onEditClick}
          className="mt-4 w-full py-2 px-3 bg-primarySoft text-primary border border-primary/30 rounded-xl text-xs font-bold hover:bg-primary/20 transition flex items-center justify-center gap-1"
        >
          <AlertCircle className="w-3.5 h-3.5" />
          Complete Remaining Fields
        </button>
      )}
    </div>
  );
};
