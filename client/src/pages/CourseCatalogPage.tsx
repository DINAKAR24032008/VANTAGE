import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Course } from '../types';
import { Search, BookOpen, Users, Award, Filter, Sparkles, Layers } from 'lucide-react';

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
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <div>
          <span className="text-[10px] font-mono text-emerald-600 font-bold uppercase tracking-wider">
            Ministry of Earth Sciences Curriculum Library
          </span>
          <h1 className="text-3xl sm:text-4xl font-display italic text-slate-900 mt-1 tracking-tight">
            Training & Capacity Building Courses
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Certified programs spanning Atmospheric Sciences, Ocean Technology, Seismology, and Geoinformatics.
          </p>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
          <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by topic, model, sensor..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </form>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
            >
              <option value="all">All Disciplines</option>
              <option value="Atmospheric Sciences">Atmospheric Sciences</option>
              <option value="Ocean Sciences">Ocean Sciences</option>
              <option value="Seismology & Solid Earth">Seismology</option>
              <option value="Data Systems & Geoinformatics">Data Systems / HPC</option>
            </select>

            {/* Difficulty Filter */}
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
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
            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-xs text-slate-400">Loading courses...</p>
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-xs">
            No courses match the specified filters.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
              <div
                key={course.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col justify-between overflow-hidden group"
              >
                {/* Course Header Banner */}
                <div className="h-32 bg-slate-800 relative overflow-hidden">
                  {course.thumbnailUrl ? (
                    <img
                      src={course.thumbnailUrl}
                      alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-600">
                      <BookOpen className="w-12 h-12" />
                    </div>
                  )}
                  <div className="absolute top-3 right-3">
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded shadow ${
                        course.difficultyLevel === 'Advanced'
                          ? 'bg-rose-500 text-white'
                          : course.difficultyLevel === 'Intermediate'
                          ? 'bg-amber-500 text-white'
                          : 'bg-emerald-500 text-white'
                      }`}
                    >
                      {course.difficultyLevel}
                    </span>
                  </div>
                </div>

                {/* Course Content */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 leading-snug group-hover:text-emerald-600 transition line-clamp-2">
                      {course.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-2 line-clamp-3 leading-relaxed">
                      {course.description}
                    </p>

                    {/* Competencies Tagged */}
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {course.competencyTags.map((tag) => (
                        <span
                          key={tag.id}
                          className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium border border-slate-200/80"
                        >
                          {tag.competency.name} (L{tag.targetLevel})
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1 text-[11px]">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      {course.enrollmentCount || 0} Enrolled
                    </span>
                    <Link
                      to={`/courses/${course.id}`}
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs shadow transition"
                    >
                      View Syllabus & Enroll
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
