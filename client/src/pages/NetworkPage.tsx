import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search,
  X,
  Loader2,
  Users,
  UserCheck,
  UserPlus,
  Compass,
  MapPin,
  Briefcase,
  Sparkles,
  AlertCircle,
  RefreshCw,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { Avatar } from '../components/Avatar';
import { FollowButton } from '../components/FollowButton';
import { HeadingEmoji } from '../components/HeadingEmoji';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

interface PersonResultItem {
  id: string;
  userId: string;
  username: string | null;
  fullName: string;
  avatar: any;
  role: string;
  profession: string;
  jobTitle?: string | null;
  country: string;
  city?: string | null;
  accountVisibility: 'PUBLIC' | 'PRIVATE';
  followStatus: 'NONE' | 'PENDING' | 'ACCEPTED';
  isFollowedByMe: boolean;
  isPending: boolean;
  followsMe: boolean;
  mutualFollowersCount: number;
  suggestionReason?: string;
}

export const NetworkPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [activeTab, setActiveTab] = useState<'discover' | 'followers' | 'following' | 'requests'>('discover');

  // Discover / Search state
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'LEARNER' | 'TRAINER' | 'ADMIN'>('ALL');
  const [professionFilter, setProfessionFilter] = useState<string>('ALL');

  const [searchResults, setSearchResults] = useState<PersonResultItem[]>([]);
  const [suggestions, setSuggestions] = useState<PersonResultItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  const [loadingSearch, setLoadingSearch] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [rateLimited, setRateLimited] = useState(false);

  // Tab lists state (Followers / Following / Requests)
  const [tabUsers, setTabUsers] = useState<any[]>([]);
  const [loadingTab, setLoadingTab] = useState(false);

  // Sync query from URL search params
  useEffect(() => {
    const urlQ = searchParams.get('q');
    if (urlQ !== null && urlQ !== searchQuery) {
      setSearchQuery(urlQ);
    }
  }, [searchParams]);

  // Fetch Suggestions on mount
  const fetchSuggestions = async () => {
    setLoadingSuggestions(true);
    try {
      const res = await api.get('/api/people/suggestions');
      setSuggestions(res.data.items || []);
    } catch (err) {
      console.error('Failed to fetch suggestions', err);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  useEffect(() => {
    fetchSuggestions();
  }, []);

  // Debounced Search Trigger (300ms)
  useEffect(() => {
    if (activeTab !== 'discover') return;

    if (!searchQuery.trim() && roleFilter === 'ALL' && professionFilter === 'ALL') {
      setSearchResults([]);
      setNextCursor(null);
      setErrorText(null);
      setRateLimited(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoadingSearch(true);
      setErrorText(null);
      setRateLimited(false);

      try {
        const sanitized = searchQuery.trim().slice(0, 100).replace(/[^a-zA-Z0-9\s@._-]/g, '');
        let url = `/api/people/search?q=${encodeURIComponent(sanitized)}`;

        if (roleFilter !== 'ALL') url += `&role=${roleFilter}`;
        if (professionFilter !== 'ALL') url += `&profession=${professionFilter}`;

        const res = await api.get(url);
        setSearchResults(res.data.items || []);
        setNextCursor(res.data.nextCursor || null);
      } catch (err: any) {
        if (err.response?.status === 429) {
          setRateLimited(true);
          setErrorText('Rate limit reached (30 searches/min). Please wait a moment before trying again.');
        } else {
          setErrorText('Unable to complete search. Please check your connection and try again.');
        }
      } finally {
        setLoadingSearch(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, roleFilter, professionFilter, activeTab]);

  // Load More Results
  const handleLoadMore = async () => {
    if (!nextCursor || loadingMore) return;

    setLoadingMore(true);
    try {
      const sanitized = searchQuery.trim().slice(0, 100).replace(/[^a-zA-Z0-9\s@._-]/g, '');
      let url = `/api/people/search?q=${encodeURIComponent(sanitized)}&cursor=${nextCursor}`;

      if (roleFilter !== 'ALL') url += `&role=${roleFilter}`;
      if (professionFilter !== 'ALL') url += `&profession=${professionFilter}`;

      const res = await api.get(url);
      setSearchResults((prev) => [...prev, ...(res.data.items || [])]);
      setNextCursor(res.data.nextCursor || null);
    } catch (err) {
      console.error('Failed to load more', err);
    } finally {
      setLoadingMore(false);
    }
  };

  // Fetch Followers / Following / Requests for non-discover tabs
  const fetchTabData = async (tab: 'followers' | 'following' | 'requests') => {
    if (!user?.id) return;
    setLoadingTab(true);
    try {
      // Find logged-in user's username
      const meRes = await api.get('/profile/me');
      const myUsername = meRes.data.profile?.username;

      if (tab === 'followers' && myUsername) {
        const res = await api.get(`/profile/u/${myUsername}/followers`);
        setTabUsers(res.data.followers || []);
      } else if (tab === 'following' && myUsername) {
        const res = await api.get(`/profile/u/${myUsername}/following`);
        setTabUsers(res.data.following || []);
      } else if (tab === 'requests') {
        const res = await api.get('/api/follow/requests');
        setTabUsers(res.data.requests || []);
      }
    } catch (err) {
      console.error(`Failed to load tab ${tab}`, err);
    } finally {
      setLoadingTab(false);
    }
  };

  useEffect(() => {
    if (activeTab !== 'discover') {
      fetchTabData(activeTab);
    }
  }, [activeTab]);

  const handleCardClick = (username: string | null, userId: string) => {
    if (username) {
      navigate(`/u/${username}`);
    } else {
      navigate(`/profile/${userId}`);
    }
  };

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 bg-background text-textPrimary max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-textPrimary flex items-center gap-2">
            <HeadingEmoji emoji="🔍" />
            Network & Connections
          </h1>
          <p className="text-xs text-textSecondary mt-1">
            Discover learners, trainers, and admins, build your professional network, and track follow requests.
          </p>
        </div>
      </div>

      {/* Tabs Row */}
      <div className="flex items-center gap-2 border-b border-border overflow-x-auto pb-1">
        {[
          { id: 'discover', label: '🔍 Discover people' },
          { id: 'followers', label: '👥 Followers' },
          { id: 'following', label: '✨ Following' },
          { id: 'requests', label: '📩 Requests' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 flex-shrink-0 ${
              activeTab === tab.id
                ? 'bg-primarySoft text-primary border border-primary/30 shadow-paper-sm'
                : 'text-textSecondary hover:text-textPrimary hover:bg-surface2'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Discover People */}
      {activeTab === 'discover' && (
        <div className="space-y-6">
          {/* Search Bar & Filters Header */}
          <div className="bg-surface p-4 sm:p-5 rounded-2xl border border-border shadow-paper-sm space-y-4">
            {/* Search Input */}
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-textSecondary absolute left-3.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, username, or profession..."
                className="w-full pl-10 pr-10 py-2.5 bg-surface2 border border-border rounded-xl text-xs text-textPrimary placeholder:text-textSecondary focus:outline-none focus:border-primary transition"
              />
              {loadingSearch ? (
                <Loader2 className="w-4 h-4 text-primary animate-spin absolute right-3.5" />
              ) : searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="p-1 text-textSecondary hover:text-textPrimary absolute right-3 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              ) : null}
            </div>

            {/* Filter Controls Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {/* Role Pills */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-bold text-textSecondary mr-1">Role:</span>
                {[
                  { id: 'ALL', label: 'All' },
                  { id: 'LEARNER', label: 'Learner' },
                  { id: 'TRAINER', label: 'Trainer' },
                  { id: 'ADMIN', label: 'Admin' },
                ].map((role) => (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => setRoleFilter(role.id as any)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                      roleFilter === role.id
                        ? 'bg-primary text-primaryContrast font-bold shadow-paper-sm'
                        : 'bg-surface2 text-textSecondary hover:text-textPrimary border border-border'
                    }`}
                  >
                    {role.label}
                  </button>
                ))}
              </div>

              {/* Profession Dropdown */}
              <div className="flex items-center gap-2">
                <label className="text-[11px] font-bold text-textSecondary">Profession:</label>
                <select
                  value={professionFilter}
                  onChange={(e) => setProfessionFilter(e.target.value)}
                  className="px-3 py-1.5 bg-surface2 border border-border rounded-xl text-xs text-textPrimary focus:outline-none focus:border-primary font-semibold"
                >
                  <option value="ALL">All Professions</option>
                  <option value="STUDENT">Student</option>
                  <option value="WORKING_PROFESSIONAL">Working Professional</option>
                  <option value="FREELANCER">Freelancer</option>
                  <option value="JOB_SEEKER">Job Seeker</option>
                  <option value="ENTREPRENEUR">Entrepreneur</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
            </div>
          </div>

          {/* Rate Limit Warning Banner */}
          {rateLimited && (
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center gap-3 text-amber-600 dark:text-amber-400 text-xs font-semibold">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{errorText}</span>
            </div>
          )}

          {/* Generic Error Banner */}
          {errorText && !rateLimited && (
            <div className="p-4 bg-dangerSoft border border-danger/30 rounded-2xl flex items-center justify-between text-danger text-xs font-semibold">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                <span>{errorText}</span>
              </div>
              <button
                type="button"
                onClick={() => setSearchQuery((q) => q + ' ')}
                className="px-3 py-1 bg-surface border border-border text-textPrimary rounded-lg text-xs font-bold hover:bg-surface2"
              >
                Retry
              </button>
            </div>
          )}

          {/* Search Results Grid */}
          {(searchQuery.trim() || roleFilter !== 'ALL' || professionFilter !== 'ALL') ? (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-textPrimary flex items-center justify-between">
                <span>Search Results</span>
                <span className="text-xs font-semibold text-textSecondary">{searchResults.length} matches</span>
              </h3>

              {searchResults.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {searchResults.map((person) => (
                      <div
                        key={person.id}
                        onClick={() => handleCardClick(person.username, person.userId)}
                        className="bg-surface p-5 rounded-2xl border border-border shadow-paper-sm hover:shadow-paper-md transition cursor-pointer flex flex-col justify-between space-y-4 group relative"
                      >
                        <div className="flex items-start gap-3.5">
                          <Avatar user={{ name: person.fullName, avatar: person.avatar }} size="lg" />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h4 className="text-xs font-bold text-textPrimary group-hover:text-primary transition truncate">
                                {person.fullName}
                              </h4>
                              <span className="px-1.5 py-0.2 rounded-full bg-primarySoft text-primary text-[10px] font-extrabold capitalize">
                                {person.role}
                              </span>
                            </div>

                            {person.username && (
                              <span className="text-[11px] text-textSecondary block truncate font-medium">
                                @{person.username}
                              </span>
                            )}

                            <div className="text-[11px] text-textSecondary mt-1 line-clamp-1 font-semibold">
                              {person.jobTitle || person.profession}
                            </div>

                            {person.country && (
                              <span className="text-[10px] text-textSecondary flex items-center gap-1 mt-1 font-medium">
                                <MapPin className="w-3 h-3 text-primary" />
                                {person.city ? `${person.city}, ` : ''}{person.country}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Mutual Connection Badge */}
                        <div className="flex items-center justify-between pt-3 border-t border-border">
                          {person.mutualFollowersCount > 0 ? (
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                              <Sparkles className="w-3 h-3" />
                              {person.mutualFollowersCount} mutual
                            </span>
                          ) : person.followsMe ? (
                            <span className="text-[10px] text-primary font-bold flex items-center gap-1">
                              <UserCheck className="w-3 h-3" />
                              Follows you
                            </span>
                          ) : (
                            <span className="text-[10px] text-textSecondary">Vantage Member</span>
                          )}

                          {/* Follow Button */}
                          <div onClick={(e) => e.stopPropagation()}>
                            <FollowButton
                              targetUserId={person.userId}
                              isFollowedByMe={person.isFollowedByMe}
                              isPending={person.isPending}
                              followsMe={person.followsMe}
                              accountVisibility={person.accountVisibility}
                              size="sm"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Load More Button */}
                  {nextCursor && (
                    <div className="flex items-center justify-center pt-4">
                      <button
                        type="button"
                        onClick={handleLoadMore}
                        disabled={loadingMore}
                        className="px-6 py-2.5 bg-surface2 hover:bg-border/50 text-textPrimary rounded-xl text-xs font-bold transition border border-border flex items-center gap-2"
                      >
                        {loadingMore && <Loader2 className="w-4 h-4 text-primary animate-spin" />}
                        {loadingMore ? 'Loading more...' : 'Load more results'}
                      </button>
                    </div>
                  )}
                </>
              ) : !loadingSearch ? (
                <div className="p-12 text-center bg-surface rounded-2xl border border-border flex flex-col items-center justify-center gap-2">
                  <Users className="w-8 h-8 text-textSecondary opacity-40 mb-1" />
                  <h4 className="text-sm font-bold text-textPrimary">No people found</h4>
                  <p className="text-xs text-textSecondary">
                    No one found matching "<span className="italic">{searchQuery}</span>". Try a different name or @username.
                  </p>
                </div>
              ) : null}
            </div>
          ) : (
            /* Default Suggestions State */
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <h3 className="text-sm font-bold text-textPrimary flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  People You May Know
                </h3>
                <button
                  type="button"
                  onClick={fetchSuggestions}
                  className="text-xs text-primary font-bold hover:underline flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" /> Refresh
                </button>
              </div>

              {loadingSuggestions ? (
                <div className="p-12 text-center flex flex-col items-center justify-center gap-2 text-xs text-textSecondary">
                  <Loader2 className="w-6 h-6 text-primary animate-spin" />
                  Loading suggestions...
                </div>
              ) : suggestions.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {suggestions.map((person) => (
                    <div
                      key={person.id}
                      onClick={() => handleCardClick(person.username, person.userId)}
                      className="bg-surface p-5 rounded-2xl border border-border shadow-paper-sm hover:shadow-paper-md transition cursor-pointer flex flex-col justify-between space-y-4 group relative"
                    >
                      <div className="flex items-start gap-3.5">
                        <Avatar user={{ name: person.fullName, avatar: person.avatar }} size="lg" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="text-xs font-bold text-textPrimary group-hover:text-primary transition truncate">
                              {person.fullName}
                            </h4>
                            <span className="px-1.5 py-0.2 rounded-full bg-primarySoft text-primary text-[10px] font-extrabold capitalize">
                              {person.role}
                            </span>
                          </div>

                          {person.username && (
                            <span className="text-[11px] text-textSecondary block truncate font-medium">
                              @{person.username}
                            </span>
                          )}

                          <div className="text-[11px] text-textSecondary mt-1 line-clamp-1 font-semibold">
                            {person.jobTitle || person.profession}
                          </div>

                          {person.suggestionReason && (
                            <span className="text-[10px] text-primary font-semibold block mt-1">
                              💡 {person.suggestionReason}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Footer Actions */}
                      <div className="flex items-center justify-between pt-3 border-t border-border">
                        {person.mutualFollowersCount > 0 ? (
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            {person.mutualFollowersCount} mutual
                          </span>
                        ) : (
                          <span className="text-[10px] text-textSecondary font-medium">{person.country}</span>
                        )}

                        <div onClick={(e) => e.stopPropagation()}>
                          <FollowButton
                            targetUserId={person.userId}
                            isFollowedByMe={false}
                            isPending={false}
                            followsMe={person.followsMe}
                            accountVisibility={person.accountVisibility}
                            size="sm"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-textSecondary">
                  No suggestions available right now. Try typing a search above!
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Other Tabs: Followers / Following / Requests */}
      {activeTab !== 'discover' && (
        <div className="bg-surface p-6 rounded-2xl border border-border shadow-paper-sm space-y-4">
          <h3 className="text-sm font-bold text-textPrimary capitalize flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            {activeTab} ({tabUsers.length})
          </h3>

          {loadingTab ? (
            <div className="p-8 text-center text-xs text-textSecondary flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 text-primary animate-spin" />
              Loading list...
            </div>
          ) : tabUsers.length > 0 ? (
            <div className="divide-y divide-border">
              {tabUsers.map((item) => {
                const isReq = activeTab === 'requests';
                const targetId = isReq ? item.followerId : item.userId || item.id;
                const name = item.fullName || item.name;
                const username = item.username;

                return (
                  <div key={item.id || item.followId} className="py-3.5 flex items-center justify-between">
                    <div
                      onClick={() => handleCardClick(username, targetId)}
                      className="flex items-center gap-3 cursor-pointer group"
                    >
                      <Avatar user={{ name, avatar: item.avatar }} size="md" />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-textPrimary group-hover:text-primary transition">
                            {name}
                          </span>
                          <span className="px-1.5 py-0.2 bg-primarySoft text-primary text-[10px] font-bold capitalize rounded-full">
                            {item.role || 'learner'}
                          </span>
                        </div>
                        {username && <span className="text-[11px] text-textSecondary font-medium">@{username}</span>}
                      </div>
                    </div>

                    {isReq ? (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={async () => {
                            await api.post(`/api/follow/requests/${item.followId}/accept`);
                            fetchTabData('requests');
                          }}
                          className="px-3 py-1 bg-primary text-primaryContrast text-xs font-bold rounded-xl hover:bg-primaryHover transition shadow-paper-sm"
                        >
                          Accept
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            await api.post(`/api/follow/requests/${item.followId}/decline`);
                            fetchTabData('requests');
                          }}
                          className="px-3 py-1 bg-surface2 text-textSecondary border border-border text-xs font-bold rounded-xl hover:bg-border/50 transition"
                        >
                          Decline
                        </button>
                      </div>
                    ) : (
                      <FollowButton
                        targetUserId={targetId}
                        isFollowedByMe={activeTab === 'following' || item.isFollowedByMe}
                        isPending={false}
                        followsMe={item.followsMe}
                        size="sm"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-textSecondary">
              No members in your {activeTab} list yet.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
