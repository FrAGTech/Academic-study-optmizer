/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Course, StudyProgressLog, StudyScheduleEvent } from '../types';
import { Play, Calendar, Star, BookOpen, Trash2, Check, Clock, Plus, HelpCircle } from 'lucide-react';
import { motion } from 'motion/react';

interface ProgressTrackerProps {
  progressLogs: StudyProgressLog[];
  courses: Course[];
  schedule: StudyScheduleEvent[];
  onAddLog: (log: StudyProgressLog) => void;
  onDeleteLog: (id: string) => void;
}

export default function ProgressTracker({
  progressLogs,
  courses,
  schedule,
  onAddLog,
  onDeleteLog,
}: ProgressTrackerProps) {
  const [courseId, setCourseId] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [focusTopic, setFocusTopic] = useState('');
  const [masteryRating, setMasteryRating] = useState(3);
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const handleSubmitLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseId || !focusTopic) {
      alert("Please select a course and describe the focus topic.");
      return;
    }

    const newLog: StudyProgressLog = {
      id: Math.random().toString(36).substr(2, 9),
      eventId: 'manual', // ad-hoc
      courseId,
      date,
      durationMinutes: Number(durationMinutes),
      focusTopic,
      masteryRating,
      notes,
    };

    onAddLog(newLog);

    // Reset form
    setFocusTopic('');
    setNotes('');
    setDurationMinutes(60);
    setMasteryRating(3);
  };

  const getCourseCode = (cId: string) => {
    return courses.find(c => c.id === cId)?.code || 'OTHER';
  };

  const getCourseName = (cId: string) => {
    return courses.find(c => c.id === cId)?.name || 'Ad-Hoc Session';
  };

  const getCourseColor = (cId: string) => {
    return courses.find(c => c.id === cId)?.color || '#64748b';
  };

  return (
    <div className="space-y-6" id="progress-tracker-section">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Log manual study session */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs h-fit">
          <div className="mb-4">
            <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
              <Play className="w-5 h-5 text-emerald-600 fill-emerald-600" />
              Log Study Session
            </h3>
            <p className="text-xs text-slate-500">Record a study session manually to update your progress dashboard metrics</p>
          </div>

          <form onSubmit={handleSubmitLog} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Select Course</label>
              <select
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
              >
                <option value="">-- Choose Course --</option>
                {courses.map(c => (
                  <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Date</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Duration (Mins)</label>
                <input
                  type="number"
                  min="5"
                  max="480"
                  required
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">What did you study?</label>
              <input
                type="text"
                placeholder="e.g. Practiced 10 integration integrals"
                required
                value={focusTopic}
                onChange={(e) => setFocusTopic(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Rate Understanding / Mastery</label>
              <div className="flex items-center gap-2 mt-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setMasteryRating(star)}
                    className="p-1 transition-transform hover:scale-110 cursor-pointer"
                  >
                    <Star
                      className={`w-7 h-7 ${
                        star <= masteryRating ? 'text-amber-400 fill-amber-400' : 'text-slate-200 hover:text-amber-300'
                      }`}
                    />
                  </button>
                ))}
                <span className="text-xs font-bold text-slate-500 ml-2">
                  {masteryRating === 5 ? 'Excellent 🌟' : masteryRating === 4 ? 'Great 👍' : masteryRating === 3 ? 'Good Ok' : masteryRating === 2 ? 'Shaky' : 'Need help 🆘'}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Study Reflection Notes</label>
              <textarea
                rows={2}
                placeholder="Write any formulas, sticking points, or details for next time..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500 focus:bg-white transition-all resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={courses.length === 0}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-semibold py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              Log Session
            </button>
          </form>
        </div>

        {/* Right Side: Log list */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-5 shadow-xs">
          <div className="mb-4">
            <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-slate-700" />
              Logged Session History ({progressLogs.length})
            </h3>
            <p className="text-xs text-slate-500">Timeline of completed study slots and reflections</p>
          </div>

          {progressLogs.length === 0 ? (
            <div className="bg-slate-50 rounded-2xl p-12 text-center text-slate-400 italic text-sm space-y-2">
              <Clock className="w-10 h-10 mx-auto text-slate-300" />
              <p>No study sessions have been logged yet.</p>
              <p className="text-xs text-slate-400">Complete scheduled routine events or log ad-hoc studies using the left panel.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {progressLogs.slice().reverse().map((log) => (
                <div
                  key={log.id}
                  className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4 flex justify-between items-start hover:border-slate-200 transition-colors"
                >
                  <div className="space-y-2 flex-1 pr-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className="text-[9px] font-bold px-1.5 py-0.5 rounded-md text-white uppercase"
                        style={{ backgroundColor: getCourseColor(log.courseId) }}
                      >
                        {getCourseCode(log.courseId)}
                      </span>
                      <span className="text-xs font-semibold text-slate-700">
                        {getCourseName(log.courseId)}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {log.date}
                      </span>
                      <span className="text-[10px] bg-slate-100 text-slate-600 border border-slate-200 px-1.5 py-0.2 rounded-full flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {log.durationMinutes} mins
                      </span>
                    </div>

                    <h4 className="font-semibold text-slate-800 text-sm">
                      {log.focusTopic}
                    </h4>

                    {log.notes && (
                      <p className="text-xs text-slate-600 bg-white border border-slate-100 p-2.5 rounded-xl font-medium leading-relaxed">
                        {log.notes}
                      </p>
                    )}

                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Self Mastery:</span>
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-3.5 h-3.5 ${
                              s <= log.masteryRating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => onDeleteLog(log.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-white rounded-lg border border-transparent hover:border-slate-100 transition-colors cursor-pointer"
                    title="Delete log entry"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
