/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { TimetableEvent, Course } from '../types';
import { Plus, Trash2, Calendar, MapPin, Sparkles, AlertCircle, X, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface TimetableManagerProps {
  timetable: TimetableEvent[];
  courses: Course[];
  onAddEvent: (event: TimetableEvent) => void;
  onDeleteEvent: (id: string) => void;
  onBulkImport: (events: TimetableEvent[]) => void;
}

const DAYS: ('Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday')[] = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
];

export default function TimetableManager({
  timetable,
  courses,
  onAddEvent,
  onDeleteEvent,
  onBulkImport,
}: TimetableManagerProps) {
  const [isAdding, setIsAdding] = useState(false);

  // Form states
  const [courseId, setCourseId] = useState('');
  const [title, setTitle] = useState('');
  const [dayOfWeek, setDayOfWeek] = useState<'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday'>('Monday');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:30');
  const [location, setLocation] = useState('');
  const [type, setType] = useState<'lecture' | 'lab' | 'tutorial' | 'other'>('lecture');

  const handleQuickImport = () => {
    if (courses.length === 0) {
      alert("Please add at least one course first to import a sample timetable.");
      return;
    }

    // Generate high quality conflict-free lectures/labs for their existing courses
    const generated: TimetableEvent[] = [];
    const classTimes = [
      { start: '09:00', end: '10:30' },
      { start: '11:00', end: '12:30' },
      { start: '14:00', end: '15:30' },
    ];

    courses.forEach((course, index) => {
      // Create a lecture
      const lecDay = DAYS[index % 5]; // distribute across Mon-Fri
      const lecTime = classTimes[index % classTimes.length];
      
      generated.push({
        id: `sample-lec-${course.id}`,
        courseId: course.id,
        title: `${course.code} Lecture`,
        dayOfWeek: lecDay,
        startTime: lecTime.start,
        endTime: lecTime.end,
        location: `Building ${Math.floor(Math.random() * 3) + 1}, Room ${Math.floor(Math.random() * 400) + 100}`,
        type: 'lecture',
      });

      // If hard or 4+ credits, add a lab
      if (course.difficulty === 'hard' || course.credits >= 4) {
        const labDay = DAYS[(index + 2) % 5];
        generated.push({
          id: `sample-lab-${course.id}`,
          courseId: course.id,
          title: `${course.code} Practical Lab`,
          dayOfWeek: labDay,
          startTime: '16:00',
          endTime: '17:30',
          location: `Science Lab ${Math.floor(Math.random() * 5) + 1}`,
          type: 'lab',
        });
      }
    });

    onBulkImport(generated);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    // Validate times
    if (startTime >= endTime) {
      alert("End time must be after start time!");
      return;
    }

    const newEvent: TimetableEvent = {
      id: Math.random().toString(36).substr(2, 9),
      courseId,
      title,
      dayOfWeek,
      startTime,
      endTime,
      location,
      type,
    };

    onAddEvent(newEvent);
    setIsAdding(false);
    // Reset form
    setTitle('');
    setLocation('');
    setCourseId('');
  };

  // Helper to get course color
  const getCourseColor = (cId: string) => {
    const course = courses.find(c => c.id === cId);
    return course ? course.color : '#64748b'; // default slate color
  };

  const getCourseCode = (cId: string) => {
    const course = courses.find(c => c.id === cId);
    return course ? course.code : '';
  };

  return (
    <div className="space-y-6" id="timetable-manager-section">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <Calendar className="w-6 h-6 text-indigo-600" />
            University Timetable
          </h2>
          <p className="text-sm text-slate-500">Log official lectures, labs, and tutorials to prevent study schedule overlaps</p>
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={handleQuickImport}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 border border-indigo-200 hover:border-indigo-300 bg-indigo-50 hover:bg-indigo-100/80 text-indigo-700 px-4 py-2 rounded-xl font-medium transition-colors cursor-pointer"
            id="btn-quick-import"
            title="Auto-fill sample university class hours"
          >
            <Sparkles className="w-4 h-4 text-indigo-500" /> Quick Autocomplete
          </button>
          <button
            onClick={() => setIsAdding(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl font-medium shadow-sm transition-colors cursor-pointer"
            id="btn-add-class"
          >
            <Plus className="w-4 h-4" /> Add Class Hour
          </button>
        </div>
      </div>

      {timetable.length === 0 ? (
        <div className="bg-slate-50 border border-slate-200 border-dashed rounded-2xl p-12 text-center space-y-4">
          <Calendar className="w-12 h-12 text-slate-400 mx-auto" />
          <div className="space-y-1">
            <h3 className="font-semibold text-slate-700 text-lg">No classes entered yet</h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto">
              Add your official classes or click <strong className="text-indigo-600">Quick Autocomplete</strong> to instantly mock the semester lectures for your courses.
            </p>
          </div>
          <div className="flex justify-center gap-2">
            <button
              onClick={handleQuickImport}
              className="inline-flex items-center gap-2 border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-4 py-2 rounded-xl font-medium transition-colors cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-indigo-500" /> Sample Autocomplete
            </button>
            <button
              onClick={() => setIsAdding(true)}
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl font-medium shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add Manually
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-7 gap-4" id="timetable-view">
          {/* Day Columns */}
          {DAYS.map((day) => {
            const dayEvents = timetable.filter(e => e.dayOfWeek === day)
              .sort((a, b) => a.startTime.localeCompare(b.startTime));

            return (
              <div key={day} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex flex-col min-h-[180px]">
                <h3 className="font-semibold text-slate-700 text-sm border-b border-slate-100 pb-2 mb-3 text-center">
                  {day}
                </h3>

                {dayEvents.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center py-6">
                    <span className="text-xs text-slate-400 italic">No classes</span>
                  </div>
                ) : (
                  <div className="space-y-2.5 flex-1">
                    {dayEvents.map((event) => (
                      <div
                        key={event.id}
                        className="p-2.5 rounded-xl border relative group transition-all"
                        style={{
                          backgroundColor: `${getCourseColor(event.courseId)}15`,
                          borderColor: `${getCourseColor(event.courseId)}40`,
                          borderLeft: `4px solid ${getCourseColor(event.courseId)}`,
                        }}
                      >
                        <button
                          onClick={() => onDeleteEvent(event.id)}
                          className="absolute right-1 top-1 p-1 text-slate-400 hover:text-rose-600 rounded-md hover:bg-slate-100/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                          title="Delete class slot"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className="text-[9px] font-bold px-1.5 py-0.5 rounded-sm text-white uppercase"
                            style={{ backgroundColor: getCourseColor(event.courseId) }}
                          >
                            {getCourseCode(event.courseId) || "LEC"}
                          </span>
                          <span className="text-[10px] font-semibold text-slate-500 uppercase">
                            {event.type}
                          </span>
                        </div>

                        <h4 className="text-xs font-semibold text-slate-800 mt-1 line-clamp-1 pr-4">
                          {event.title}
                        </h4>

                        <p className="text-[11px] font-medium text-slate-600 mt-1">
                          {event.startTime} - {event.endTime}
                        </p>

                        {event.location && (
                          <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-1 font-sans">
                            <MapPin className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{event.location}</span>
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add Class Hour Modal */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-slate-100"
            >
              <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-4">
                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-indigo-600" />
                  Add Lecture or Lab Hour
                </h3>
                <button
                  onClick={() => setIsAdding(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Associated Course</label>
                  <select
                    value={courseId}
                    onChange={(e) => {
                      setCourseId(e.target.value);
                      const course = courses.find(c => c.id === e.target.value);
                      if (course && !title) {
                        setTitle(`${course.name} Lecture`);
                      }
                    }}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                  >
                    <option value="">-- Choose Course --</option>
                    {courses.map(c => (
                      <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Class Name / Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Lab 3: Sorting"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Day of Week</label>
                    <select
                      value={dayOfWeek}
                      onChange={(e) => setDayOfWeek(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                    >
                      {DAYS.map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Type</label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                    >
                      <option value="lecture">Lecture</option>
                      <option value="lab">Lab / Practical</option>
                      <option value="tutorial">Tutorial</option>
                      <option value="other">Seminar / Other</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Start Time</label>
                    <input
                      type="time"
                      required
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">End Time</label>
                    <input
                      type="time"
                      required
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Location / Classroom</label>
                  <input
                    type="text"
                    placeholder="e.g. Science Building, Room 204"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                  />
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
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    Save Slot
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
