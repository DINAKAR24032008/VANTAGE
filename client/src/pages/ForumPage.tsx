import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ForumPost, Course } from '../types';
import {
  MessageSquare,
  Send,
  CornerDownRight,
  Plus,
  BookOpen,
  Globe,
  User,
  Clock,
  Sparkles,
  X,
} from 'lucide-react';

export const ForumPage: React.FC = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'general' | string>('all');

  // New Thread Form
  const [showNewThreadModal, setShowNewThreadModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newBody, setNewBody] = useState('');
  const [newCourseId, setNewCourseId] = useState<string>('');
  const [submittingThread, setSubmittingThread] = useState(false);

  // Reply Form State: postId -> reply text
  const [replyTexts, setReplyTexts] = useState<Record<string, string>>({});
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  useEffect(() => {
    loadForumData();
  }, [filter]);

  const loadForumData = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (filter === 'general') params.general = 'true';
      else if (filter !== 'all') params.courseId = filter;

      const [postsRes, coursesRes] = await Promise.all([
        api.get('/forum', { params }),
        api.get('/courses'),
      ]);

      setPosts(postsRes.data);
      setCourses(coursesRes.data);
    } catch (err) {
      console.error('Failed to load forum posts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateThread = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBody.trim()) return;

    try {
      setSubmittingThread(true);
      await api.post('/forum', {
        title: newTitle || 'Discussion',
        body: newBody,
        courseId: newCourseId || null,
      });

      setNewTitle('');
      setNewBody('');
      setNewCourseId('');
      setShowNewThreadModal(false);
      await loadForumData();
    } catch (err) {
      console.error('Error creating thread:', err);
    } finally {
      setSubmittingThread(false);
    }
  };

  const handleSendReply = async (parentPostId: string) => {
    const text = replyTexts[parentPostId];
    if (!text || !text.trim()) return;

    try {
      await api.post('/forum', {
        body: text,
        parentPostId,
      });

      setReplyTexts((prev) => ({ ...prev, [parentPostId]: '' }));
      setReplyingTo(null);
      await loadForumData();
    } catch (err) {
      console.error('Error sending reply:', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-mono text-emerald-600 font-bold uppercase tracking-wider">
              MoES Knowledge Sharing & Colleague Discourse
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
              Scientific & Operational Forum
            </h1>
            <p className="text-xs text-slate-500">
              Cross-institutional discussions between scientists, trainers, and field officers.
            </p>
          </div>

          <button
            onClick={() => setShowNewThreadModal(true)}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/30 transition flex items-center gap-1.5 self-start"
          >
            <Plus className="w-4 h-4" /> Start Discussion Thread
          </button>
        </div>

        {/* Filter Navigation */}
        <div className="flex flex-wrap items-center gap-2 bg-white p-2.5 rounded-2xl border border-slate-200/90 shadow-sm text-xs font-semibold">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-xl transition ${
              filter === 'all' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            All Threads
          </button>
          <button
            onClick={() => setFilter('general')}
            className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1 ${
              filter === 'general' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Globe className="w-3.5 h-3.5" /> General Science & Open Data
          </button>

          <select
            value={filter.startsWith('all') || filter.startsWith('general') ? '' : filter}
            onChange={(e) => setFilter(e.target.value || 'all')}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 ml-auto"
          >
            <option value="">Filter by Specific Course...</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
        </div>

        {/* Threads List */}
        {loading ? (
          <div className="py-16 text-center text-xs text-slate-400">Loading discussions...</div>
        ) : posts.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-xs text-slate-500">
            No discussion threads found in this category. Be the first to start a conversation!
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <div key={post.id} className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-4">
                {/* Thread Header */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    {post.course ? (
                      <span className="text-[10px] font-mono font-bold uppercase bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">
                        Course: {post.course.title}
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono font-bold uppercase bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200">
                        General Discourse
                      </span>
                    )}
                    <h3 className="text-base font-bold text-slate-900 mt-1.5">{post.title || 'Discussion'}</h3>
                  </div>

                  <div className="text-right text-[11px] text-slate-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Author Info */}
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-slate-800 text-white flex items-center justify-center text-[10px] font-bold">
                    {post.author?.name?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-800">{post.author?.name}</span>
                    <span className="text-[10px] text-slate-400 ml-1.5 font-mono">
                      ({post.author?.role} • {post.author?.department?.split(' ')[0]})
                    </span>
                  </div>
                </div>

                {/* Post Body */}
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {post.body}
                </p>

                {/* Nested Replies Section */}
                <div className="pt-3 border-t border-slate-100 space-y-3">
                  {post.replies && post.replies.length > 0 && (
                    <div className="space-y-2.5 pl-4 border-l-2 border-emerald-500/40 my-3">
                      {post.replies.map((reply) => (
                        <div key={reply.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                          <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                            <span className="font-bold text-slate-700">
                              {reply.author?.name} ({reply.author?.role})
                            </span>
                            <span>{new Date(reply.createdAt).toLocaleDateString()}</span>
                          </div>
                          <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{reply.body}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Reply Action Form */}
                  <div className="pt-1">
                    {replyingTo === post.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={replyTexts[post.id] || ''}
                          onChange={(e) =>
                            setReplyTexts({ ...replyTexts, [post.id]: e.target.value })
                          }
                          placeholder="Write a constructive response..."
                          className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSendReply(post.id);
                          }}
                        />
                        <button
                          onClick={() => handleSendReply(post.id)}
                          className="p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition"
                          title="Send Reply"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setReplyingTo(null)}
                          className="p-2 text-slate-400 hover:text-slate-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setReplyingTo(post.id)}
                        className="text-xs font-bold text-slate-600 hover:text-emerald-600 flex items-center gap-1.5 transition"
                      >
                        <CornerDownRight className="w-3.5 h-3.5 text-emerald-600" />
                        Reply to Thread ({post.replies?.length || 0} replies)
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* New Thread Modal */}
      {showNewThreadModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
              <h3 className="text-base font-bold text-white">Start New Knowledge Thread</h3>
              <button
                onClick={() => setShowNewThreadModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateThread} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Thread Subject / Question</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Guidance on high-resolution radar clutter mitigation filters"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Scope Category</label>
                <select
                  value={newCourseId}
                  onChange={(e) => setNewCourseId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">General Knowledge Sharing (MoES-wide)</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>Course: {c.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Post Content</label>
                <textarea
                  required
                  rows={4}
                  value={newBody}
                  onChange={(e) => setNewBody(e.target.value)}
                  placeholder="Elaborate on the scientific problem, code snippet, or operational observation..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewThreadModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingThread}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow transition disabled:opacity-50"
                >
                  {submittingThread ? 'Posting...' : 'Publish Thread'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
