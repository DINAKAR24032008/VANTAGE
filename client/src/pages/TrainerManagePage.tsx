import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Course, Competency } from '../types';
import {
  Plus,
  BookOpen,
  Trash2,
  Edit3,
  UploadCloud,
  Layers,
  Award,
  CheckCircle2,
  X,
  FileText,
} from 'lucide-react';

export const TrainerManagePage: React.FC = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [competencies, setCompetencies] = useState<Competency[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [difficultyLevel, setDifficultyLevel] = useState('Intermediate');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [modules, setModules] = useState([
    { id: 'mod-1', title: 'Module 1: Domain Foundations', durationMinutes: 45, contentMarkdown: 'Foundational concepts and principles.', order: 1 },
  ]);
  const [selectedTags, setSelectedTags] = useState<{ competencyId: string; targetLevel: number }[]>([]);

  // Assessment Config for course
  const [passThreshold, setPassThreshold] = useState(70);
  const [quizQuestions, setQuizQuestions] = useState([
    {
      id: 'q-1',
      question: 'Sample assessment question relating to this curriculum?',
      options: ['Option A (Correct)', 'Option B', 'Option C', 'Option D'],
      correctIndex: 0,
      explanation: 'Explanation for correct choice.',
    },
  ]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [coursesRes, compsRes] = await Promise.all([
        api.get('/courses'),
        api.get('/competencies'),
      ]);
      setCourses(coursesRes.data);
      setCompetencies(compsRes.data);

      if (compsRes.data.length > 0) {
        setSelectedTags([{ competencyId: compsRes.data[0].id, targetLevel: 3 }]);
      }
    } catch (err) {
      console.error('Failed to load trainer portal data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);

      const res = await api.post('/courses/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setThumbnailUrl(res.data.url);
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Upload failed. Please ensure file format is supported.');
    } finally {
      setUploading(false);
    }
  };

  const handleAddModule = () => {
    setModules([
      ...modules,
      {
        id: `mod-${modules.length + 1}`,
        title: `Module ${modules.length + 1}: Advanced Practices`,
        durationMinutes: 45,
        contentMarkdown: '',
        order: modules.length + 1,
      },
    ]);
  };

  const handleToggleCompetencyTag = (compId: string) => {
    const exists = selectedTags.find((t) => t.competencyId === compId);
    if (exists) {
      setSelectedTags(selectedTags.filter((t) => t.competencyId !== compId));
    } else {
      setSelectedTags([...selectedTags, { competencyId: compId, targetLevel: 3 }]);
    }
  };

  const handleUpdateTagLevel = (compId: string, level: number) => {
    setSelectedTags(
      selectedTags.map((t) => (t.competencyId === compId ? { ...t, targetLevel: level } : t))
    );
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);

      const courseRes = await api.post('/courses', {
        title,
        description,
        difficultyLevel,
        thumbnailUrl: thumbnailUrl || 'https://images.unsplash.com/photo-1507499739999-097706ad8914?auto=format&fit=crop&w=600&q=80',
        modules,
        competencyTags: selectedTags,
      });

      // Also create assessment for course
      if (quizQuestions.length > 0) {
        await api.post(`/assessments/course/${courseRes.data.id}`, {
          passThreshold,
          questions: quizQuestions,
        });
      }

      setIsModalOpen(false);
      resetForm();
      await loadData();
    } catch (err: any) {
      console.error('Error creating course:', err);
      alert(err.response?.data?.error || 'Failed to create course');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (!window.confirm('Are you sure you want to delete this course?')) return;
    try {
      await api.delete(`/courses/${courseId}`);
      await loadData();
    } catch (err) {
      console.error('Failed to delete course:', err);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setDifficultyLevel('Intermediate');
    setThumbnailUrl('');
    setModules([
      { id: 'mod-1', title: 'Module 1: Domain Foundations', durationMinutes: 45, contentMarkdown: '', order: 1 },
    ]);
  };

  return (
    <div className="min-h-screen bg-background text-textPrimary py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-mono text-accent font-bold uppercase tracking-wider">
              Trainer Curriculum Management Console
            </span>
            <h1 className="text-3xl sm:text-4xl font-display italic text-textPrimary mt-1 tracking-tight">
              Curriculum & Course Creator
            </h1>
            <p className="text-xs text-textSecondary">
              Author instructional modules, upload scientific media, map competencies, and configure quizzes.
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2.5 bg-accent hover:bg-accent/90 text-background rounded-xl text-xs font-bold shadow-lg shadow-accent/20 transition flex items-center gap-1.5 self-start"
          >
            <Plus className="w-4 h-4" /> Create New Course
          </button>
        </div>

        {/* Existing Courses Table */}
        <div className="bg-surface rounded-2xl border border-surfaceBorder shadow-sm overflow-hidden">
          <div className="p-5 border-b border-surfaceBorder flex items-center justify-between">
            <h3 className="font-bold text-sm text-textPrimary flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-accent" />
              Published Training Programs ({courses.length})
            </h3>
          </div>

          {loading ? (
            <div className="p-12 text-center text-xs text-textSecondary">Loading courses...</div>
          ) : courses.length === 0 ? (
            <div className="p-12 text-center text-xs text-textSecondary">No courses published yet.</div>
          ) : (
            <div className="divide-y divide-surfaceBorder">
              {courses.map((course) => (
                <div key={course.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-surfaceBorder/20 transition">
                  <div className="space-y-1 max-w-2xl">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-surfaceBorder/40 text-textSecondary border border-surfaceBorder">
                        {course.difficultyLevel}
                      </span>
                      <span className="text-xs text-textSecondary">
                        Author: {course.trainer?.name || 'MoES Trainer'}
                      </span>
                    </div>
                    <h4 className="font-bold text-sm text-textPrimary">{course.title}</h4>
                    <p className="text-xs text-textSecondary line-clamp-1">{course.description}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {course.competencyTags.map((tag) => (
                        <span key={tag.id} className="text-[9px] bg-accent/10 text-accent px-2 py-0.5 rounded font-medium border border-accent/20">
                          {tag.competency.name} (L{tag.targetLevel})
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleDeleteCourse(course.id)}
                      className="p-2 text-textSecondary hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition"
                      title="Delete Course"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Course Creator Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-surface rounded-2xl shadow-2xl max-w-3xl w-full border border-surfaceBorder overflow-hidden relative max-h-[90vh] flex flex-col">
            <div className="bg-surface text-textPrimary p-5 flex items-center justify-between border-b border-surfaceBorder">
              <div>
                <span className="text-[10px] font-mono text-accent font-bold uppercase tracking-wider">
                  MoES Training Framework
                </span>
                <h3 className="text-base font-bold text-textPrimary">Create New Curriculum Course</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-textSecondary hover:text-textPrimary rounded-lg hover:bg-surfaceBorder/40 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCourse} className="p-6 overflow-y-auto flex-1 space-y-5">
              <div>
                <label className="block text-xs font-semibold text-textSecondary mb-1">Course Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Advanced Satellite Oceanography and Cyclone Tracking"
                  className="w-full p-2.5 bg-background border border-surfaceBorder rounded-xl text-xs text-textPrimary placeholder-textSecondary/50 focus:border-accent focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-textSecondary mb-1">Description</label>
                <textarea
                  required
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detailed learning objectives and domain outcomes..."
                  className="w-full p-2.5 bg-background border border-surfaceBorder rounded-xl text-xs text-textPrimary placeholder-textSecondary/50 focus:border-accent focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-textSecondary mb-1">Difficulty Level</label>
                  <select
                    value={difficultyLevel}
                    onChange={(e) => setDifficultyLevel(e.target.value)}
                    className="w-full p-2.5 bg-background border border-surfaceBorder rounded-xl text-xs font-medium text-textPrimary focus:border-accent focus:outline-none"
                  >
                    <option>Beginner</option>
                    <option>Intermediate</option>
                    <option>Advanced</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-textSecondary mb-1">
                    Upload Course Document / Media (Local / S3 Mock)
                  </label>
                  <input
                    type="file"
                    onChange={handleFileUpload}
                    className="w-full text-xs text-textSecondary file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-accent/10 file:text-accent hover:file:bg-accent/20"
                  />
                  {uploading && <p className="text-[10px] text-accent mt-1">Uploading file...</p>}
                </div>
              </div>

              {/* Tag Competencies */}
              <div className="border-t border-surfaceBorder pt-4">
                <label className="block text-xs font-bold text-textPrimary mb-2">
                  Map Course to Target Competencies & Elevation Levels
                </label>
                <div className="space-y-2 max-h-40 overflow-y-auto p-3 bg-background rounded-xl border border-surfaceBorder">
                  {competencies.map((comp) => {
                    const tag = selectedTags.find((t) => t.competencyId === comp.id);
                    const isChecked = !!tag;

                    return (
                      <div key={comp.id} className="flex items-center justify-between text-xs py-1 border-b border-surfaceBorder last:border-none">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleCompetencyTag(comp.id)}
                            className="rounded accent-accent"
                          />
                          <span className="font-medium text-textPrimary">{comp.name}</span>
                        </label>

                        {isChecked && (
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-textSecondary">Target Level:</span>
                            <select
                              value={tag?.targetLevel || 3}
                              onChange={(e) => handleUpdateTagLevel(comp.id, parseInt(e.target.value, 10))}
                              className="px-2 py-0.5 bg-surface border border-surfaceBorder rounded text-xs text-textPrimary"
                            >
                              {[1, 2, 3, 4, 5].map((lvl) => (
                                <option key={lvl} value={lvl}>Level {lvl}</option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Instructional Modules */}
              <div className="border-t border-surfaceBorder pt-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-textPrimary">
                    Instructional Modules ({modules.length})
                  </label>
                  <button
                    type="button"
                    onClick={handleAddModule}
                    className="text-xs font-bold text-accent hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Module
                  </button>
                </div>

                <div className="space-y-3">
                  {modules.map((mod, idx) => (
                    <div key={mod.id} className="p-3 bg-background rounded-xl border border-surfaceBorder space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <input
                          type="text"
                          value={mod.title}
                          onChange={(e) => {
                            const updated = [...modules];
                            updated[idx].title = e.target.value;
                            setModules(updated);
                          }}
                          className="flex-1 p-2 bg-surface border border-surfaceBorder rounded-lg text-xs font-semibold text-textPrimary"
                          placeholder="Module Title"
                        />
                        <input
                          type="number"
                          value={mod.durationMinutes}
                          onChange={(e) => {
                            const updated = [...modules];
                            updated[idx].durationMinutes = parseInt(e.target.value, 10) || 30;
                            setModules(updated);
                          }}
                          className="w-20 p-2 bg-surface border border-surfaceBorder rounded-lg text-xs text-textPrimary"
                          placeholder="Mins"
                        />
                      </div>
                      <textarea
                        rows={2}
                        value={mod.contentMarkdown}
                        onChange={(e) => {
                          const updated = [...modules];
                          updated[idx].contentMarkdown = e.target.value;
                          setModules(updated);
                        }}
                        className="w-full p-2 bg-surface border border-surfaceBorder rounded-lg text-xs text-textSecondary"
                        placeholder="Lecture notes, equations, or case study markdown..."
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-surfaceBorder pt-4">
                <label className="block text-xs font-bold text-textPrimary mb-1">
                  Pass Threshold Percentage
                </label>
                <input
                  type="number"
                  min="50"
                  max="100"
                  value={passThreshold}
                  onChange={(e) => setPassThreshold(parseInt(e.target.value, 10))}
                  className="w-32 p-2 bg-background border border-surfaceBorder rounded-xl text-xs font-bold text-textPrimary"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-surfaceBorder">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-textSecondary hover:text-textPrimary hover:bg-surfaceBorder/40 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-accent hover:bg-accent/90 text-background rounded-xl text-xs font-bold shadow-lg shadow-accent/20 transition disabled:opacity-50"
                >
                  {saving ? 'Publishing Course...' : 'Save & Publish Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
