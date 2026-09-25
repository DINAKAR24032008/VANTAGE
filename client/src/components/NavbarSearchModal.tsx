import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Loader2, Users, ArrowRight } from 'lucide-react';
import { Avatar } from './Avatar';
import api from '../services/api';

interface SearchResultItem {
  id: string;
  userId: string;
  username: string | null;
  fullName: string;
  avatar: any;
  role: string;
  profession: string;
  country: string;
}

interface NavbarSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NavbarSearchModal: React.FC<NavbarSearchModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults([]);
      setHasSearched(false);
    }
  }, [isOpen]);

  // Debounced search trigger (300ms)
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      setHasSearched(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const sanitized = query.trim().slice(0, 100).replace(/[^a-zA-Z0-9\s@._-]/g, '');
        const res = await api.get(`/api/people/search?q=${encodeURIComponent(sanitized)}&limit=5`);
        setResults(res.data.items || []);
        setHasSearched(true);
      } catch (err) {
        console.error('Navbar search error:', err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Keyboard shortcut ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Handle click outside modal
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSelectUser = (item: SearchResultItem) => {
    onClose();
    if (item.username) {
      navigate(`/u/${item.username}`);
    } else {
      navigate(`/profile/${item.userId}`);
    }
  };

  const handleViewAll = () => {
    onClose();
    navigate(`/network?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-overlay backdrop-blur-xs flex items-start justify-center pt-16 sm:pt-24 px-4 animate-in fade-in duration-150">
      <div
        ref={modalRef}
        className="w-full max-w-lg bg-surface rounded-2xl border border-border shadow-paper-lg overflow-hidden flex flex-col"
      >
        {/* Search Bar Header */}
        <div className="p-4 border-b border-border flex items-center gap-3 bg-surface2/40">
          <Search className="w-5 h-5 text-primary flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, username, or profession..."
            className="w-full bg-transparent text-sm text-textPrimary placeholder:text-textSecondary focus:outline-none"
          />
          {loading ? (
            <Loader2 className="w-4 h-4 text-primary animate-spin flex-shrink-0" />
          ) : query ? (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="p-1 text-textSecondary hover:text-textPrimary rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          ) : null}
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto divide-y divide-border">
          {loading && results.length === 0 ? (
            <div className="p-6 text-center text-xs text-textSecondary flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 text-primary animate-spin" />
              Searching people...
            </div>
          ) : results.length > 0 ? (
            results.map((item) => (
              <div
                key={item.id}
                onClick={() => handleSelectUser(item)}
                className="p-3.5 flex items-center justify-between hover:bg-surface2 cursor-pointer transition"
              >
                <div className="flex items-center gap-3">
                  <Avatar user={{ name: item.fullName, avatar: item.avatar }} size="sm" />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-textPrimary">{item.fullName}</span>
                      <span className="px-1.5 py-0.2 bg-primarySoft text-primary text-[10px] font-bold capitalize rounded-full">
                        {item.role}
                      </span>
                    </div>
                    <div className="text-[11px] text-textSecondary flex items-center gap-2">
                      {item.username && <span>@{item.username}</span>}
                      <span>•</span>
                      <span>{item.profession || 'Learner'}</span>
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-textSecondary opacity-0 group-hover:opacity-100 transition" />
              </div>
            ))
          ) : hasSearched && query.trim() ? (
            <div className="p-8 text-center flex flex-col items-center justify-center gap-1.5">
              <Users className="w-6 h-6 text-textSecondary opacity-40 mb-1" />
              <p className="text-xs font-bold text-textPrimary">No people found</p>
              <p className="text-[11px] text-textSecondary">
                No matches for "<span className="italic">{query}</span>". Try another name or @username.
              </p>
            </div>
          ) : (
            <div className="p-6 text-center text-xs text-textSecondary">
              Type a name, username, or profession to find learners & instructors.
            </div>
          )}
        </div>

        {/* View All Footer */}
        {query.trim() && (
          <div className="p-3 bg-surface2 border-t border-border flex items-center justify-between">
            <span className="text-[11px] text-textSecondary font-medium">Press Enter or click to view all</span>
            <button
              type="button"
              onClick={handleViewAll}
              className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
            >
              View all results
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
