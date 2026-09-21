import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Course } from '../types';
import { Search, BookOpen, Users, Award, Filter, Sparkles, Layers } from 'lucide-react';
import { HeadingEmoji } from '../components/HeadingEmoji';

export const CourseCatalogPage: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    fetchCourses();
  }, [selectedDifficulty]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (selectedDifficulty !== 'all') params.difficulty = selectedDifficulty;
      if (search) params.search = search;

      const res = await api.get('/courses', { params });
      setCourses(res.data);
    } catch (err) {
      console.error('Failed to load courses:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCourses();
  };

  const filteredCourses = courses.filter((c) => {
    if (selectedCategory === 'all') return true;
    return c.competencyTags.some(
      (t) => t.competency.category.toLowerCase() === selectedCategory.toLowerCase()
    );
  });

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <div>
          <span className="text-[10px] text-accent font-bold uppercase tracking-wider">
            <HeadingEmoji emoji="🎓" />Curriculum &amp; Programs
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold text-textPrimary mt-1 tracking-tight">
            <HeadingEmoji emoji="📚" />Course Catalog
          </h1>
          <p className="text-xs sm:text-sm text-textSecondary mt-1">
            Self-paced courses with structured video lessons, hands-on modules, and verified assessments.
          </p>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-surface p-4 rounded-2xl border border-border shadow-paper-sm flex flex-col md:flex-row gap-3 items-center justify-between">
          <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-textSecondary absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search courses, topics, or modules..."
              className="w-full pl-9 pr-4 py-2 bg-surface2 border border-border rounded-xl text-xs text-textPrimary placeholder:text-textSecondary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </form>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 bg-surface2 border border-border rounded-xl text-xs font-semibold text-textPrimary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            >
              <option value="all">All Categories</option>
              <option value="Software Development">Software Development</option>
              <option value="Programming">Programming</option>
            </select>

            {/* Difficulty Filter */}
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="px-3 py-2 bg-surface2 border border-border rounded-xl text-xs font-semibold text-textPrimary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            >
              <option value="all">All Difficulty Levels</option>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
          </div>
        </div>

        {/* Course Cards Grid */}
        {loading ? (
          <div className="py-20 text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-xs text-textSecondary">Loading courses...</p>
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="py-20 text-center bg-surface rounded-2xl border border-border">
            <BookOpen className="w-12 h-12 text-textSecondary mx-auto mb-4 opacity-40" />
            {courses.length === 0 ? (
              <>
                <p className="text-sm font-bold text-textPrimary mb-1">No courses available yet</p>
                <p className="text-xs text-textSecondary max-w-sm mx-auto">
                  The course catalog is currently empty. Trainers can create and publish new courses from the Trainer Dashboard.
                </p>
              </>
            ) : (
              <>
                <p className="text-sm font-bold text-textPrimary mb-1">No courses match your filters</p>
                <p className="text-xs text-textSecondary">Try adjusting the difficulty or category filters, or clear your search.</p>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
              <div
                key={course.id}
                className="bg-surface rounded-2xl border border-border shadow-paper-sm hover:border-primary/40 transition flex flex-col justify-between overflow-hidden group"
              >
                {/* Course Header Banner */}
                <div className="h-32 bg-surface2 relative overflow-hidden border-b border-border">
                  {course.thumbnailUrl ? (
                    <img
                      src={course.thumbnailUrl}
                      alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-textSecondary">
                      <BookOpen className="w-12 h-12" />
                    </div>
                  )}
                  <div className="absolute top-3 right-3">
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded shadow-paper-sm border ${
                        course.difficultyLevel === 'Advanced'
                          ? 'bg-dangerSoft text-danger border-danger/30'
                          : course.difficultyLevel === 'Intermediate'
                          ? 'bg-accentSoft text-accent border-accent/30'
                          : 'bg-surface text-primary border-primary/30 font-bold'
                      }`}
                    >
                      {course.difficultyLevel}
                    </span>
                  </div>
                </div>

                {/* Course Content */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-textPrimary leading-snug group-hover:text-primary transition line-clamp-2">
                      {course.title}
                    </h3>
                    <p className="text-xs text-textSecondary mt-2 line-clamp-3 leading-relaxed">
                      {course.description}
                    </p>

                    {/* Competencies Tagged */}
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {course.competencyTags.map((tag) => (
                        <span
                          key={tag.id}
                          className="text-[10px] bg-surface2 text-textSecondary px-2 py-0.5 rounded font-medium border border-border"
                        >
                          {tag.competency.name} (L{tag.targetLevel})
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-border flex items-center justify-between text-xs text-textSecondary">
                    <span className="flex items-center gap-1 text-[11px]">
                      <Users className="w-3.5 h-3.5 text-textSecondary" />
                      {course.enrollmentCount || 0} Enrolled
                    </span>
                    <Link
                      to={`/courses/${course.id}`}
                      className="px-4 py-1.5 bg-primary hover:bg-primaryHover text-primaryContrast rounded-xl font-bold text-xs shadow-paper-sm transition"
                    >
                      View Syllabus &amp; Enroll
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
