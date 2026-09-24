import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Avatar } from '../components/Avatar';
import { ProfileCompletionMeter } from '../components/ProfileCompletionMeter';
import { LinkedInCard } from '../components/LinkedInCard';
import { SkillsEditor } from '../components/SkillsEditor';
import { AchievementTimeline } from '../components/AchievementTimeline';
import { ExperienceList } from '../components/ExperienceList';
import { CertificateModal } from '../components/CertificateModal';
import { CountrySelect } from '../components/CountrySelect';
import { NotificationSettings } from '../components/NotificationSettings';
import { UserListModal } from '../components/UserListModal';
import { HeadingEmoji } from '../components/HeadingEmoji';
import {
  User, MapPin, Briefcase, GraduationCap, Edit2, ShieldCheck, CheckCircle2,
  ExternalLink, Eye, EyeOff, X, Check, Award, BookOpen, Users, Share2, Lock, Globe, Ban, AtSign
} from 'lucide-react';
import { UserProfileData, UserSkillData, AchievementData, ExperienceData, Certificate } from '../types';

export const ProfilePage: React.FC = () => {
  const { user } = useAuth();

  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [skills, setSkills] = useState<UserSkillData[]>([]);
  const [achievements, setAchievements] = useState<AchievementData[]>([]);
  const [experiences, setExperiences] = useState<ExperienceData[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [stats, setStats] = useState({ enrolledCount: 0, completedCount: 0, certificateCount: 0 });
  const [completionPercent, setCompletionPercent] = useState<number>(0);

  const [loading, setLoading] = useState(true);
  const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null);

  // Follow / Followers state
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [accountVisibility, setAccountVisibility] = useState<'PUBLIC' | 'PRIVATE'>('PUBLIC');
  const [shareToast, setShareToast] = useState(false);
  const [userListModalTab, setUserListModalTab] = useState<'followers' | 'following' | null>(null);

  // Username editing state
  const [isUsernameModalOpen, setIsUsernameModalOpen] = useState(false);
  const [usernameInput, setUsernameInput] = useState('');
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [usernameSaving, setUsernameSaving] = useState(false);

  // Edit Modals
  const [isHeaderModalOpen, setIsHeaderModalOpen] = useState(false);
  const [isEducationModalOpen, setIsEducationModalOpen] = useState(false);
  const [headerError, setHeaderError] = useState<string | null>(null);
  const [eduError, setEduError] = useState<string | null>(null);
  const [headerFormData, setHeaderFormData] = useState({
    fullName: '',
    country: 'India',
    state: '',
    city: '',
    profession: 'STUDENT',
    bio: '',
  });

  const [eduFormData, setEduFormData] = useState({
    highestDegree: 'BACHELORS',
    fieldOfStudy: '',
    institution: '',
    graduationYear: new Date().getFullYear(),
  });

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/profile/me');
      setProfile(res.data.profile);
      setSkills(res.data.skills || []);
      setAchievements(res.data.achievements || []);
      setExperiences(res.data.experiences || []);
      setCertificates(res.data.certificates || []);
      setStats(res.data.stats || { enrolledCount: 0, completedCount: 0, certificateCount: 0 });
      setCompletionPercent(res.data.completionPercent || 0);

      if (res.data.profile) {
        const p = res.data.profile;
        setHeaderFormData({
          fullName: p.fullName || '',
          country: p.country || 'India',
          state: p.state || '',
          city: p.city || '',
          profession: p.profession || 'STUDENT',
          bio: p.bio || '',
        });
        setEduFormData({
          highestDegree: p.highestDegree || 'BACHELORS',
          fieldOfStudy: p.fieldOfStudy || '',
          institution: p.institution || '',
          graduationYear: p.graduationYear || new Date().getFullYear(),
        });
        setFollowersCount(p.followersCount ?? 0);
        setFollowingCount(p.followingCount ?? 0);
        setAccountVisibility(p.accountVisibility ?? 'PUBLIC');
        setUsernameInput(p.username ?? '');
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, []);

  const handleSaveHeader = async (e: React.FormEvent) => {
    e.preventDefault();
    setHeaderError(null);
    try {
      await api.put('/profile/me', headerFormData);
      setIsHeaderModalOpen(false);
      fetchProfileData();
    } catch (err: any) {
      setHeaderError(err.response?.data?.error || 'Failed to update header profile info');
    }
  };

  const handleSaveEducation = async (e: React.FormEvent) => {
    e.preventDefault();
    setEduError(null);
    try {
      await api.put('/profile/me', {
        ...eduFormData,
        graduationYear: Number(eduFormData.graduationYear),
      });
      setIsEducationModalOpen(false);
      fetchProfileData();
    } catch (err: any) {
      setEduError(err.response?.data?.error || 'Failed to update education details');
    }
  };

  const handlePrivacyToggle = async (key: string, currentValue: boolean) => {
    try {
      await api.put('/profile/me', { [key]: !currentValue });
      fetchProfileData();
    } catch (err) {
      console.error('Failed to update privacy setting', err);
    }
  };

  const handleSaveUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    setUsernameError(null);
    setUsernameSaving(true);
    try {
      await api.patch('/profile/me/username', { username: usernameInput.trim() });
      setIsUsernameModalOpen(false);
      fetchProfileData();
    } catch (err: any) {
      setUsernameError(err.response?.data?.error || 'Failed to update username');
    } finally {
      setUsernameSaving(false);
    }
  };

  const handleVisibilityToggle = async () => {
    const next = accountVisibility === 'PUBLIC' ? 'PRIVATE' : 'PUBLIC';
    try {
      await api.patch('/profile/me/visibility', { accountVisibility: next });
      setAccountVisibility(next);
    } catch (err: any) {
      console.error('Failed to update visibility', err);
    }
  };

  const handleShareProfile = () => {
    if (!profile?.username) return;
    const url = `${window.location.origin}/u/${profile.username}`;
    navigator.clipboard.writeText(url).then(() => {
      setShareToast(true);
      setTimeout(() => setShareToast(false), 3000);
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-semibold text-textSecondary">Loading profile showcase...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 bg-background text-textPrimary max-w-5xl mx-auto space-y-6">
      {/* 1. Header Card */}
      <div className="bg-surface p-6 sm:p-8 rounded-2xl border border-border shadow-paper-md relative">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <Avatar user={user} size="xl" />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-extrabold text-textPrimary">
                  {profile?.fullName || user?.name}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-primarySoft text-primary text-xs font-bold capitalize">
                  {user?.role}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-surface2 text-textSecondary text-xs font-semibold">
                  {profile?.profession || 'STUDENT'}
                </span>
              </div>

              {/* @username row */}
              <div className="flex items-center gap-2 mt-1">
                {profile?.username ? (
                  <button
                    type="button"
                    onClick={() => { setUsernameInput(profile.username!); setIsUsernameModalOpen(true); }}
                    className="flex items-center gap-1 text-xs text-primary font-semibold hover:underline"
                    title="Edit your public username"
                  >
                    <AtSign className="w-3.5 h-3.5" />
                    {profile.username}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsUsernameModalOpen(true)}
                    className="flex items-center gap-1 text-xs text-textSecondary hover:text-primary font-semibold"
                  >
                    <AtSign className="w-3.5 h-3.5" />
                    Set username
                  </button>
                )}
              </div>

              <div className="flex items-center gap-4 mt-2 text-xs text-textSecondary flex-wrap">
                {(profile?.city || profile?.country) && (
                  <span className="flex items-center gap-1 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-primary" />
                    {profile.city ? `${profile.city}, ` : ''}{profile.country}
                  </span>
                )}
                {user?.phone && user.phoneVerified && (
                  <span className="flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    {user.phone} (Verified)
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            {profile?.username && (
              <button
                type="button"
                onClick={handleShareProfile}
                className="px-4 py-2 bg-surface2 hover:bg-border/50 text-textSecondary border border-border rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                title="Copy public profile link"
              >
                <Share2 className="w-3.5 h-3.5" />
                Share Profile
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsHeaderModalOpen(true)}
              className="w-full sm:w-auto px-4 py-2 bg-primarySoft hover:bg-primary/20 text-primary border border-primary/30 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-paper-sm"
            >
              <Edit2 className="w-3.5 h-3.5" />
              Edit Profile
            </button>
          </div>
        </div>

        {/* Share toast */}
        {shareToast && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-4 py-2 bg-primary text-primaryContrast text-xs font-bold rounded-xl shadow-paper-md animate-in fade-in duration-200">
            ✅ Profile link copied!
          </div>
        )}
      </div>

      {/* Completion Meter & Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-2">
          <ProfileCompletionMeter
            profile={profile}
            completionPercent={completionPercent}
            onEditClick={() => setIsHeaderModalOpen(true)}
          />
        </div>

        {/* Learning Stats Card */}
        <div className="bg-surface p-5 rounded-2xl border border-border shadow-paper-sm flex flex-col justify-between">
          <h4 className="text-sm font-bold text-textPrimary flex items-center gap-1.5 mb-3">
            <Award className="w-4 h-4 text-primary" />
            Learning Stats
          </h4>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-3 bg-surface2 rounded-xl border border-border">
              <span className="block text-xl font-black text-primary">{stats.enrolledCount}</span>
              <span className="text-[10px] text-textSecondary uppercase font-bold">Enrolled</span>
            </div>
            <div className="p-3 bg-surface2 rounded-xl border border-border">
              <span className="block text-xl font-black text-emerald-600 dark:text-emerald-400">
                {stats.completedCount}
              </span>
              <span className="text-[10px] text-textSecondary uppercase font-bold">Completed</span>
            </div>
            <div className="p-3 bg-surface2 rounded-xl border border-border">
              <span className="block text-xl font-black text-accent">{stats.certificateCount}</span>
              <span className="text-[10px] text-textSecondary uppercase font-bold">Certs</span>
            </div>
          </div>
        </div>

        {/* Followers / Following Card */}
        <div className="bg-surface p-5 rounded-2xl border border-border shadow-paper-sm flex flex-col justify-between">
          <h4 className="text-sm font-bold text-textPrimary flex items-center gap-1.5 mb-3">
            <Users className="w-4 h-4 text-primary" />
            Network
          </h4>
          <div className="grid grid-cols-2 gap-2 text-center">
            <button
              type="button"
              onClick={() => setUserListModalTab('followers')}
              className="p-3 bg-surface2 rounded-xl border border-border hover:bg-border/50 transition cursor-pointer"
            >
              <span className="block text-xl font-black text-primary">{followersCount}</span>
              <span className="text-[10px] text-textSecondary uppercase font-bold">Followers</span>
            </button>
            <button
              type="button"
              onClick={() => setUserListModalTab('following')}
              className="p-3 bg-surface2 rounded-xl border border-border hover:bg-border/50 transition cursor-pointer"
            >
              <span className="block text-xl font-black text-emerald-600 dark:text-emerald-400">
                {followingCount}
              </span>
              <span className="text-[10px] text-textSecondary uppercase font-bold">Following</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. About Section */}
      <div className="bg-surface p-6 rounded-2xl border border-border shadow-paper-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-textPrimary flex items-center gap-1.5">
            <User className="w-4 h-4 text-primary" />
            About & Bio
          </h3>
          <button
            type="button"
            onClick={() => setIsHeaderModalOpen(true)}
            className="text-xs text-primary font-bold hover:underline"
          >
            Edit
          </button>
        </div>
        <p className="text-xs text-textSecondary leading-relaxed whitespace-pre-wrap">
          {profile?.bio || 'No short bio added yet. Click edit to add an introduction.'}
        </p>
      </div>

      {/* 3. Education Section */}
      <div className="bg-surface p-6 rounded-2xl border border-border shadow-paper-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-textPrimary flex items-center gap-1.5">
            <GraduationCap className="w-4 h-4 text-primary" />
            Education & Qualifications
          </h3>
          <button
            type="button"
            onClick={() => setIsEducationModalOpen(true)}
            className="text-xs text-primary font-bold hover:underline"
          >
            Edit
          </button>
        </div>
        <div className="p-3.5 bg-surface2 rounded-xl border border-border flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-surface border border-border text-primary">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-textPrimary">
              {profile?.highestDegree || 'BACHELORS'} in {profile?.fieldOfStudy || 'General Field'}
            </h4>
            <p className="text-xs font-semibold text-textSecondary">
              {profile?.institution || 'Institution not specified'}
            </p>
            {profile?.graduationYear && (
              <span className="text-[11px] text-textSecondary mt-1 block">
                Class of {profile.graduationYear}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 4. Career Showcase Section */}
      <div className="space-y-6">
        <div className="border-b border-border pb-2">
          <h2 className="text-lg font-bold text-textPrimary flex items-center gap-2">
            <HeadingEmoji emoji="💼" />
            Career Showcase & LinkedIn Integration
          </h2>
          <p className="text-xs text-textSecondary">
            Showcase your skills, work experience, achievements, and Vantage certificates.
          </p>
        </div>

        {/* 4a. LinkedIn Profile Card */}
        <LinkedInCard
          linkedinUrl={profile?.linkedinUrl}
          isOwner={true}
          onUpdate={() => fetchProfileData()}
        />

        {/* 4b. Skills & Competencies */}
        <SkillsEditor skills={skills} isOwner={true} onUpdate={() => fetchProfileData()} />

        {/* 4c. Achievements */}
        <AchievementTimeline
          achievements={achievements}
          isOwner={true}
          onUpdate={() => fetchProfileData()}
        />

        {/* 4d. Work Experience */}
        <ExperienceList
          experiences={experiences}
          isOwner={true}
          onUpdate={() => fetchProfileData()}
        />

        {/* 4e. Vantage Certificates & Add to LinkedIn Button */}
        <div className="bg-surface p-6 rounded-2xl border border-border shadow-paper-sm">
          <h4 className="text-sm font-bold text-textPrimary flex items-center gap-1.5 mb-4">
            <Award className="w-4 h-4 text-primary" />
            Verified Vantage Certificates
          </h4>

          {certificates && certificates.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {certificates.map((cert) => {
                const issueDate = new Date(cert.issuedAt);
                const month = issueDate.getMonth() + 1;
                const year = issueDate.getFullYear();
                const certUrl = `${window.location.origin}${cert.certificateUrl || ''}`;
                const linkedinShareUrl = `https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME&name=${encodeURIComponent(
                  cert.course?.title || 'Vantage Course Certificate'
                )}&organizationName=Vantage&issueMonth=${month}&issueYear=${year}&certId=${cert.certificateNumber}&certUrl=${encodeURIComponent(
                  certUrl
                )}`;

                return (
                  <div
                    key={cert.id}
                    className="p-4 bg-surface2 rounded-xl border border-border flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <span className="text-[10px] font-bold text-primary uppercase">
                        Certificate #{cert.certificateNumber}
                      </span>
                      <h5 className="text-xs font-bold text-textPrimary">{cert.course?.title}</h5>
                      <span className="text-[11px] text-textSecondary block mt-0.5">
                        Issued: {issueDate.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-border">
                      <button
                        type="button"
                        onClick={() => setSelectedCertificate(cert)}
                        className="flex-1 py-1.5 px-3 bg-surface hover:bg-border/50 text-textPrimary rounded-lg text-xs font-semibold transition"
                      >
                        View Certificate
                      </button>
                      <a
                        href={linkedinShareUrl}
                        target="_blank"
                        rel="noopener noreferrer nofollow"
                        className="py-1.5 px-3 bg-[#0A66C2] hover:bg-[#084e96] text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-paper-sm"
                        title="Add certification to your LinkedIn profile"
                      >
                        Add to LinkedIn
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-textSecondary text-center py-4">
              No course certificates earned yet. Complete a course to receive verified credentials!
            </p>
          )}
        </div>
      </div>

      {/* 5. Privacy Settings Card */}
      <div className="bg-surface p-6 rounded-2xl border border-border shadow-paper-sm">
        <h3 className="text-sm font-bold text-textPrimary flex items-center gap-1.5 mb-3">
          <Eye className="w-4 h-4 text-primary" />
          Public Profile Privacy Controls
        </h3>
        <p className="text-xs text-textSecondary mb-4">
          Control what information is visible when other learners view your public profile page.
        </p>

        {/* Account Visibility (PUBLIC / PRIVATE) */}
        <div className="mb-3 flex items-center justify-between p-3 bg-surface2 rounded-xl border border-border">
          <div>
            <span className="text-xs font-bold text-textPrimary block">Account Visibility</span>
            <span className="text-[11px] text-textSecondary">
              {accountVisibility === 'PUBLIC'
                ? 'Your profile is public — anyone with the link can view it.'
                : 'Your profile is private — only approved followers can view it.'}
            </span>
          </div>
          <button
            type="button"
            onClick={handleVisibilityToggle}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
              accountVisibility === 'PUBLIC'
                ? 'bg-primarySoft text-primary border border-primary/30'
                : 'bg-surface text-textSecondary border border-border'
            }`}
          >
            {accountVisibility === 'PUBLIC' ? <Globe className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
            {accountVisibility === 'PUBLIC' ? 'Public' : 'Private'}
          </button>
        </div>

        <div className="space-y-3">
          {[
            {
              key: 'showcaseVisible',
              label: 'Show Career Showcase on public profile',
              desc: 'Allows learners to view your skills, achievements, and experience.',
              val: profile?.showcaseVisible ?? true,
            },
            {
              key: 'linkedinVisible',
              label: 'Show LinkedIn link on public profile',
              desc: 'Displays your LinkedIn profile button to other users.',
              val: profile?.linkedinVisible ?? true,
            },
            {
              key: 'locationVisible',
              label: 'Show Location (Country & City)',
              desc: 'Displays your location on forum hover cards and roster.',
              val: profile?.locationVisible ?? true,
            },
            {
              key: 'educationVisible',
              label: 'Show Education & Degree info',
              desc: 'Displays your degree and institution.',
              val: profile?.educationVisible ?? true,
            },
          ].map((item) => (
            <div
              key={item.key}
              className="flex items-center justify-between p-3 bg-surface2 rounded-xl border border-border"
            >
              <div>
                <span className="text-xs font-bold text-textPrimary block">{item.label}</span>
                <span className="text-[11px] text-textSecondary">{item.desc}</span>
              </div>
              <button
                type="button"
                onClick={() => handlePrivacyToggle(item.key, item.val)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                  item.val
                    ? 'bg-primarySoft text-primary border border-primary/30'
                    : 'bg-surface text-textSecondary border border-border'
                }`}
              >
                {item.val ? <Check className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                {item.val ? 'Visible' : 'Hidden'}
              </button>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-textSecondary italic mt-3">
          Note: Your official email, phone number, and date of birth are ALWAYS private and never shown to other learners.
        </p>
      </div>

      {/* Notification Preferences & Reminders */}
      <NotificationSettings />

      {/* Username Edit Modal */}
      {isUsernameModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-overlay backdrop-blur-xs">
          <div className="bg-surface w-full max-w-sm p-6 rounded-2xl border border-border shadow-paper-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-textPrimary flex items-center gap-2">
                <AtSign className="w-4 h-4 text-primary" />
                Set Your Username
              </h3>
              <button onClick={() => { setIsUsernameModalOpen(false); setUsernameError(null); }} className="p-1 text-textSecondary hover:text-textPrimary rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-[11px] text-textSecondary mb-4">
              Your username is used in your public profile URL: <code className="bg-surface2 px-1 rounded">/u/your-username</code>
              <br />3–30 chars, lowercase letters, numbers and dots only. Max 2 changes per 30 days.
            </p>

            {usernameError && (
              <div className="mb-3 p-3 bg-dangerSoft border border-danger/30 text-danger text-xs rounded-xl">
                {usernameError}
              </div>
            )}

            <form onSubmit={handleSaveUsername} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-textSecondary mb-1">Username</label>
                <div className="flex items-center gap-1">
                  <span className="text-textSecondary text-sm font-bold">@</span>
                  <input
                    type="text"
                    required
                    minLength={3}
                    maxLength={30}
                    pattern="[a-z0-9.]+"
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value.toLowerCase())}
                    className="flex-1 px-3 py-2 bg-surface2 border border-border rounded-xl text-xs text-textPrimary focus:outline-none focus:border-primary"
                    placeholder="your.username"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => { setIsUsernameModalOpen(false); setUsernameError(null); }}
                  className="px-4 py-2 bg-surface2 text-textSecondary hover:text-textPrimary rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={usernameSaving}
                  className="px-4 py-2 bg-primary hover:bg-primaryHover text-primaryContrast rounded-xl text-xs font-bold shadow-paper-sm transition disabled:opacity-60"
                >
                  {usernameSaving ? 'Saving…' : 'Save Username'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Followers / Following List Modal */}
      {userListModalTab && profile?.username && (
        <UserListModal
          username={profile.username}
          initialTab={userListModalTab}
          isOwner={true}
          onClose={() => { setUserListModalTab(null); fetchProfileData(); }}
        />
      )}

      {/* Header Info Edit Modal */}
      {isHeaderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-overlay backdrop-blur-xs">
          <div className="bg-surface w-full max-w-md p-6 rounded-2xl border border-border shadow-paper-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-textPrimary">Edit Profile Info</h3>
              <button
                onClick={() => setIsHeaderModalOpen(false)}
                className="p-1 text-textSecondary hover:text-textPrimary rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {headerError && (
              <div className="mb-4 p-3 bg-dangerSoft border border-danger/30 text-danger text-xs rounded-xl">
                {headerError}
              </div>
            )}

            <form onSubmit={handleSaveHeader} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-textSecondary mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={headerFormData.fullName}
                  onChange={(e) => setHeaderFormData({ ...headerFormData, fullName: e.target.value })}
                  className="w-full px-3 py-2 bg-surface2 border border-border rounded-xl text-xs text-textPrimary focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-textSecondary mb-1">Country</label>
                <CountrySelect
                  value={headerFormData.country}
                  onChange={(country) => setHeaderFormData({ ...headerFormData, country })}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-textSecondary mb-1">State</label>
                  <input
                    type="text"
                    value={headerFormData.state}
                    onChange={(e) => setHeaderFormData({ ...headerFormData, state: e.target.value })}
                    className="w-full px-3 py-2 bg-surface2 border border-border rounded-xl text-xs text-textPrimary focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-textSecondary mb-1">City</label>
                  <input
                    type="text"
                    required
                    value={headerFormData.city}
                    onChange={(e) => setHeaderFormData({ ...headerFormData, city: e.target.value })}
                    className="w-full px-3 py-2 bg-surface2 border border-border rounded-xl text-xs text-textPrimary focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-textSecondary mb-1">Profession</label>
                <select
                  value={headerFormData.profession}
                  onChange={(e) => setHeaderFormData({ ...headerFormData, profession: e.target.value })}
                  className="w-full px-3 py-2 bg-surface2 border border-border rounded-xl text-xs text-textPrimary focus:outline-none focus:border-primary"
                >
                  <option value="STUDENT">Student</option>
                  <option value="WORKING_PROFESSIONAL">Working Professional</option>
                  <option value="FREELANCER">Freelancer</option>
                  <option value="JOB_SEEKER">Job Seeker</option>
                  <option value="ENTREPRENEUR">Entrepreneur</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-textSecondary mb-1">
                  Short Bio (max 300 chars)
                </label>
                <textarea
                  rows={3}
                  maxLength={300}
                  value={headerFormData.bio}
                  onChange={(e) => setHeaderFormData({ ...headerFormData, bio: e.target.value })}
                  className="w-full px-3 py-2 bg-surface2 border border-border rounded-xl text-xs text-textPrimary focus:outline-none focus:border-primary resize-none"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsHeaderModalOpen(false)}
                  className="px-4 py-2 bg-surface2 text-textSecondary hover:text-textPrimary rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary hover:bg-primaryHover text-primaryContrast rounded-xl text-xs font-bold shadow-paper-sm transition"
                >
                  Save Profile Info
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Education Info Edit Modal */}
      {isEducationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-overlay backdrop-blur-xs">
          <div className="bg-surface w-full max-w-md p-6 rounded-2xl border border-border shadow-paper-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-textPrimary">Edit Education Info</h3>
              <button
                onClick={() => setIsEducationModalOpen(false)}
                className="p-1 text-textSecondary hover:text-textPrimary rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {eduError && (
              <div className="mb-4 p-3 bg-dangerSoft border border-danger/30 text-danger text-xs rounded-xl">
                {eduError}
              </div>
            )}

            <form onSubmit={handleSaveEducation} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-textSecondary mb-1">Highest Degree</label>
                <select
                  value={eduFormData.highestDegree}
                  onChange={(e) => setEduFormData({ ...eduFormData, highestDegree: e.target.value })}
                  className="w-full px-3 py-2 bg-surface2 border border-border rounded-xl text-xs text-textPrimary focus:outline-none focus:border-primary"
                >
                  <option value="BACHELORS">Bachelor's Degree</option>
                  <option value="MASTERS">Master's Degree</option>
                  <option value="DIPLOMA">Diploma</option>
                  <option value="HIGH_SCHOOL">High School</option>
                  <option value="DOCTORATE">Doctorate (Ph.D)</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-textSecondary mb-1">Field of Study</label>
                <input
                  type="text"
                  value={eduFormData.fieldOfStudy}
                  onChange={(e) => setEduFormData({ ...eduFormData, fieldOfStudy: e.target.value })}
                  className="w-full px-3 py-2 bg-surface2 border border-border rounded-xl text-xs text-textPrimary focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-textSecondary mb-1">Institution</label>
                <input
                  type="text"
                  value={eduFormData.institution}
                  onChange={(e) => setEduFormData({ ...eduFormData, institution: e.target.value })}
                  className="w-full px-3 py-2 bg-surface2 border border-border rounded-xl text-xs text-textPrimary focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-textSecondary mb-1">Graduation Year</label>
                <input
                  type="number"
                  value={eduFormData.graduationYear}
                  onChange={(e) => setEduFormData({ ...eduFormData, graduationYear: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-surface2 border border-border rounded-xl text-xs text-textPrimary focus:outline-none focus:border-primary"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEducationModalOpen(false)}
                  className="px-4 py-2 bg-surface2 text-textSecondary hover:text-textPrimary rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary hover:bg-primaryHover text-primaryContrast rounded-xl text-xs font-bold shadow-paper-sm transition"
                >
                  Save Education
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Certificate View Modal */}
      {selectedCertificate && (
        <CertificateModal
          certificate={selectedCertificate}
          onClose={() => setSelectedCertificate(null)}
        />
      )}
    </div>
  );
};
