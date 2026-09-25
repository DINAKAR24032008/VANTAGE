import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Avatar } from '../components/Avatar';
import { FollowButton } from '../components/FollowButton';
import { UserListModal } from '../components/UserListModal';
import { SkillsEditor } from '../components/SkillsEditor';
import { AchievementTimeline } from '../components/AchievementTimeline';
import { ExperienceList } from '../components/ExperienceList';
import { HeadingEmoji } from '../components/HeadingEmoji';
import { MapPin, User, GraduationCap, ExternalLink, ShieldCheck, ArrowLeft, Lock, Users, Share2, AlertCircle } from 'lucide-react';

export const PublicUsernameProfilePage: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const { user: currentUser } = useAuth();
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // User List Modal state
  const [modalTab, setModalTab] = useState<'followers' | 'following' | null>(null);
  const [shareToast, setShareToast] = useState(false);

  const fetchPublicProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/api/u/${username}`);
      setProfileData(res.data);
    } catch (err: any) {
      if (err.response?.status === 404) {
        setError(`The username @${username} does not exist on Vantage.`);
      } else {
        setError(err.response?.data?.message || 'Failed to load public profile');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (username) fetchPublicProfile();
  }, [username]);

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setShareToast(true);
    setTimeout(() => setShareToast(false), 3000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-textSecondary">Loading profile @{username}...</p>
        </div>
      </div>
    );
  }

  // 404 Non-Existent Username or Blocked Profile State
  if (error || !profileData) {
    return (
      <div className="min-h-screen p-8 bg-background flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-dangerSoft border border-danger/30 flex items-center justify-center text-danger mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-extrabold text-textPrimary mb-2">Profile Not Found</h2>
        <p className="text-xs text-textSecondary mb-6 max-w-sm leading-relaxed">
          {error || `The account @${username} could not be found.`}
        </p>
        <Link
          to="/"
          className="px-4 py-2 bg-primary text-primaryContrast rounded-xl text-xs font-bold shadow-paper-sm hover:bg-primaryHover transition"
        >
          Back to Vantage Home
        </Link>
      </div>
    );
  }

  const isOwner = currentUser?.id === profileData.id;

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 bg-background text-textPrimary max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link
          to={-1 as any}
          className="inline-flex items-center gap-1.5 text-xs text-textSecondary hover:text-primary font-semibold"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>

        {shareToast && (
          <span className="text-xs font-bold text-primary bg-primarySoft px-3 py-1 rounded-full border border-primary/30 animate-in fade-in">
            Link copied to clipboard!
          </span>
        )}
      </div>

      {/* Header Card */}
      <div className="bg-surface p-6 sm:p-8 rounded-2xl border border-border shadow-paper-md space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <Avatar user={{ name: profileData.name, avatar: profileData.avatar, role: profileData.role }} size="xl" />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-extrabold text-textPrimary">{profileData.name}</h1>
                <span className="px-2.5 py-0.5 rounded-full bg-primarySoft text-primary text-xs font-bold capitalize">
                  {profileData.role}
                </span>
                {profileData.profession && (
                  <span className="px-2.5 py-0.5 rounded-full bg-surface2 text-textSecondary text-xs font-semibold">
                    {profileData.profession}
                  </span>
                )}
              </div>

              <div className="text-xs text-textSecondary mt-0.5 font-medium">
                @{profileData.username}
              </div>

              {(profileData.jobTitle || profileData.company) && (
                <p className="text-xs font-semibold text-textSecondary mt-1">
                  {profileData.jobTitle} {profileData.company ? `@ ${profileData.company}` : ''}
                </p>
              )}

              {profileData.country && (
                <span className="flex items-center gap-1 text-xs text-textSecondary mt-2 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-primary" />
                  {profileData.city ? `${profileData.city}, ` : ''}{profileData.country}
                </span>
              )}
            </div>
          </div>

          {/* Action Button: Share / Follow / Login */}
          <div>
            {isOwner ? (
              <button
                type="button"
                onClick={handleShare}
                className="px-4 py-2 bg-primarySoft hover:bg-primary/20 text-primary border border-primary/30 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-paper-sm"
              >
                <Share2 className="w-3.5 h-3.5" /> Share Profile
              </button>
            ) : currentUser ? (
              <FollowButton
                targetUserId={profileData.id}
                isFollowedByMe={profileData.isFollowedByMe}
                isPending={profileData.isPending}
                followsMe={profileData.followsMe}
                onStatusChange={() => fetchPublicProfile()}
              />
            ) : (
              <Link
                to="/login"
                className="px-4 py-2 bg-primary hover:bg-primaryHover text-primaryContrast rounded-xl text-xs font-bold shadow-paper-sm transition"
              >
                Log in to follow
              </Link>
            )}
          </div>
        </div>

        {/* Bio */}
        {profileData.bio && !profileData.isPrivateAccount && (
          <p className="text-xs text-textSecondary leading-relaxed border-t border-border pt-3">
            {profileData.bio}
          </p>
        )}

        {/* Followers & Following Stat Row */}
        <div className="flex items-center gap-6 border-t border-border pt-3 text-xs">
          <button
            type="button"
            onClick={() => setModalTab('followers')}
            className="flex items-center gap-1.5 hover:text-primary transition font-bold"
          >
            <Users className="w-4 h-4 text-primary" />
            <span className="text-textPrimary">{profileData.followersCount || 0}</span>
            <span className="text-textSecondary font-semibold">Followers</span>
          </button>

          <button
            type="button"
            onClick={() => setModalTab('following')}
            className="flex items-center gap-1.5 hover:text-primary transition font-bold"
          >
            <span className="text-textPrimary">{profileData.followingCount || 0}</span>
            <span className="text-textSecondary font-semibold">Following</span>
          </button>
        </div>
      </div>

      {/* Private Account State */}
      {profileData.isPrivateAccount ? (
        <div className="bg-surface p-8 rounded-2xl border border-border shadow-paper-sm text-center flex flex-col items-center justify-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="text-base font-extrabold text-textPrimary">This Account is Private</h3>
          <p className="text-xs text-textSecondary max-w-sm leading-relaxed">
            Follow @{profileData.username} to request access to their complete learning showcase, achievements, and qualifications.
          </p>
        </div>
      ) : (
        <>
          {/* Education Info */}
          {profileData.highestDegree && profileData.highestDegree !== 'NONE' && (
            <div className="bg-surface p-5 rounded-2xl border border-border shadow-paper-sm">
              <h4 className="text-xs font-bold text-textPrimary flex items-center gap-1.5 mb-2">
                <GraduationCap className="w-4 h-4 text-primary" />
                Education & Qualifications
              </h4>
              <p className="text-xs font-semibold text-textPrimary">
                {profileData.highestDegree} in {profileData.fieldOfStudy || 'General Field'}
              </p>
              <p className="text-xs text-textSecondary">{profileData.institution}</p>
            </div>
          )}

          {/* Official LinkedIn Profile Link */}
          {profileData.linkedinUrl && (
            <div className="bg-surface p-5 rounded-2xl border border-border shadow-paper-sm flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-primary" />
                <span className="text-xs font-bold text-textPrimary">Official LinkedIn Profile</span>
              </div>
              <a
                href={profileData.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="px-3.5 py-1.5 bg-[#0A66C2] hover:bg-[#084e96] text-white rounded-lg text-xs font-bold transition flex items-center gap-1"
              >
                View LinkedIn
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}

          {/* Career Showcase Components */}
          {profileData.skills && profileData.skills.length > 0 && (
            <SkillsEditor skills={profileData.skills} isOwner={false} />
          )}

          {profileData.achievements && profileData.achievements.length > 0 && (
            <AchievementTimeline achievements={profileData.achievements} isOwner={false} />
          )}

          {profileData.experiences && profileData.experiences.length > 0 && (
            <ExperienceList experiences={profileData.experiences} isOwner={false} />
          )}
        </>
      )}

      {/* User List Modal */}
      {modalTab && (
        <UserListModal
          username={profileData.username}
          initialTab={modalTab}
          isOwner={isOwner}
          onClose={() => setModalTab(null)}
        />
      )}
    </div>
  );
};
