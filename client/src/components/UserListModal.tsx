import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X, Search, UserMinus } from 'lucide-react';
import { Avatar } from './Avatar';
import { FollowButton } from './FollowButton';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

interface UserListItem {
  id: string;
  username: string;
  fullName: string;
  avatar?: any;
  role: string;
  profession?: string;
  isFollowedByMe?: boolean;
  followsMe?: boolean;
}

interface UserListModalProps {
  username: string;
  initialTab?: 'followers' | 'following';
  isOwner?: boolean;
  onClose: () => void;
}

export const UserListModal: React.FC<UserListModalProps> = ({
  username,
  initialTab = 'followers',
  isOwner = false,
  onClose,
}) => {
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'followers' | 'following'>(initialTab);
  const [items, setItems] = useState<UserListItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchUserList = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/api/u/${username}/${activeTab}`);
      setItems(res.data.items || []);
    } catch (err) {
      console.error(`Failed to fetch ${activeTab}:`, err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserList();
  }, [username, activeTab]);

  const handleRemoveFollower = async (followerUserId: string) => {
    try {
      await api.delete(`/api/followers/${followerUserId}`);
      setItems((prev) => prev.filter((u) => u.id !== followerUserId));
    } catch (err) {
      console.error('Failed to remove follower:', err);
    }
  };

  const filteredItems = items.filter(
    (item) =>
      item.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.profession && item.profession.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-overlay backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-surface w-full max-w-md rounded-2xl border border-border shadow-paper-lg overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header Tabs & Close Button */}
        <div className="p-4 border-b border-border flex items-center justify-between bg-surface2/50">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('followers')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                activeTab === 'followers'
                  ? 'bg-primary text-primaryContrast shadow-paper-sm'
                  : 'text-textSecondary hover:text-textPrimary hover:bg-surface'
              }`}
            >
              Followers
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('following')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                activeTab === 'following'
                  ? 'bg-primary text-primaryContrast shadow-paper-sm'
                  : 'text-textSecondary hover:text-textPrimary hover:bg-surface'
              }`}
            >
              Following
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 text-textSecondary hover:text-textPrimary rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-3 border-b border-border bg-surface">
          <div className="relative">
            <Search className="w-4 h-4 text-textSecondary absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder={`Search ${activeTab}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-surface2 border border-border rounded-xl text-xs text-textPrimary focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        {/* User List Body */}
        <div className="flex-1 overflow-y-auto divide-y divide-border p-2">
          {loading ? (
            <div className="p-8 text-center">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : filteredItems.length > 0 ? (
            filteredItems.map((item) => {
              const isSelf = currentUser?.id === item.id;
              return (
                <div key={item.id} className="p-3 flex items-center justify-between gap-3 hover:bg-surface2/50 rounded-xl transition">
                  <Link
                    to={`/u/${item.username}`}
                    onClick={onClose}
                    className="flex items-center gap-3 flex-1 min-w-0 group"
                  >
                    <Avatar user={{ name: item.fullName, avatar: item.avatar, role: item.role }} size="md" />
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-textPrimary group-hover:text-primary transition truncate">
                        {item.fullName}
                      </div>
                      <div className="text-[11px] text-textSecondary truncate">
                        @{item.username} • <span className="capitalize">{item.role}</span>
                      </div>
                    </div>
                  </Link>

                  {/* Right Action: Follow Button or Remove button */}
                  {!isSelf && (
                    <div className="flex items-center gap-2 shrink-0">
                      <FollowButton
                        targetUserId={item.id}
                        isFollowedByMe={item.isFollowedByMe}
                        followsMe={item.followsMe}
                        size="sm"
                      />

                      {/* Owner remove follower option */}
                      {isOwner && activeTab === 'followers' && (
                        <button
                          type="button"
                          onClick={() => handleRemoveFollower(item.id)}
                          className="px-2 py-1 text-[11px] font-semibold text-danger hover:bg-dangerSoft rounded-lg transition border border-transparent"
                          title="Remove from your followers"
                        >
                          <UserMinus className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center text-xs text-textSecondary italic">
              No {activeTab} found matching your query.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
