import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { Avatar } from '../components/Avatar';
import { SkillsEditor } from '../components/SkillsEditor';
import { AchievementTimeline } from '../components/AchievementTimeline';
import { ExperienceList } from '../components/ExperienceList';
import { HeadingEmoji } from '../components/HeadingEmoji';
import { MapPin, User, GraduationCap, ExternalLink, ShieldCheck, ArrowLeft } from 'lucide-react';
import { UserSkillData, AchievementData, ExperienceData, Certificate } from '../types';

export const PublicProfilePage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPublicProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get(`/profile/${userId}`);
        setProfileData(res.data);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load public profile');
      } finally {
        setLoading(false);
      }
    };
    if (userId) fetchPublicProfile();
  }, [userId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-semibold text-textSecondary">Loading learner profile...</p>
        </div>
      </div>
    );
  }

  if (error || !profileData) {
    return (
      <div className="min-h-screen p-8 bg-background flex flex-col items-center justify-center text-center">
        <h2 className="text-xl font-bold text-textPrimary mb-2">Profile Not Available</h2>
        <p className="text-xs text-textSecondary mb-4">{error || 'User profile not found.'}</p>
        <Link
          to="/dashboard"
          className="px-4 py-2 bg-primary text-primaryContrast rounded-xl text-xs font-bold"
        >
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 bg-background text-textPrimary max-w-4xl mx-auto space-y-6">
      <Link
        to={-1 as any}
        className="inline-flex items-center gap-1.5 text-xs text-textSecondary hover:text-primary font-semibold mb-2"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </Link>

      {/* Header Card */}
      <div className="bg-surface p-6 sm:p-8 rounded-2xl border border-border shadow-paper-md">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
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

        {profileData.bio && (
          <p className="mt-4 text-xs text-textSecondary leading-relaxed border-t border-border pt-3">
            {profileData.bio}
          </p>
        )}
      </div>

      {/* Education Info */}
      {profileData.highestDegree && profileData.highestDegree !== 'NONE' && (
        <div className="bg-surface p-5 rounded-2xl border border-border shadow-paper-sm">
          <h4 className="text-xs font-bold text-textPrimary flex items-center gap-1.5 mb-2">
            <GraduationCap className="w-4 h-4 text-primary" />
            Education
          </h4>
          <p className="text-xs font-semibold text-textPrimary">
            {profileData.highestDegree} in {profileData.fieldOfStudy || 'General'}
          </p>
          <p className="text-xs text-textSecondary">{profileData.institution}</p>
        </div>
      )}

      {/* LinkedIn Profile link if visible */}
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

      {/* Career Showcase components */}
      {profileData.skills && profileData.skills.length > 0 && (
        <SkillsEditor skills={profileData.skills} isOwner={false} />
      )}

      {profileData.achievements && profileData.achievements.length > 0 && (
        <AchievementTimeline achievements={profileData.achievements} isOwner={false} />
      )}

      {profileData.experiences && profileData.experiences.length > 0 && (
        <ExperienceList experiences={profileData.experiences} isOwner={false} />
      )}
    </div>
  );
};
