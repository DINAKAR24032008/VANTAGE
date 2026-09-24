import React, { useState, useEffect } from 'react';
import { UserPlus, UserCheck, Clock, UserMinus } from 'lucide-react';
import api from '../services/api';

interface FollowButtonProps {
  targetUserId: string;
  isFollowedByMe?: boolean;
  isPending?: boolean;
  followsMe?: boolean;
  accountVisibility?: 'PUBLIC' | 'PRIVATE';
  onStatusChange?: (status: 'ACCEPTED' | 'PENDING' | 'NONE', isFollowedByMe: boolean) => void;
  size?: 'sm' | 'md';
  className?: string;
}

export const FollowButton: React.FC<FollowButtonProps> = ({
  targetUserId,
  isFollowedByMe: initialIsFollowedByMe = false,
  isPending: initialIsPending = false,
  followsMe = false,
  accountVisibility = 'PUBLIC',
  onStatusChange,
  size = 'md',
  className = '',
}) => {
  const [isFollowed, setIsFollowed] = useState<boolean>(initialIsFollowedByMe);
  const [isPendingState, setIsPendingState] = useState<boolean>(initialIsPending);
  const [loading, setLoading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    setIsFollowed(initialIsFollowedByMe);
    setIsPendingState(initialIsPending);
  }, [initialIsFollowedByMe, initialIsPending]);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (loading) return;

    try {
      setLoading(true);

      if (isFollowed || isPendingState) {
        // Unfollow or Cancel Request
        await api.delete(`/api/follow/${targetUserId}`);
        setIsFollowed(false);
        setIsPendingState(false);
        if (onStatusChange) onStatusChange('NONE', false);
      } else {
        // Follow or Follow Back
        const res = await api.post(`/api/follow/${targetUserId}`);
        const status = res.data.status;
        const accepted = status === 'ACCEPTED';
        const pending = status === 'PENDING';

        setIsFollowed(accepted);
        setIsPendingState(pending);
        if (onStatusChange) onStatusChange(status, accepted);
      }
    } catch (err) {
      console.error('Failed to update follow status:', err);
    } finally {
      setLoading(false);
    }
  };

  const sizeClasses = size === 'sm' ? 'px-2.5 py-1 text-xs rounded-lg' : 'px-3.5 py-1.5 text-xs rounded-xl font-bold';

  if (isFollowed) {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        onMouseEnter={() => setIsHovered(true)}
        aria-label="Unfollow user"
        onMouseLeave={() => setIsHovered(false)}
        className={`${sizeClasses} transition flex items-center justify-center gap-1.5 shadow-paper-sm ${
          isHovered
            ? 'bg-dangerSoft text-danger border border-danger/30'
            : 'bg-primarySoft text-primary border border-primary/30'
        } ${className}`}
      >
        {isHovered ? (
          <>
            <UserMinus className="w-3.5 h-3.5" />
            Unfollow
          </>
        ) : (
          <>
            <UserCheck className="w-3.5 h-3.5" />
            Following
          </>
        )}
      </button>
    );
  }

  if (isPendingState) {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        title="Click to cancel follow request"
        className={`${sizeClasses} bg-amber-500/10 text-amber-500 border border-amber-500/30 hover:bg-amber-500/20 transition flex items-center justify-center gap-1.5 shadow-paper-sm ${className}`}
      >
        <Clock className="w-3.5 h-3.5" />
        Requested
      </button>
    );
  }

  const isPrivate = accountVisibility === 'PRIVATE';
  const label = isPrivate
    ? followsMe ? 'Request back' : 'Request'
    : followsMe ? 'Follow back' : 'Follow';

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className={`${sizeClasses} bg-primary hover:bg-primaryHover text-primaryContrast transition flex items-center justify-center gap-1.5 shadow-paper-sm ${className}`}
    >
      <UserPlus className="w-3.5 h-3.5" />
      {label}
    </button>
  );
};
