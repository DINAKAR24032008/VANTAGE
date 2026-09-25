import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, BookOpen, Clock, UserCheck, ShieldAlert, CheckCheck, X } from 'lucide-react';
import { AppNotification } from '../types';
import api from '../services/api';

export const NotificationBell: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [toast, setToast] = useState<AppNotification | null>(null);
  const previousCountRef = useRef<number>(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications?limit=15');
      const newItems: AppNotification[] = res.data.items || [];
      const newUnread: number = res.data.unreadCount || 0;

      // Show toast if unread count increased
      if (newUnread > previousCountRef.current && previousCountRef.current >= 0 && newItems.length > 0) {
        const latestUnread = newItems.find((n) => !n.readAt) || newItems[0];
        setToast(latestUnread);
      }

      previousCountRef.current = newUnread;
      setNotifications(newItems);
      setUnreadCount(newUnread);
    } catch (err) {
      // Silent error polling
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Poll every 60 seconds
    const interval = setInterval(fetchNotifications, 60000);

    // Refresh on window focus
    const onFocus = () => fetchNotifications();
    window.addEventListener('focus', onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto hide toast after 5 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleNotificationClick = async (notif: AppNotification) => {
    try {
      if (!notif.readAt) {
        await api.patch(`/notifications/${notif.id}/read`);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, readAt: new Date().toISOString() } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Failed to mark read', err);
    }

    setIsOpen(false);
    if (notif.actionUrl) {
      navigate(notif.actionUrl);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, readAt: new Date().toISOString() })));
      setUnreadCount(0);
      previousCountRef.current = 0;
    } catch (err) {
      console.error('Failed to mark all as read', err);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'ENROLLMENT':
        return <BookOpen className="w-4 h-4 text-primary" />;
      case 'DAILY_REMINDER':
        return <Clock className="w-4 h-4 text-amber-500" />;
      case 'NEW_FOLLOWER':
      case 'FOLLOW_REQUEST':
      case 'FOLLOW_ACCEPTED':
        return <UserCheck className="w-4 h-4 text-emerald-500" />;
      default:
        return <ShieldAlert className="w-4 h-4 text-accent" />;
    }
  };

  const formatRelativeTime = (dateStr: string) => {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Icon */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchNotifications();
        }}
        className="relative p-2 text-textSecondary hover:text-textPrimary hover:bg-surface2 rounded-xl border border-border transition flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-primary/40"
        aria-label="Notifications"
        title="Notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-danger text-white text-[10px] font-extrabold rounded-full flex items-center justify-center shadow-paper-sm animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Floating Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 max-w-sm p-4 bg-surface rounded-2xl border border-primary/40 shadow-paper-lg flex items-start gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="p-2 rounded-xl bg-primarySoft border border-primary/30 flex-shrink-0">
            {getTypeIcon(toast.type)}
          </div>
          <div className="flex-1 min-w-0 cursor-pointer" onClick={() => handleNotificationClick(toast)}>
            <div className="text-xs font-bold text-textPrimary leading-tight mb-0.5">{toast.title}</div>
            <div className="text-[11px] text-textSecondary line-clamp-2">{toast.message}</div>
          </div>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="p-1 text-textSecondary hover:text-textPrimary rounded-lg"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-surface rounded-2xl border border-border shadow-paper-lg z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="p-4 border-b border-border flex items-center justify-between bg-surface2/50">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-textPrimary flex items-center gap-1.5">
                Notifications
              </h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-primarySoft text-primary text-[10px] font-extrabold">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1"
              >
                <CheckCheck className="w-3.5 h-3.5" /> Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-border">
            {notifications.length > 0 ? (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-3.5 transition flex items-start gap-3 hover:bg-surface2 ${
                    !notif.readAt ? 'bg-primarySoft/20' : ''
                  } ${notif.type !== 'FOLLOW_REQUEST' ? 'cursor-pointer' : ''}`}
                  onClick={notif.type !== 'FOLLOW_REQUEST' ? () => handleNotificationClick(notif) : undefined}
                >
                  <div className="p-2 rounded-xl bg-surface border border-border flex-shrink-0 mt-0.5">
                    {getTypeIcon(notif.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1 mb-0.5">
                      <h4 className={`text-xs ${!notif.readAt ? 'font-bold text-textPrimary' : 'font-semibold text-textSecondary'}`}>
                        {notif.title}
                      </h4>
                      <span className="text-[10px] text-textSecondary flex-shrink-0">
                        {formatRelativeTime(notif.createdAt)}
                      </span>
                    </div>

                    <p className="text-[11px] text-textSecondary leading-snug line-clamp-2 mb-1">
                      {notif.message}
                    </p>

                    {/* Inline Accept / Decline for follow requests */}
                    {notif.type === 'FOLLOW_REQUEST' && !notif.readAt && notif.actionUrl && (
                      <div className="flex items-center gap-2 mt-1.5">
                        <button
                          type="button"
                          onClick={async (e) => {
                            e.stopPropagation();
                            try {
                              // actionUrl holds the followerId, e.g. "/follow/requests/<followId>/accept"
                              const followId = notif.actionUrl!.split('/').pop();
                              await api.post(`/api/follow/requests/${followId}/accept`);
                              await api.patch(`/api/notifications/${notif.id}/read`);
                              fetchNotifications();
                            } catch (err) { console.error(err); }
                          }}
                          className="px-2.5 py-1 bg-primary text-primaryContrast text-[10px] font-bold rounded-lg hover:bg-primaryHover transition"
                        >
                          Accept
                        </button>
                        <button
                          type="button"
                          onClick={async (e) => {
                            e.stopPropagation();
                            try {
                              const followId = notif.actionUrl!.split('/').pop();
                              await api.post(`/api/follow/requests/${followId}/decline`);
                              await api.patch(`/api/notifications/${notif.id}/read`);
                              fetchNotifications();
                            } catch (err) { console.error(err); }
                          }}
                          className="px-2.5 py-1 bg-surface2 text-textSecondary text-[10px] font-bold rounded-lg border border-border hover:bg-border/50 transition"
                        >
                          Decline
                        </button>
                      </div>
                    )}
                  </div>

                  {!notif.readAt && (
                    <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                  )}
                </div>
              ))
            ) : (
              <div className="p-8 text-center flex flex-col items-center justify-center gap-2">
                <div className="w-10 h-10 rounded-full bg-surface2 border border-border flex items-center justify-center text-textSecondary">
                  <Bell className="w-5 h-5 opacity-40" />
                </div>
                <p className="text-xs font-semibold text-textPrimary">You're all caught up!</p>
                <p className="text-[11px] text-textSecondary">No new notifications right now.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
