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
  Pin,
  Trash2,
  Edit3,
  Check,
} from 'lucide-react';
import { HeadingEmoji } from '../components/HeadingEmoji';
import { Avatar } from '../components/Avatar';

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

  // Edit Form State
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState<string>('');
  const [savingEdit, setSavingEdit] = useState(false);

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
    try {
      setSubmittingThread(true);
      await api.post('/forum/posts', {
        title: newTitle,
        body: newBody,
        courseId: newCourseId || null,
      });

      setNewTitle('');
      setNewBody('');
      setNewCourseId('');
      setShowNewThreadModal(false);
      await loadForumData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to create discussion thread');
    } finally {
      setSubmittingThread(false);
    }
  };

  const handleSendReply = async (postId: string) => {
    const text = replyTexts[postId];
    if (!text || !text.trim()) return;

    try {
      await api.post(`/forum/posts/${postId}/replies`, { body: text });
      setReplyTexts({ ...replyTexts, [postId]: '' });
      setReplyingTo(null);
      await loadForumData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to send reply');
    }
  };

  const handleTogglePin = async (postId: string) => {
    try {
      await api.patch(`/forum/posts/${postId}/pin`);
      await loadForumData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to toggle pin');
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!window.confirm('Are you sure you want to delete this post/reply?')) return;
    try {
      await api.delete(`/forum/posts/${postId}`);
      await loadForumData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete post');
    }
  };

  const handleSaveEdit = async (postId: string) => {
    if (!editingText.trim()) return;
    try {
      setSavingEdit(true);
      await api.put(`/forum/posts/${postId}`, { body: editingText });
      setEditingPostId(null);
      setEditingText('');
      await loadForumData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update post');
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-textPrimary py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] text-accent font-bold uppercase tracking-wider">
              <HeadingEmoji emoji="💬" />Community Knowledge Sharing &amp; Discussions
            </span>
            <h1 className="text-3xl sm:text-4xl font-bold text-textPrimary mt-1 tracking-tight">
              <HeadingEmoji emoji="💬" />Discussion Forum
            </h1>
            <p className="text-xs text-textSecondary">
              Collaborative discussions, questions, and insights between learners and instructors.
            </p>
          </div>

          <button
            onClick={() => setShowNewThreadModal(true)}
            className="px-4 py-2.5 bg-primary hover:bg-primaryHover text-primaryContrast rounded-xl text-xs font-bold shadow-paper-sm transition flex items-center gap-1.5 self-start"
          >
            <Plus className="w-4 h-4" /> Start Discussion Thread
          </button>
        </div>

        {/* Filter Navigation */}
        <div className="flex flex-wrap items-center gap-2 bg-surface p-2.5 rounded-2xl border border-border shadow-paper-sm text-xs font-semibold">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-xl transition ${
              filter === 'all' ? 'bg-primary text-primaryContrast font-bold' : 'text-textSecondary hover:bg-surface2 hover:text-textPrimary'
            }`}
          >
            All Threads
          </button>
          <button
            onClick={() => setFilter('general')}
            className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1 ${
              filter === 'general' ? 'bg-primary text-primaryContrast font-bold' : 'text-textSecondary hover:bg-surface2 hover:text-textPrimary'
            }`}
          >
            <Globe className="w-3.5 h-3.5" /> General Discussions
          </button>

          <select
            value={filter.startsWith('all') || filter.startsWith('general') ? '' : filter}
            onChange={(e) => setFilter(e.target.value || 'all')}
            className="px-3 py-1.5 bg-surface2 border border-border rounded-xl text-xs font-medium text-textPrimary ml-auto focus:border-primary focus:outline-none"
          >
            <option value="">Filter by Specific Course...</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
        </div>

        {/* Threads List */}
        {loading ? (
          <div className="py-16 text-center text-xs text-textSecondary">Loading discussions...</div>
        ) : posts.length === 0 ? (
          <div className="p-12 text-center bg-surface rounded-2xl border border-border text-xs text-textSecondary">
            No discussion threads found in this category. Be the first to start a conversation!
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => {
              const isCourseInstructor = Boolean(
                post.course?.trainerId &&
                (post.course.trainerId === post.author?.id || post.course.trainerId === post.authorId)
              );
              const canPin = Boolean(post.courseId && (user?.role === 'admin' || post.course?.trainerId === user?.id));
              const canModerateThread = Boolean(
                user?.role === 'admin' ||
                post.author?.id === user?.id ||
                post.authorId === user?.id ||
                (post.course?.trainerId && post.course.trainerId === user?.id)
              );

              return (
                <div
                  key={post.id}
                  className={`bg-surface rounded-2xl border shadow-paper-sm p-6 space-y-4 transition ${
                    post.isPinned ? 'border-primary bg-primarySoft/30' : 'border-border'
                  }`}
                >
                  {/* Thread Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {post.isPinned && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase bg-primary text-white px-2 py-0.5 rounded shadow-paper-sm">
                            <Pin className="w-3 h-3 fill-current" /> Pinned Thread
                          </span>
                        )}
                        {post.course ? (
                          <span className="text-[10px] font-bold uppercase bg-primarySoft text-primary px-2 py-0.5 rounded border border-primary/30">
                            Course: {post.course.title}
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold uppercase bg-accentSoft text-accent px-2 py-0.5 rounded border border-accent/30">
                            General Discourse
                          </span>
                        )}
                      </div>
                      <h2 className="text-base font-bold text-textPrimary leading-snug">
                        {post.title || 'Discussion Thread'}
                      </h2>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {canPin && (
                        <button
                          onClick={() => handleTogglePin(post.id)}
                          title={post.isPinned ? 'Unpin thread' : 'Pin thread to top'}
                          className={`p-1.5 rounded-lg border text-xs transition flex items-center gap-1 ${
                            post.isPinned
                              ? 'bg-primarySoft border-primary text-primary font-bold'
                              : 'bg-surface2 border-border text-textSecondary hover:text-primary hover:border-primary'
                          }`}
                        >
                          <Pin className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline text-[10px] font-bold">
                            {post.isPinned ? 'Unpin' : 'Pin'}
                          </span>
                        </button>
                      )}
                      {canModerateThread && (
                        <>
                          <button
                            onClick={() => {
                              setEditingPostId(post.id);
                              setEditingText(post.body);
                            }}
                            title="Edit Post"
                            className="p-1.5 bg-surface2 border border-border rounded-lg text-xs text-textSecondary hover:text-primary hover:border-primary transition"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeletePost(post.id)}
                            title="Delete Post"
                            className="p-1.5 bg-surface2 border border-border rounded-lg text-xs text-textSecondary hover:text-danger hover:border-danger transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                      <div className="text-right text-[11px] text-textSecondary flex items-center gap-1 ml-2 font-medium">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Author Info */}
                  <div className="flex items-center gap-2">
                    <Avatar
                      user={{ id: post.author?.id || '', name: post.author?.name || 'U', role: (post.author?.role as any) || 'learner' }}
                      size="sm"
                    />
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-textPrimary">{post.author?.name}</span>
                      {isCourseInstructor ? (
                        <span className="text-[9px] font-bold uppercase bg-accent text-white px-1.5 py-0.5 rounded shadow-paper-sm">
                          Instructor
                        </span>
                      ) : (
                        <span className="text-[10px] text-textSecondary capitalize">
                          ({post.author?.role})
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Post Body / Edit Form */}
                  {editingPostId === post.id ? (
                    <div className="space-y-2">
                      <textarea
                        rows={4}
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        className="w-full p-2.5 bg-surface2 border border-primary rounded-xl text-xs text-textPrimary focus:outline-none"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setEditingPostId(null)}
                          className="px-3 py-1 bg-surface2 border border-border rounded-lg text-xs text-textSecondary hover:text-textPrimary"
                        >
                          Cancel
                        </button>
                        <button
                          disabled={savingEdit}
                          onClick={() => handleSaveEdit(post.id)}
                          className="px-3 py-1 bg-primary text-white rounded-lg text-xs font-bold hover:bg-primaryHover flex items-center gap-1"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs sm:text-sm text-textPrimary leading-relaxed whitespace-pre-wrap border-t border-border/60 pt-3">
                      {post.body}
                    </p>
                  )}

                  {/* Replies List */}
                  <div className="border-t border-border pt-3 space-y-3">
                    {post.replies && post.replies.length > 0 && (
                      <div className="space-y-2.5 pl-4 border-l-2 border-primary/40 my-3">
                        {post.replies.map((reply) => {
                          const isReplyInstructor = Boolean(
                            post.course?.trainerId &&
                            (post.course.trainerId === reply.author?.id || post.course.trainerId === reply.authorId)
                          );
                          const canModerateReply = Boolean(
                            user?.role === 'admin' ||
                            reply.author?.id === user?.id ||
                            reply.authorId === user?.id ||
                            (post.course?.trainerId && post.course.trainerId === user?.id)
                          );

                          return (
                            <div key={reply.id} className="p-3 bg-surface2 rounded-xl border border-border text-xs space-y-1.5">
                              <div className="flex items-center justify-between text-[10px] text-textSecondary">
                                <div className="flex items-center gap-1.5">
                                  <Avatar
                                    user={{ id: reply.author?.id || '', name: reply.author?.name || 'U', role: (reply.author?.role as any) || 'learner' }}
                                    size="sm"
                                  />
                                  <span className="font-bold text-textPrimary">{reply.author?.name}</span>
                                  {isReplyInstructor ? (
                                    <span className="text-[9px] font-bold uppercase bg-accent text-white px-1.5 py-0.2 rounded">
                                      Instructor
                                    </span>
                                  ) : (
                                    <span>({reply.author?.role})</span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <span>{new Date(reply.createdAt).toLocaleDateString()}</span>
                                  {canModerateReply && (
                                    <div className="flex items-center gap-1">
                                      <button
                                        onClick={() => {
                                          setEditingPostId(reply.id);
                                          setEditingText(reply.body);
                                        }}
                                        title="Edit reply"
                                        className="text-textSecondary hover:text-primary"
                                      >
                                        <Edit3 className="w-3 h-3" />
                                      </button>
                                      <button
                                        onClick={() => handleDeletePost(reply.id)}
                                        title="Delete reply"
                                        className="text-textSecondary hover:text-danger"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {editingPostId === reply.id ? (
                                <div className="space-y-2 pt-1">
                                  <textarea
                                    rows={2}
                                    value={editingText}
                                    onChange={(e) => setEditingText(e.target.value)}
                                    className="w-full p-2 bg-surface border border-primary rounded-lg text-xs text-textPrimary focus:outline-none"
                                  />
                                  <div className="flex justify-end gap-1.5">
                                    <button
                                      onClick={() => setEditingPostId(null)}
                                      className="px-2 py-0.5 bg-surface border border-border rounded text-[11px] text-textSecondary hover:text-textPrimary"
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      disabled={savingEdit}
                                      onClick={() => handleSaveEdit(reply.id)}
                                      className="px-2 py-0.5 bg-primary text-white rounded text-[11px] font-bold hover:bg-primaryHover"
                                    >
                                      Save
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <p className="text-textPrimary leading-relaxed whitespace-pre-wrap">{reply.body}</p>
                              )}
                            </div>
                          );
                        })}
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
                            className="flex-1 p-2 bg-surface2 border border-border rounded-xl text-xs text-textPrimary placeholder-textSecondary focus:outline-none focus:border-primary"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSendReply(post.id);
                            }}
                          />
                          <button
                            onClick={() => handleSendReply(post.id)}
                            className="p-2 bg-primary hover:bg-primaryHover text-primaryContrast rounded-xl transition"
                            title="Send Reply"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setReplyingTo(null)}
                            className="p-2 text-textSecondary hover:text-textPrimary transition"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setReplyingTo(post.id)}
                          className="text-xs font-bold text-textSecondary hover:text-primary flex items-center gap-1.5 transition"
                        >
                          <CornerDownRight className="w-3.5 h-3.5 text-primary" />
                          Reply to Thread ({post.replies?.length || 0} replies)
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* New Thread Modal */}
      {showNewThreadModal && (
        <div className="fixed inset-0 z-50 bg-textPrimary/45 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-surface rounded-2xl shadow-paper-lg max-w-xl w-full border border-border overflow-hidden">
            <div className="bg-surface2 text-textPrimary p-5 flex items-center justify-between border-b border-border">
              <h3 className="text-base font-bold text-textPrimary">Start New Knowledge Thread</h3>
              <button
                onClick={() => setShowNewThreadModal(false)}
                className="p-1 text-textSecondary hover:text-textPrimary rounded-lg hover:bg-border/50 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateThread} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-textSecondary mb-1">Thread Subject / Question</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Tips for mastering Python list comprehensions and generators"
                  className="w-full p-2.5 bg-surface2 border border-border rounded-xl text-xs text-textPrimary placeholder-textSecondary focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-textSecondary mb-1">Scope Category</label>
                <select
                  value={newCourseId}
                  onChange={(e) => setNewCourseId(e.target.value)}
                  className="w-full p-2.5 bg-surface2 border border-border rounded-xl text-xs font-medium text-textPrimary focus:outline-none focus:border-primary"
                >
                  <option value="">General Discussion (Platform-wide)</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>Course: {c.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-textSecondary mb-1">Post Content</label>
                <textarea
                  required
                  rows={4}
                  value={newBody}
                  onChange={(e) => setNewBody(e.target.value)}
                  placeholder="Elaborate on your question, share code snippets, or start a discussion..."
                  className="w-full p-2.5 bg-surface2 border border-border rounded-xl text-xs text-textPrimary placeholder-textSecondary focus:outline-none focus:border-primary"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewThreadModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-textSecondary hover:text-textPrimary hover:bg-surface2 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingThread}
                  className="px-5 py-2.5 bg-primary hover:bg-primaryHover text-primaryContrast rounded-xl text-xs font-bold shadow-paper-sm transition disabled:opacity-50"
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
