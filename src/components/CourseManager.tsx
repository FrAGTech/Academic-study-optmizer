/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Course } from '../types';
import { Plus, Trash2, Edit3, BookOpen, GraduationCap, Percent, Code, Save, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CourseManagerProps {
  courses: Course[];
  onAddCourse: (course: Course) => void;
  onDeleteCourse: (id: string) => void;
  onUpdateCourse: (course: Course) => void;
}

const PRESET_COLORS = [
  'bg-emerald-500 text-white border-emerald-600',
  'bg-indigo-500 text-white border-indigo-600',
  'bg-violet-500 text-white border-violet-600',
  'bg-sky-500 text-white border-sky-600',
  'bg-amber-500 text-white border-amber-600',
  'bg-rose-500 text-white border-rose-600',
  'bg-cyan-500 text-white border-cyan-600',
  'bg-fuchsia-500 text-white border-fuchsia-600',
];

const PRESET_HEX_COLORS = [
  '#10b981', // emerald
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#0ea5e9', // sky
  '#f59e0b', // amber
  '#f43f5e', // rose
  '#06b6d4', // cyan
  '#d946ef', // fuchsia
];

export default function CourseManager({
  courses,
  onAddCourse,
  onDeleteCourse,
  onUpdateCourse,
}: CourseManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [credits, setCredits] = useState(3);
  const [outline, setOutline] = useState('');
  const [objectives, setObjectives] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [targetGrade, setTargetGrade] = useState('A');
  const [color, setColor] = useState(PRESET_HEX_COLORS[0]);

  const resetForm = () => {
    setName('');
    setCode('');
    setCredits(3);
    setOutline('');
    setObjectives('');
    setDifficulty('medium');
    setTargetGrade('A');
    setColor(PRESET_HEX_COLORS[0]);
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsAdding(true);
    setEditingCourse(null);
  };

  const handleOpenEdit = (course: Course) => {
    setEditingCourse(course);
    setName(course.name);
    setCode(course.code);
    setCredits(course.credits);
    setOutline(course.outline);
    setObjectives(course.objectives);
    setDifficulty(course.difficulty);
    setTargetGrade(course.targetGrade);
    setColor(course.color);
    setIsAdding(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !code) return;

    const courseData: Course = {
      id: editingCourse ? editingCourse.id : Math.random().toString(36).substr(2, 9),
      name,
      code: code.toUpperCase(),
      credits: Number(credits),
      outline,
      objectives,
      difficulty,
      targetGrade,
      color,
    };

    if (editingCourse) {
      onUpdateCourse(courseData);
    } else {
      onAddCourse(courseData);
    }
    setIsAdding(false);
    setEditingCourse(null);
    resetForm();
  };

  return (
    <div className="space-y-6" id="course-manager-section">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-emerald-600" />
            My Courses ({courses.length})
          </h2>
          <p className="text-sm text-slate-500">Manage your semester courses, credits, objectives, and outlines</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl font-medium shadow-sm transition-colors cursor-pointer"
          id="btn-add-course"
        >
          <Plus className="w-4 h-4" /> Add Course
        </button>
      </div>

      {courses.length === 0 ? (
        <div className="bg-slate-50 border border-slate-200 border-dashed rounded-2xl p-12 text-center space-y-4">
          <GraduationCap className="w-12 h-12 text-slate-400 mx-auto" />
          <div className="space-y-1">
            <h3 className="font-semibold text-slate-700 text-lg">No courses registered yet</h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto">
              Add your university courses for the current semester to build your personalized smart study schedule.
            </p>
          </div>
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl font-medium shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Get Started
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" id="courses-grid">
          {courses.map((course) => (
            <div
              key={course.id}
              className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all relative flex flex-col justify-between"
              style={{ borderLeft: `5px solid ${course.color}` }}
            >
              <div>
                <div className="flex justify-between items-start gap-2">
                  <span className="text-xs font-mono px-2 py-1 rounded bg-slate-100 text-slate-600 border border-slate-200 uppercase">
                    {course.code}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(course)}
                      className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                      title="Edit course"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteCourse(course.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                      title="Delete course"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <h3 className="font-semibold text-slate-800 text-lg mt-3 line-clamp-1">{course.name}</h3>

                <div className="flex gap-2 mt-2 flex-wrap">
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-50 border border-slate-200 text-slate-600">
                    {course.credits} Credits
                  </span>
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${
                      course.difficulty === 'hard'
                        ? 'bg-rose-50 border border-rose-200 text-rose-600'
                        : course.difficulty === 'medium'
                        ? 'bg-amber-50 border border-amber-200 text-amber-600'
                        : 'bg-emerald-50 border border-emerald-200 text-emerald-600'
                    }`}
                  >
                    {course.difficulty} Difficulty
                  </span>
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-600">
                    Target: {course.targetGrade}
                  </span>
                </div>

                {course.outline && (
                  <div className="mt-4">
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Outline</h4>
                    <p className="text-xs text-slate-600 mt-1 line-clamp-2">{course.outline}</p>
                  </div>
                )}

                {course.objectives && (
                  <div className="mt-2">
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Objectives</h4>
                    <p className="text-xs text-slate-600 mt-1 line-clamp-2">{course.objectives}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Course Dialog */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-3xl w-full max-w-lg p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-4">
                <h3 className="text-xl font-bold text-slate-800">
                  {editingCourse ? 'Edit Course Details' : 'Add Semester Course'}
                </h3>
                <button
                  onClick={() => setIsAdding(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Course Code</label>
                    <input
                      type="text"
                      placeholder="e.g. CS101"
                      required
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500 focus:bg-white transition-all uppercase"
                    />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Credit Hours</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      required
                      value={credits}
                      onChange={(e) => setCredits(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Course Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Introduction to Computer Science"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Difficulty</label>
                    <select
                      value={difficulty}
                      onChange={(e) => setDifficulty(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                    >
                      <option value="easy">Easy (Requires Light Focus)</option>
                      <option value="medium">Medium (Requires Standard Study)</option>
                      <option value="hard">Hard (Requires Intensive Repetition)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Target Grade</label>
                    <select
                      value={targetGrade}
                      onChange={(e) => setTargetGrade(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                    >
                      <option value="A+">A+</option>
                      <option value="A">A</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B">B</option>
                      <option value="C">C</option>
                      <option value="Pass">Pass</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Syllabus Outline / Major Topics</label>
                  <textarea
                    rows={2}
                    placeholder="Briefly state covered chapters (e.g., Recursion, Arrays, Dynamic Programming)"
                    value={outline}
                    onChange={(e) => setOutline(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500 focus:bg-white transition-all resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Course Objectives / Outcomes</label>
                  <textarea
                    rows={2}
                    placeholder="What should you master? (e.g., Build sorting algorithms from scratch, Analyze runtime complexity)"
                    value={objectives}
                    onChange={(e) => setObjectives(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500 focus:bg-white transition-all resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-2">Visual Theme Color</label>
                  <div className="flex gap-2 flex-wrap">
                    {PRESET_HEX_COLORS.map((hex, idx) => (
                      <button
                        key={hex}
                        type="button"
                        onClick={() => setColor(hex)}
                        className={`w-8 h-8 rounded-full border-2 transition-transform ${
                          color === hex ? 'border-slate-800 scale-110' : 'border-transparent hover:scale-105'
                        }`}
                        style={{ backgroundColor: hex }}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsAdding(false)}
                    className="flex-1 border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium px-4 py-2.5 rounded-xl transition-colors cursor-pointer text-center"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-4 py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    <Save className="w-4 h-4" /> Save Course
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
