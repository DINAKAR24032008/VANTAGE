import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { HeadingEmoji } from '../components/HeadingEmoji';
import { Avatar } from '../components/Avatar';
import {
  Course,
  CourseModule,
  Competency,
  LearnerRosterItem,
  CourseInsightsResponse,
  AssessmentQuestion,
} from '../types';
import {
  Plus,
  BookOpen,
  Trash2,
  Edit3,
  Users,
  BarChart2,
  ArrowUpDown,
  CheckCircle2,
  AlertTriangle,
  Download,
  HelpCircle,
  Eye,
  EyeOff,
  ChevronUp,
  ChevronDown,
  Save,
  X,
  Sparkles,
  Award,
  Clock,
  Video,
  FileCheck,
} from 'lucide-react';

export const TrainerManagePage: React.FC = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [competencies, setCompetencies] = useState<Competency[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'courses' | 'learners' | 'insights'>('courses');

  // Selected course for Learners / Insights tab
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');

  // Course Creation Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newDifficulty, setNewDifficulty] = useState('Beginner');
  const [newStatus, setNewStatus] = useState<'draft' | 'published'>('draft');
  const [newThumbnailUrl, setNewThumbnailUrl] = useState('');
  const [selectedCompetencyId, setSelectedCompetencyId] = useState('');
  const [savingCourse, setSavingCourse] = useState(false);

  // Curriculum & Module Editor Modal State
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editDifficulty, setEditDifficulty] = useState('Beginner');
  const [editStatus, setEditStatus] = useState<'draft' | 'published'>('draft');
  const [editModules, setEditModules] = useState<CourseModule[]>([]);
  const [savingCurriculum, setSavingCurriculum] = useState(false);

  // Single Module Edit Modal
  const [editingModule, setEditingModule] = useState<CourseModule | null>(null);
  const [moduleTitle, setModuleTitle] = useState('');
  const [moduleVideoUrl, setModuleVideoUrl] = useState('');
  const [moduleDuration, setModuleDuration] = useState(15);
  const [moduleMarkdown, setModuleMarkdown] = useState('');

  // 5-Question MCQ Assessment Builder Modal
  const [quizModule, setQuizModule] = useState<CourseModule | null>(null);
  const [quizQuestions, setQuizQuestions] = useState<AssessmentQuestion[]>([]);
  const [quizPassThreshold, setQuizPassThreshold] = useState(70);
  const [loadingQuiz, setLoadingQuiz] = useState(false);
  const [savingQuiz, setSavingQuiz] = useState(false);

  // Learners Roster State
  const [roster, setRoster] = useState<LearnerRosterItem[]>([]);
  const [loadingRoster, setLoadingRoster] = useState(false);

  // Quiz Quality Insights State
  const [insights, setInsights] = useState<CourseInsightsResponse | null>(null);
  const [loadingInsights, setLoadingInsights] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [coursesRes, compsRes] = await Promise.all([
        api.get('/courses?myCourses=true'),
        api.get('/competencies'),
      ]);
      setCourses(coursesRes.data);
      setCompetencies(compsRes.data);
      if (coursesRes.data.length > 0) {
        setSelectedCourseId(coursesRes.data[0].id);
      }
      if (compsRes.data.length > 0) {
        setSelectedCompetencyId(compsRes.data[0].id);
      }
    } catch (err) {
      console.error('Failed to load courses:', err);
    } finally {
      setLoading(false);
    }
  };

  // Roster Filter State
  const [rosterSearch, setRosterSearch] = useState('');
  const [rosterProfession, setRosterProfession] = useState('ALL');

  const handleAdminCsvExport = (includePii: boolean = false) => {
    const token = localStorage.getItem('token');
    const url = `${api.defaults.baseURL || '/api'}/users/export-csv?includePii=${includePii}&token=${token}`;
    window.open(url, '_blank');
  };

  // Load Learners whenever selectedCourseId or activeTab === 'learners' changes
  useEffect(() => {
    if (activeTab === 'learners' && selectedCourseId) {
      loadRoster(selectedCourseId);
    } else if (activeTab === 'insights' && selectedCourseId) {
      loadInsights(selectedCourseId);
    }
  }, [activeTab, selectedCourseId]);

  const loadRoster = async (courseId: string) => {
    try {
      setLoadingRoster(true);
      const res = await api.get(`/courses/${courseId}/learners`);
      setRoster(res.data.learners || []);
    } catch (err) {
      console.error('Failed to load roster:', err);
    } finally {
      setLoadingRoster(false);
    }
  };

  const loadInsights = async (courseId: string) => {
    try {
      setLoadingInsights(true);
      const res = await api.get(`/assessments/course/${courseId}/insights`);
      setInsights(res.data);
    } catch (err) {
      console.error('Failed to load quiz insights:', err);
    } finally {
      setLoadingInsights(false);
    }
  };

  // Toggle Course Draft / Published Status
  const handleToggleStatus = async (course: Course) => {
    const nextStatus = course.status === 'published' ? 'draft' : 'published';
    try {
      await api.patch(`/courses/${course.id}/status`, { status: nextStatus });
      setCourses(
        courses.map((c) => (c.id === course.id ? { ...c, status: nextStatus } : c))
      );
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update course status');
    }
  };

  // Create Course
  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingCourse(true);
      const payload: any = {
        title: newTitle,
        description: newDescription,
        difficultyLevel: newDifficulty,
        status: newStatus,
        thumbnailUrl:
          newThumbnailUrl ||
          'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?auto=format&fit=crop&w=600&q=80',
        modules: [
          {
            id: 'mod-1',
            title: 'Module 1: Orientation & Basics',
            durationMinutes: 30,
            videoUrl: '',
            contentMarkdown: 'Welcome to this course!',
            order: 1,
          },
        ],
      };
      if (selectedCompetencyId) {
        payload.competencyTags = [{ competencyId: selectedCompetencyId, targetLevel: 3 }];
      }

      const res = await api.post('/courses', payload);
      setCourses([res.data, ...courses]);
      setIsCreateModalOpen(false);
      setNewTitle('');
      setNewDescription('');
      setNewStatus('draft');
      alert(`Course created in ${newStatus.toUpperCase()} mode.`);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to create course');
    } finally {
      setSavingCourse(false);
    }
  };

  // Delete Course
  const handleDeleteCourse = async (courseId: string) => {
    if (!window.confirm('Are you sure you want to delete this course and all its modules?')) return;
    try {
      await api.delete(`/courses/${courseId}`);
      setCourses(courses.filter((c) => c.id !== courseId));
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete course');
    }
  };

  // Open Course & Curriculum Editor
  const openCurriculumEditor = (course: Course) => {
    setEditingCourse(course);
    setEditTitle(course.title);
    setEditDescription(course.description);
    setEditDifficulty(course.difficultyLevel);
    setEditStatus(course.status);
    setEditModules(course.modules ? [...course.modules] : []);
  };

  // Save Curriculum Changes
  const handleSaveCurriculum = async () => {
    if (!editingCourse) return;
    try {
      setSavingCurriculum(true);
      const res = await api.put(`/courses/${editingCourse.id}`, {
        title: editTitle,
        description: editDescription,
        difficultyLevel: editDifficulty,
        status: editStatus,
        modules: editModules,
      });
      setCourses(
        courses.map((c) => (c.id === editingCourse.id ? res.data.course : c))
      );
      setEditingCourse(null);
      alert('Course curriculum successfully saved!');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to save curriculum');
    } finally {
      setSavingCurriculum(false);
    }
  };

  // Reorder Modules
  const moveModule = (index: number, direction: 'up' | 'down') => {
    const updated = [...editModules];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= updated.length) return;
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    // Re-index order
    updated.forEach((m, idx) => {
      m.order = idx + 1;
    });
    setEditModules(updated);
  };

  // Add Module
  const handleAddNewModule = () => {
    const nextOrder = editModules.length + 1;
    const newMod: CourseModule = {
      id: `mod-${Date.now()}`,
      title: `Module ${nextOrder}: New Lesson`,
      durationMinutes: 20,
      videoUrl: '',
      contentMarkdown: '',
      order: nextOrder,
    };
    setEditModules([...editModules, newMod]);
  };

  // Delete Module
  const handleDeleteModule = (modId: string) => {
    if (!window.confirm('Delete this module?')) return;
    const updated = editModules.filter((m) => m.id !== modId);
    updated.forEach((m, idx) => {
      m.order = idx + 1;
    });
    setEditModules(updated);
  };

  // Open Edit Module Modal
  const openModuleEditor = (mod: CourseModule) => {
    setEditingModule(mod);
    setModuleTitle(mod.title);
    setModuleVideoUrl(mod.videoUrl || '');
    setModuleDuration(mod.durationMinutes || 15);
    setModuleMarkdown(mod.contentMarkdown || '');
  };

  // Save Single Module
  const handleSaveSingleModule = () => {
    if (!editingModule) return;
    const updated = editModules.map((m) =>
      m.id === editingModule.id
        ? {
            ...m,
            title: moduleTitle,
            videoUrl: moduleVideoUrl,
            durationMinutes: Number(moduleDuration),
            contentMarkdown: moduleMarkdown,
          }
        : m
    );
    setEditModules(updated);
    setEditingModule(null);
  };

  // Open 5-Question MCQ Assessment Builder
  const openQuizBuilder = async (courseId: string, mod: CourseModule) => {
    setQuizModule(mod);
    setLoadingQuiz(true);
    try {
      const res = await api.get(`/assessments/course/${courseId}/module/${mod.id}`);
      if (res.data.exists && res.data.questions?.length > 0) {
        setQuizQuestions(res.data.questions);
        setQuizPassThreshold(res.data.passThreshold || 70);
      } else {
        // Initialize default 5 blank questions
        const defaultQuestions: AssessmentQuestion[] = Array.from({ length: 5 }).map((_, i) => ({
          id: `q-${mod.id}-${i + 1}`,
          question: `Question ${i + 1}: `,
          options: ['Option A', 'Option B', 'Option C', 'Option D'],
          correctIndex: 0,
          explanation: '',
        }));
        setQuizQuestions(defaultQuestions);
        setQuizPassThreshold(70);
      }
    } catch (err) {
      console.error('Failed to load module quiz:', err);
    } finally {
      setLoadingQuiz(false);
    }
  };

  // Save Quiz Questions
  const handleSaveQuiz = async () => {
    if (!editingCourse || !quizModule) return;
    try {
      setSavingQuiz(true);
      await api.put(`/assessments/course/${editingCourse.id}/module/${quizModule.id}`, {
        passThreshold: quizPassThreshold,
        questions: quizQuestions,
      });
      alert(`Quiz for "${quizModule.title}" saved successfully!`);
      setQuizModule(null);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to save assessment');
    } finally {
      setSavingQuiz(false);
    }
  };

  // Download CSV Export for Course Roster
  const handleDownloadCSV = async () => {
    if (!selectedCourseId) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/courses/${selectedCourseId}/learners/export`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `learners_roster_${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error('CSV export failed:', err);
      alert('Failed to export CSV');
    }
  };

  return (
    <div className="min-h-screen bg-background text-textPrimary py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-accent font-bold uppercase tracking-wider">
                <HeadingEmoji emoji="🧑‍🏫" />Instructor Studio
              </span>
              <span className="text-xs text-textSecondary">• Role: {user?.role}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-textPrimary mt-1 tracking-tight">
              <HeadingEmoji emoji="📚" />Course &amp; Curriculum Management
            </h1>
            <p className="text-xs text-textSecondary mt-0.5">
              Author programs, publish drafts, inspect learner velocity, and diagnose quiz quality.
            </p>
          </div>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2.5 bg-primary hover:bg-primaryHover text-primaryContrast rounded-xl text-xs font-bold shadow-paper-sm transition flex items-center gap-1.5 self-start"
          >
            <Plus className="w-4 h-4" /> Create New Course
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 bg-surface p-1.5 rounded-2xl border border-border text-xs font-semibold shadow-paper-sm">
          <button
            onClick={() => setActiveTab('courses')}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 ${
              activeTab === 'courses'
                ? 'bg-primary text-primaryContrast font-bold shadow-paper-sm'
                : 'text-textSecondary hover:text-textPrimary hover:bg-surface2'
            }`}
          >
            <BookOpen className="w-4 h-4" /> My Courses &amp; Curriculum ({courses.length})
          </button>
          <button
            onClick={() => setActiveTab('learners')}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 ${
              activeTab === 'learners'
                ? 'bg-primary text-primaryContrast font-bold shadow-paper-sm'
                : 'text-textSecondary hover:text-textPrimary hover:bg-surface2'
            }`}
          >
            <Users className="w-4 h-4" /> Learner Progress &amp; Roster
          </button>
          <button
            onClick={() => setActiveTab('insights')}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 ${
              activeTab === 'insights'
                ? 'bg-primary text-primaryContrast font-bold shadow-paper-sm'
                : 'text-textSecondary hover:text-textPrimary hover:bg-surface2'
            }`}
          >
            <BarChart2 className="w-4 h-4" /> Quiz Quality Insights
          </button>
        </div>

        {/* TAB 1: COURSES MANAGEMENT */}
        {activeTab === 'courses' && (
          <div className="space-y-4">
            {loading ? (
              <div className="py-20 text-center text-xs text-textSecondary">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                Loading instructor courses...
              </div>
            ) : courses.length === 0 ? (
              <div className="p-12 text-center bg-surface rounded-2xl border border-border text-xs text-textSecondary shadow-paper-sm">
                You have not created any courses yet. Click "Create New Course" above to begin.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {courses.map((course) => {
                  const isAuthor = course.trainerId === user?.id || user?.role === 'admin';
                  const isPublished = course.status === 'published';

                  return (
                    <div
                      key={course.id}
                      className="bg-surface rounded-2xl border border-border shadow-paper-sm p-5 flex flex-col justify-between hover:border-primary/40 transition"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-primarySoft text-primary border border-primary/30">
                            {course.difficultyLevel}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase flex items-center gap-1 border ${
                              isPublished
                                ? 'bg-primarySoft text-primary border-primary/30'
                                : 'bg-accentSoft text-accent border-accent/30'
                            }`}
                          >
                            {isPublished ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                            {course.status}
                          </span>
                        </div>

                        <h3 className="font-bold text-base text-textPrimary leading-snug">
                          {course.title}
                        </h3>
                        <p className="text-xs text-textSecondary line-clamp-2">
                          {course.description}
                        </p>

                        <div className="flex items-center gap-3 text-xs text-textSecondary pt-1 border-t border-border">
                          <span className="flex items-center gap-1">
                            <Video className="w-3.5 h-3.5 text-primary" /> {course.modules?.length || 0} Modules
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 text-primary" /> {course.enrollmentCount || 0} Learners
                          </span>
                        </div>
                      </div>

                      {/* Card Action Buttons */}
                      <div className="mt-5 pt-3 border-t border-border space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <button
                            onClick={() => handleToggleStatus(course)}
                            disabled={!isAuthor}
                            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 border disabled:opacity-40 ${
                              isPublished
                                ? 'bg-surface2 hover:bg-border border-border text-textSecondary hover:text-accent'
                                : 'bg-primarySoft hover:bg-primary/20 border-primary/40 text-primary'
                            }`}
                            title={isPublished ? 'Unpublish course (make draft)' : 'Publish to public catalog'}
                          >
                            {isPublished ? 'Unpublish' : 'Publish Course'}
                          </button>

                          <button
                            onClick={() => openCurriculumEditor(course)}
                            disabled={!isAuthor}
                            className="flex-1 py-1.5 px-2 bg-primary hover:bg-primaryHover text-primaryContrast rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 shadow-paper-sm disabled:opacity-40"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-white" /> Edit Curriculum
                          </button>
                        </div>

                        <div className="flex items-center justify-between gap-2 pt-1 text-[11px]">
                          <button
                            onClick={() => {
                              setSelectedCourseId(course.id);
                              setActiveTab('learners');
                            }}
                            className="text-textSecondary hover:text-primary font-semibold flex items-center gap-1"
                          >
                            <Users className="w-3 h-3" /> View Learners
                          </button>
                          <button
                            onClick={() => {
                              setSelectedCourseId(course.id);
                              setActiveTab('insights');
                            }}
                            className="text-textSecondary hover:text-primary font-semibold flex items-center gap-1"
                          >
                            <BarChart2 className="w-3 h-3" /> Quiz Insights
                          </button>
                          {isAuthor && (
                            <button
                              onClick={() => handleDeleteCourse(course.id)}
                              className="text-danger hover:text-dangerHover font-semibold flex items-center gap-1 ml-auto"
                            >
                              <Trash2 className="w-3 h-3" /> Delete
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
        )}

        {/* TAB 2: LEARNERS PROGRESS & ROSTER */}
        {activeTab === 'learners' && (
          <div className="space-y-6">
            {/* Course Selector Bar & Export Button */}
            <div className="bg-surface p-4 rounded-2xl border border-border shadow-paper-sm flex flex-col md:flex-row gap-3 items-center justify-between">
              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-textSecondary uppercase">Select Course:</span>
                  <select
                    value={selectedCourseId}
                    onChange={(e) => setSelectedCourseId(e.target.value)}
                    className="px-3 py-2 bg-surface2 border border-border rounded-xl text-xs font-medium text-textPrimary focus:outline-none focus:border-primary"
                  >
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title} ({c.status})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Profession Filter */}
                <select
                  value={rosterProfession}
                  onChange={(e) => setRosterProfession(e.target.value)}
                  className="px-3 py-2 bg-surface2 border border-border rounded-xl text-xs font-medium text-textPrimary focus:outline-none focus:border-primary"
                >
                  <option value="ALL">All Professions</option>
                  <option value="STUDENT">Student</option>
                  <option value="WORKING_PROFESSIONAL">Working Professional</option>
                  <option value="FREELANCER">Freelancer</option>
                  <option value="JOB_SEEKER">Job Seeker</option>
                  <option value="ENTREPRENEUR">Entrepreneur</option>
                  <option value="OTHER">Other</option>
                </select>

                {/* Search Bar */}
                <input
                  type="text"
                  value={rosterSearch}
                  onChange={(e) => setRosterSearch(e.target.value)}
                  placeholder="Search learner name or email..."
                  className="px-3 py-2 bg-surface2 border border-border rounded-xl text-xs text-textPrimary focus:outline-none focus:border-primary"
                />
              </div>

              <button
                onClick={handleDownloadCSV}
                className="px-4 py-2 bg-surface2 hover:bg-border border border-border text-primary text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-paper-sm"
              >
                <Download className="w-3.5 h-3.5" /> Export Roster (CSV)
              </button>
            </div>

            {/* Roster Table */}
            {loadingRoster ? (
              <div className="py-20 text-center text-xs text-textSecondary">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                Loading enrolled learners...
              </div>
            ) : roster.length === 0 ? (
              <div className="p-12 text-center bg-surface rounded-2xl border border-border text-xs text-textSecondary shadow-paper-sm">
                No learners have enrolled in this course yet.
              </div>
            ) : (
              <div className="bg-surface rounded-2xl border border-border overflow-hidden shadow-paper-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-surface2 text-textSecondary uppercase text-[10px] border-b border-border">
                      <tr>
                        <th className="p-4">Learner Name &amp; Email</th>
                        <th className="p-4">Status</th>
                        <th className="p-4">Modules Completed</th>
                        <th className="p-4">Overall Progress</th>
                        <th className="p-4">Latest Quiz Score</th>
                        <th className="p-4">Last Activity</th>
                        <th className="p-4">Profile &amp; Diagnostic</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {roster
                        .filter((learner) => {
                          const matchesSearch =
                            learner.name.toLowerCase().includes(rosterSearch.toLowerCase()) ||
                            learner.email.toLowerCase().includes(rosterSearch.toLowerCase());
                          return matchesSearch;
                        })
                        .map((learner) => (
                          <tr key={learner.id} className="hover:bg-surface2 transition">
                            <td className="p-4">
                              <div className="flex items-center gap-2.5">
                                <Avatar
                                  user={{
                                    id: learner.userId,
                                    name: learner.name,
                                    email: learner.email,
                                    role: 'learner',
                                    department: '',
                                    jobRole: '',
                                  }}
                                  size="sm"
                                />
                                <div>
                                  <a
                                    href={`/profile/${learner.userId}`}
                                    className="font-bold text-textPrimary hover:text-primary hover:underline"
                                  >
                                    {learner.name}
                                  </a>
                                  <div className="text-[11px] text-textSecondary">{learner.email}</div>
                                </div>
                              </div>
                            </td>
                            <td className="p-4">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                                  learner.status === 'completed'
                                    ? 'bg-primarySoft text-primary border-primary/30'
                                    : learner.status === 'in_progress'
                                    ? 'bg-accentSoft text-accent border-accent/30'
                                    : 'bg-surface2 text-textSecondary border-border'
                                }`}
                              >
                                {learner.status}
                              </span>
                            </td>
                            <td className="p-4 font-semibold">
                              {learner.completedModulesCount} / {learner.totalModulesCount} Modules
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <div className="w-24 h-2 bg-border rounded-full overflow-hidden border border-borderStrong">
                                  <div
                                    className="h-full bg-primary rounded-full"
                                    style={{ width: `${learner.progressPercent}%` }}
                                  />
                                </div>
                                <span className="text-primary font-bold">
                                  {learner.progressPercent}%
                                </span>
                              </div>
                            </td>
                            <td className="p-4 font-bold">
                              {learner.latestQuizScore !== null ? (
                                <span
                                  className={learner.latestQuizScore >= 70 ? 'text-primary' : 'text-danger'}
                                >
                                  {learner.latestQuizScore}%
                                </span>
                              ) : (
                                <span className="text-textSecondary font-normal">None</span>
                              )}
                            </td>
                            <td className="p-4 text-textSecondary text-[11px]">
                              {new Date(learner.lastActiveAt).toLocaleDateString()}
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <a
                                  href={`/profile/${learner.userId}`}
                                  className="px-2 py-1 bg-primarySoft text-primary border border-primary/30 rounded text-[10px] font-bold hover:bg-primary/20 transition"
                                >
                                  View Profile
                                </a>
                                {learner.isStuck ? (
                                  <span className="px-2 py-1 rounded bg-accentSoft text-accent border border-accent/30 text-[10px] font-bold flex items-center gap-1">
                                    <AlertTriangle className="w-3 h-3 text-accent" /> Stuck
                                  </span>
                                ) : learner.status === 'completed' ? (
                                  <span className="text-primary text-[10px] font-semibold flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3 text-primary" /> Done
                                  </span>
                                ) : (
                                  <span className="text-textSecondary text-[10px]">On Track</span>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: QUIZ QUALITY INSIGHTS */}
        {activeTab === 'insights' && (
          <div className="space-y-6">
            {/* Course Selector Bar */}
            <div className="bg-surface p-4 rounded-2xl border border-border shadow-paper-sm flex items-center gap-2">
              <span className="text-xs font-bold text-textSecondary uppercase">Select Course:</span>
              <select
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                className="px-3 py-2 bg-surface2 border border-border rounded-xl text-xs font-medium text-textPrimary focus:outline-none focus:border-primary"
              >
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>

            {loadingInsights ? (
              <div className="py-20 text-center text-xs text-textSecondary">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                Computing quiz failure rates &amp; quality metrics...
              </div>
            ) : !insights || insights.moduleInsights.length === 0 ? (
              <div className="p-12 text-center bg-surface rounded-2xl border border-border text-xs text-textSecondary shadow-paper-sm">
                No quiz assessments configured for this course yet. Add module quizzes in the Curriculum Editor.
              </div>
            ) : (
              <div className="space-y-6">
                {insights.moduleInsights.map((mInsight, idx) => (
                  <div
                    key={mInsight.assessmentId}
                    className="bg-surface rounded-2xl border border-border shadow-paper-sm p-6 space-y-4"
                  >
                    {/* Module Assessment Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-border gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-accent font-bold uppercase">
                            Quiz Assessment #{idx + 1}
                          </span>
                          {mInsight.needsReviewCount > 0 && (
                            <span className="px-2 py-0.5 rounded bg-accentSoft text-accent border border-accent/30 text-[10px] font-bold flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3 text-accent" /> {mInsight.needsReviewCount} Question(s) Need Review
                            </span>
                          )}
                        </div>
                        <h3 className="font-bold text-base text-textPrimary mt-0.5">
                          {mInsight.moduleTitle}
                        </h3>
                      </div>

                      <div className="flex items-center gap-4 text-xs">
                        <div className="text-right">
                          <div className="text-textSecondary text-[10px]">TOTAL ATTEMPTS</div>
                          <div className="font-bold text-textPrimary">{mInsight.totalAttempts}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-textSecondary text-[10px]">PASS RATE</div>
                          <div className="font-bold text-accent">{mInsight.passRate}%</div>
                        </div>
                        <div className="text-right">
                          <div className="text-textSecondary text-[10px]">AVG SCORE</div>
                          <div className="font-bold text-textPrimary">{mInsight.avgScore}%</div>
                        </div>
                      </div>
                    </div>

                    {/* Question Diagnostic Cards */}
                    <div className="space-y-3">
                      {mInsight.questions.map((q, qIndex) => (
                        <div
                          key={q.id}
                          className={`p-4 rounded-xl border transition ${
                            q.needsReview
                              ? 'bg-accentSoft border-accent/40'
                              : 'bg-surface2 border-border'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-primary font-bold">
                                  Q{qIndex + 1}
                                </span>
                                {q.needsReview && (
                                  <span className="px-2 py-0.5 rounded bg-accentSoft text-accent border border-accent/40 text-[9px] font-bold uppercase">
                                    ⚠️ Needs Review (&gt;40% Failure Rate)
                                  </span>
                                )}
                              </div>
                              <p className="text-xs font-semibold text-textPrimary leading-snug">
                                {q.question}
                              </p>
                            </div>

                            <div className="text-right flex-shrink-0">
                              <div className="text-[10px] text-textSecondary uppercase">Failure Rate</div>
                              <div
                                className={`text-sm font-extrabold ${
                                  q.needsReview ? 'text-accent font-bold' : 'text-primary'
                                }`}
                              >
                                {q.failureRate}%
                              </div>
                            </div>
                          </div>

                          {/* Options Breakdown & Chosen Distribution */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 pt-2 border-t border-border/60">
                            {q.options.map((opt, optIdx) => {
                              const isCorrect = optIdx === q.correctIndex;
                              const chosenCount = q.optionDistribution[optIdx] || 0;
                              const pct =
                                q.totalAttempts > 0
                                  ? Math.round((chosenCount / q.totalAttempts) * 100)
                                  : 0;

                              return (
                                <div
                                  key={optIdx}
                                  className={`p-2 rounded-lg border text-xs flex items-center justify-between ${
                                    isCorrect
                                      ? 'bg-accent/10 border-accent/40 text-textPrimary'
                                      : 'bg-background border-border text-textSecondary'
                                  }`}
                                >
                                  <span className="flex items-center gap-1.5 truncate mr-2">
                                    <span className="font-bold text-[10px] text-accent">
                                      {String.fromCharCode(65 + optIdx)}.
                                    </span>
                                    <span className="truncate">{opt}</span>
                                    {isCorrect && (
                                      <span className="text-[9px] font-bold text-accent ml-1 uppercase">
                                        (Correct)
                                      </span>
                                    )}
                                  </span>
                                  <span className="text-[10px] text-textSecondary flex-shrink-0">
                                    {chosenCount} ({pct}%)
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* MODAL 1: CREATE COURSE */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 bg-textPrimary/45 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-surface rounded-2xl shadow-paper-lg max-w-xl w-full border border-border p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <h3 className="text-base font-bold text-textPrimary">Create New Course</h3>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="p-1.5 text-textSecondary hover:text-textPrimary rounded-lg hover:bg-border/50 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateCourse} className="space-y-3 text-xs">
                <div>
                  <label className="block text-textSecondary font-semibold mb-1">Course Title</label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Advanced Python for Data Science"
                    className="w-full p-2 bg-surface2 border border-border rounded-xl text-textPrimary focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-textSecondary font-semibold mb-1">Course Description</label>
                  <textarea
                    required
                    rows={3}
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="Explain course objectives, prerequisites, and learning outcomes..."
                    className="w-full p-2 bg-surface2 border border-border rounded-xl text-textPrimary focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-textSecondary font-semibold mb-1">Difficulty Level</label>
                    <select
                      value={newDifficulty}
                      onChange={(e) => setNewDifficulty(e.target.value)}
                      className="w-full p-2 bg-surface2 border border-border rounded-xl text-textPrimary focus:border-primary focus:outline-none"
                    >
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-textSecondary font-semibold mb-1">Initial Status</label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value as 'draft' | 'published')}
                      className="w-full p-2 bg-surface2 border border-border rounded-xl text-textPrimary focus:border-primary focus:outline-none"
                    >
                      <option value="draft">Draft (Visible only to you)</option>
                      <option value="published">Published (Catalog visible)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-textSecondary font-semibold mb-1">Competency Domain</label>
                  <select
                    value={selectedCompetencyId}
                    onChange={(e) => setSelectedCompetencyId(e.target.value)}
                    className="w-full p-2 bg-surface2 border border-border rounded-xl text-textPrimary focus:border-primary focus:outline-none"
                  >
                    {competencies.map((comp) => (
                      <option key={comp.id} value={comp.id}>
                        {comp.name} ({comp.category})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-4 py-2 bg-surface2 hover:bg-border border border-border text-textSecondary rounded-xl font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingCourse}
                    className="px-4 py-2 bg-primary hover:bg-primaryHover text-primaryContrast font-bold rounded-xl shadow-paper-sm transition disabled:opacity-50"
                  >
                    {savingCourse ? 'Creating...' : 'Create Course'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 2: CURRICULUM & MODULE EDITOR */}
        {editingCourse && (
          <div className="fixed inset-0 z-50 bg-textPrimary/45 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-surface rounded-2xl shadow-paper-lg max-w-4xl w-full border border-border p-6 space-y-5 max-h-[90vh] flex flex-col">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div>
                  <span className="text-[10px] text-accent font-bold uppercase">Curriculum Studio</span>
                  <h3 className="text-base font-bold text-textPrimary">{editingCourse.title}</h3>
                </div>
                <button
                  onClick={() => setEditingCourse(null)}
                  className="p-1.5 text-textSecondary hover:text-textPrimary rounded-lg hover:bg-border/50 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs">
                {/* Basic Details */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-surface2 p-3 rounded-xl border border-border">
                  <div className="sm:col-span-2">
                    <label className="block text-textSecondary font-semibold mb-1">Course Title</label>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full p-2 bg-surface border border-border rounded-lg text-textPrimary focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-textSecondary font-semibold mb-1">Status</label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value as 'draft' | 'published')}
                      className="w-full p-2 bg-surface border border-border rounded-lg text-textPrimary focus:border-primary focus:outline-none"
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                    </select>
                  </div>
                </div>

                {/* Modules List */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-textPrimary text-xs uppercase">
                      Curriculum Modules ({editModules.length})
                    </h4>
                    <button
                      onClick={handleAddNewModule}
                      className="px-3 py-1 bg-primarySoft hover:bg-primary/20 text-primary border border-primary/40 rounded-lg text-xs font-bold transition flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Module
                    </button>
                  </div>

                  <div className="space-y-2">
                    {editModules.map((mod, index) => (
                      <div
                        key={mod.id}
                        className="bg-surface2 p-3.5 rounded-xl border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-primary font-bold">
                              #{index + 1}
                            </span>
                            <span className="font-bold text-textPrimary text-xs">{mod.title}</span>
                          </div>
                          <div className="flex items-center gap-3 text-[11px] text-textSecondary">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-primary" /> {mod.durationMinutes} min
                            </span>
                            {mod.videoUrl && (
                              <span className="flex items-center gap-1 truncate max-w-xs text-textSecondary">
                                <Video className="w-3 h-3 text-primary" /> {mod.videoUrl}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Module Actions */}
                        <div className="flex items-center gap-1.5 self-end sm:self-center">
                          {/* Reordering */}
                          <button
                            onClick={() => moveModule(index, 'up')}
                            disabled={index === 0}
                            className="p-1 text-textSecondary hover:text-primary disabled:opacity-20"
                            title="Move Up"
                          >
                            <ChevronUp className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => moveModule(index, 'down')}
                            disabled={index === editModules.length - 1}
                            className="p-1 text-textSecondary hover:text-primary disabled:opacity-20"
                            title="Move Down"
                          >
                            <ChevronDown className="w-4 h-4" />
                          </button>

                          {/* Edit Module Info */}
                          <button
                            onClick={() => openModuleEditor(mod)}
                            className="px-2.5 py-1 bg-surface hover:bg-border text-textPrimary border border-border rounded-lg text-xs font-semibold"
                          >
                            Edit Lesson
                          </button>

                          {/* 5-Question MCQ Quiz Button */}
                          <button
                            onClick={() => openQuizBuilder(editingCourse.id, mod)}
                            className="px-2.5 py-1 bg-primarySoft hover:bg-primary/20 text-primary border border-primary/40 rounded-lg text-xs font-bold flex items-center gap-1"
                          >
                            <FileCheck className="w-3.5 h-3.5" /> MCQ Quiz
                          </button>

                          {/* Delete Module */}
                          <button
                            onClick={() => handleDeleteModule(mod.id)}
                            className="p-1.5 text-danger hover:text-dangerHover"
                            title="Delete Module"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom Save Bar */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <button
                  onClick={() => setEditingCourse(null)}
                  className="px-4 py-2 bg-surface2 hover:bg-border border border-border text-textSecondary rounded-xl font-semibold text-xs"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveCurriculum}
                  disabled={savingCurriculum}
                  className="px-5 py-2 bg-primary hover:bg-primaryHover text-primaryContrast font-bold rounded-xl text-xs shadow-paper-sm transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" /> {savingCurriculum ? 'Saving...' : 'Save Curriculum'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 3: EDIT SINGLE MODULE DETAILS */}
        {editingModule && (
          <div className="fixed inset-0 z-50 bg-textPrimary/45 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-surface rounded-2xl shadow-paper-lg max-w-lg w-full border border-border p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <h3 className="text-base font-bold text-textPrimary">Edit Module Details</h3>
                <button
                  onClick={() => setEditingModule(null)}
                  className="p-1.5 text-textSecondary hover:text-textPrimary rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-textSecondary font-semibold mb-1">Module Title</label>
                  <input
                    type="text"
                    value={moduleTitle}
                    onChange={(e) => setModuleTitle(e.target.value)}
                    className="w-full p-2 bg-surface2 border border-border rounded-xl text-textPrimary focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-textSecondary font-semibold mb-1">
                    YouTube Video URL (embed or watch link)
                  </label>
                  <input
                    type="text"
                    value={moduleVideoUrl}
                    onChange={(e) => setModuleVideoUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full p-2 bg-surface2 border border-border rounded-xl text-textPrimary focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-textSecondary font-semibold mb-1">Duration (minutes)</label>
                  <input
                    type="number"
                    value={moduleDuration}
                    onChange={(e) => setModuleDuration(Number(e.target.value))}
                    className="w-full p-2 bg-surface2 border border-border rounded-xl text-textPrimary focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-textSecondary font-semibold mb-1">Lesson Content / Notes (Markdown)</label>
                  <textarea
                    rows={4}
                    value={moduleMarkdown}
                    onChange={(e) => setModuleMarkdown(e.target.value)}
                    placeholder="# Lesson Notes..."
                    className="w-full p-2 bg-surface2 border border-border rounded-xl text-textPrimary focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                  <button
                    onClick={() => setEditingModule(null)}
                    className="px-4 py-2 bg-surface2 hover:bg-border border border-border text-textSecondary rounded-xl font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveSingleModule}
                    className="px-4 py-2 bg-primary hover:bg-primaryHover text-primaryContrast font-bold rounded-xl shadow-paper-sm transition"
                  >
                    Update Module
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 4: INTERACTIVE 5-QUESTION MCQ ASSESSMENT BUILDER */}
        {quizModule && (
          <div className="fixed inset-0 z-50 bg-textPrimary/45 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-surface rounded-2xl shadow-paper-lg max-w-3xl w-full border border-border p-6 space-y-4 max-h-[90vh] flex flex-col">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div>
                  <span className="text-[10px] text-accent font-bold uppercase">Assessment Authoring</span>
                  <h3 className="text-base font-bold text-textPrimary">
                    5-Question MCQ Quiz: {quizModule.title}
                  </h3>
                </div>
                <button
                  onClick={() => setQuizModule(null)}
                  className="p-1.5 text-textSecondary hover:text-textPrimary rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {loadingQuiz ? (
                <div className="py-16 text-center text-xs text-textSecondary">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  Loading questions...
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto space-y-5 pr-1 text-xs">
                  <div className="bg-surface2 p-3 rounded-xl border border-border flex items-center justify-between">
                    <span className="text-textSecondary font-semibold">Passing Threshold (%):</span>
                    <input
                      type="number"
                      min={10}
                      max={100}
                      value={quizPassThreshold}
                      onChange={(e) => setQuizPassThreshold(Number(e.target.value))}
                      className="w-20 p-1.5 bg-surface border border-border rounded-lg text-textPrimary font-bold text-center"
                    />
                  </div>

                  {/* 5 Questions */}
                  {quizQuestions.map((q, qIndex) => (
                    <div
                      key={q.id || qIndex}
                      className="bg-surface2 p-4 rounded-xl border border-border space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-primary font-bold uppercase">
                          Question {qIndex + 1}
                        </span>
                        <span className="text-[10px] text-textSecondary">
                          Select the radio button next to the correct answer
                        </span>
                      </div>

                      <div>
                        <input
                          type="text"
                          value={q.question}
                          onChange={(e) => {
                            const updated = [...quizQuestions];
                            updated[qIndex].question = e.target.value;
                            setQuizQuestions(updated);
                          }}
                          placeholder={`Enter question ${qIndex + 1}...`}
                          className="w-full p-2 bg-surface border border-border rounded-xl text-textPrimary font-medium focus:border-primary focus:outline-none"
                        />
                      </div>

                      {/* 4 Options */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {q.options.map((opt, optIndex) => (
                          <div
                            key={optIndex}
                            className={`flex items-center gap-2 p-2 rounded-xl border ${
                              q.correctIndex === optIndex
                                ? 'bg-primarySoft border-primary'
                                : 'bg-surface border-border'
                            }`}
                          >
                            <input
                              type="radio"
                              name={`correct-${qIndex}`}
                              checked={q.correctIndex === optIndex}
                              onChange={() => {
                                const updated = [...quizQuestions];
                                updated[qIndex].correctIndex = optIndex;
                                setQuizQuestions(updated);
                              }}
                              className="accent-primary"
                            />
                            <span className="text-[10px] text-primary font-bold">
                              {String.fromCharCode(65 + optIndex)}.
                            </span>
                            <input
                              type="text"
                              value={opt}
                              onChange={(e) => {
                                const updated = [...quizQuestions];
                                updated[qIndex].options[optIndex] = e.target.value;
                                setQuizQuestions(updated);
                              }}
                              className="w-full bg-transparent text-textPrimary focus:outline-none text-xs"
                            />
                          </div>
                        ))}
                      </div>

                      {/* Explanation */}
                      <div>
                        <input
                          type="text"
                          value={q.explanation || ''}
                          onChange={(e) => {
                            const updated = [...quizQuestions];
                            updated[qIndex].explanation = e.target.value;
                            setQuizQuestions(updated);
                          }}
                          placeholder="Answer explanation shown to learner upon passing..."
                          className="w-full p-1.5 bg-surface border border-border rounded-lg text-textSecondary text-[11px] focus:outline-none focus:border-primary"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <button
                  onClick={() => setQuizModule(null)}
                  className="px-4 py-2 bg-surface2 hover:bg-border border border-border text-textSecondary rounded-xl font-semibold text-xs"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveQuiz}
                  disabled={savingQuiz}
                  className="px-5 py-2 bg-primary hover:bg-primaryHover text-primaryContrast font-bold rounded-xl text-xs shadow-paper-sm transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" /> {savingQuiz ? 'Saving Assessment...' : 'Save 5-Question Quiz'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
