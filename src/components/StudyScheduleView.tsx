/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { StudyScheduleEvent, Course, TimetableEvent } from '../types';
import { 
  Calendar, Clock, Sparkles, CheckCircle2, RotateCcw, 
  Settings2, Download, Check, RefreshCw, Moon, Sun, Sunrise, Coffee, HelpCircle, AlertCircle,
  CalendarRange
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface StudyScheduleViewProps {
  schedule: StudyScheduleEvent[];
  courses: Course[];
  timetable: TimetableEvent[];
  onGenerateSchedule: (preferences: any) => Promise<void>;
  onToggleComplete: (id: string) => void;
  onResetSchedule: () => void;
  isGenerating: boolean;
  onSyncGoogleCalendar?: () => void;
}

const DAYS: ('Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday')[] = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
];

export default function StudyScheduleView({
  schedule,
  courses,
  timetable,
  onGenerateSchedule,
  onToggleComplete,
  onResetSchedule,
  isGenerating,
  onSyncGoogleCalendar,
}: StudyScheduleViewProps) {
  const [showSettings, setShowSettings] = useState(false);
  
  // Schedule preferences state
  const [dailyHoursTarget, setDailyHoursTarget] = useState(3);
  const [timeOfDayPreference, setTimeOfDayPreference] = useState<'Morning' | 'Afternoon' | 'Evening'>('Evening');
  const [includeWeekends, setIncludeWeekends] = useState(true);
  const [pace, setPace] = useState<'balanced' | 'focused' | 'intensive'>('balanced');

  const [activeDay, setActiveDay] = useState<'All' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday'>('All');

  const handleGenerate = async () => {
    await onGenerateSchedule({
      dailyHoursTarget,
      timeOfDayPreference,
      includeWeekends,
      pace,
    });
  };

  // Helper: Course properties mapping
  const getCourse = (cId: string): Course | undefined => {
    return courses.find(c => c.id === cId);
  };

  const getCourseColor = (cId: string) => {
    if (cId === 'break') return '#10b981'; // well-being green
    const c = getCourse(cId);
    return c ? c.color : '#6366f1';
  };

  // Build and download standard .ics calendar file
  const handleExportICS = () => {
    if (schedule.length === 0) return;

    // We'll map the next occurring Monday to Sunday to dates
    const today = new Date();
    const nextMonday = new Date();
    nextMonday.setDate(today.getDate() + ((1 + 7 - today.getDay()) % 7 || 7)); // Next Monday

    const dayOffsets: Record<string, number> = {
      'Monday': 0,
      'Tuesday': 1,
      'Wednesday': 2,
      'Thursday': 3,
      'Friday': 4,
      'Saturday': 5,
      'Sunday': 6,
    };

    let icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Academic Study Optimizer//NONSGML Study Plan//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
    ].join('\r\n') + '\r\n';

    schedule.forEach((event) => {
      const offset = dayOffsets[event.dayOfWeek] ?? 0;
      const eventDate = new Date(nextMonday);
      eventDate.setDate(nextMonday.getDate() + offset);

      // Extract times
      const [sh, sm] = event.startTime.split(':').map(Number);
      const [eh, em] = event.endTime.split(':').map(Number);

      const startDateTime = new Date(eventDate);
      startDateTime.setHours(sh, sm, 0, 0);

      const endDateTime = new Date(eventDate);
      endDateTime.setHours(eh, em, 0, 0);

      // Date format YYYYMMDDTHHMMSS
      const formatICSDate = (d: Date) => {
        const pad = (n: number) => n.toString().padStart(2, '0');
        return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
      };

      const courseCode = event.courseId === 'break' ? 'WELLBEING' : (getCourse(event.courseId)?.code || 'STUDY');
      const cleanDescription = (event.focusTopic || 'Rest, hydrate, and relax to avoid burnout.').replace(/,/g, '\\,').replace(/;/g, '\\;');

      icsContent += [
        'BEGIN:VEVENT',
        `UID:${event.id}@studyoptimizer.app`,
        `DTSTAMP:${formatICSDate(new Date())}Z`,
        `DTSTART;TZID=Local:${formatICSDate(startDateTime)}`,
        `DTEND;TZID=Local:${formatICSDate(endDateTime)}`,
        `SUMMARY:[${courseCode}] ${event.title}`,
        `DESCRIPTION:${cleanDescription}`,
        'STATUS:CONFIRMED',
        'BEGIN:VALARM',
        'TRIGGER:-PT10M',
        'ACTION:DISPLAY',
        'DESCRIPTION:Reminder: Your study session starts in 10 minutes.',
        'END:VALARM',
        'END:VEVENT',
      ].join('\r\n') + '\r\n';
    });

    icsContent += 'END:VCALENDAR';

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Academic_Study_Routine.ics');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredEvents = schedule.filter(event => activeDay === 'All' || event.dayOfWeek === activeDay);

  return (
    <div className="space-y-6 animate-fade-in" id="study-schedule-section">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-emerald-500" />
            AI Optimized Study Schedule
          </h2>
          <p className="text-sm text-slate-500">Your custom weekly roadmap including prioritized subjects and restorative breaks</p>
        </div>

        {courses.length > 0 && (
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2.5 rounded-xl border transition-colors cursor-pointer ${
                showSettings 
                  ? 'border-emerald-600 bg-emerald-50 text-emerald-700' 
                  : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
              }`}
              title="Adjust schedule preferences"
            >
              <Settings2 className="w-5 h-5" />
            </button>

            {schedule.length > 0 && (
              <>
                {onSyncGoogleCalendar && (
                  <button
                    onClick={onSyncGoogleCalendar}
                    className="flex items-center gap-2 border border-indigo-200 hover:border-indigo-300 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-4 py-2 rounded-xl font-medium shadow-xs transition-colors cursor-pointer"
                    title="Sync dynamically to your Google Calendar"
                    id="btn-sync-gcal"
                  >
                    <CalendarRange className="w-4 h-4" /> Sync to Google Calendar
                  </button>
                )}
                <button
                  onClick={handleExportICS}
                  className="flex items-center gap-2 border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-xl font-medium shadow-xs transition-colors cursor-pointer"
                  title="Export to Google Calendar or Apple Calendar (.ics)"
                  id="btn-export-ics"
                >
                  <Download className="w-4 h-4" /> Export Calendar
                </button>
                <button
                  onClick={onResetSchedule}
                  className="flex items-center gap-2 border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-500 hover:text-rose-600 px-4 py-2 rounded-xl font-medium transition-colors cursor-pointer"
                  title="Wipe current schedule and re-generate"
                  id="btn-reset-schedule"
                >
                  <RotateCcw className="w-4 h-4" /> Reset
                </button>
              </>
            )}

            {schedule.length === 0 && (
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white px-5 py-2.5 rounded-xl font-semibold shadow-md transition-colors cursor-pointer"
                id="btn-generate-schedule"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Thinking...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" /> Generate Study Schedule
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Course warnings */}
      {courses.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex gap-4 items-start">
          <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-semibold text-amber-800">Add courses first!</h4>
            <p className="text-sm text-amber-700">
              Before the AI can optimize your study schedule, please register your courses under the <strong>Courses</strong> tab so we know your credits, difficult areas, and outline contents.
            </p>
          </div>
        </div>
      )}

      {/* Advanced AI Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-slate-50 border border-slate-200 rounded-2xl p-5 overflow-hidden"
          >
            <h3 className="font-bold text-slate-800 text-base mb-4 flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-emerald-600" />
              Schedule Personalization Preferences
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Target Study Hours / Day</label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="1"
                    max="6"
                    value={dailyHoursTarget}
                    onChange={(e) => setDailyHoursTarget(Number(e.target.value))}
                    className="w-full accent-emerald-600 cursor-pointer"
                  />
                  <span className="text-sm font-bold text-slate-700 w-12 text-center bg-white border border-slate-200 rounded-lg py-1 px-1.5 shadow-3xs">
                    {dailyHoursTarget} hrs
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Peak Concentration Time</label>
                <div className="grid grid-cols-3 gap-1 bg-white border border-slate-200 rounded-xl p-1">
                  {[
                    { value: 'Morning', icon: Sunrise },
                    { value: 'Afternoon', icon: Sun },
                    { value: 'Evening', icon: Moon }
                  ].map(({ value, icon: Icon }) => (
                    <button
                      key={value}
                      onClick={() => setTimeOfDayPreference(value as any)}
                      className={`py-1.5 px-2 rounded-lg text-xs font-medium flex flex-col items-center gap-1 transition-all cursor-pointer ${
                        timeOfDayPreference === value
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{value}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Include Weekends?</label>
                <div className="flex items-center gap-2 mt-1.5">
                  <input
                    type="checkbox"
                    id="weekend-checkbox"
                    checked={includeWeekends}
                    onChange={(e) => setIncludeWeekends(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 accent-emerald-600 cursor-pointer"
                  />
                  <label htmlFor="weekend-checkbox" className="text-sm font-medium text-slate-700 cursor-pointer select-none">
                    Distribute across Saturdays & Sundays
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Intensity / Pace</label>
                <select
                  value={pace}
                  onChange={(e) => setPace(e.target.value as any)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 transition-all cursor-pointer"
                >
                  <option value="balanced">Balanced Practice (Steady Spacing)</option>
                  <option value="focused">Focused Sprint (Consolidated blocks)</option>
                  <option value="intensive">Intensive Mastering (High frequency)</option>
                </select>
              </div>
            </div>

            {schedule.length > 0 && (
              <div className="mt-5 pt-4 border-t border-slate-200 flex justify-end">
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl font-medium shadow-xs transition-colors cursor-pointer"
                >
                  {isGenerating ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  Re-generate Study Schedule
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Schedule Container */}
      {courses.length > 0 && schedule.length === 0 && (
        <div className="bg-slate-50 border border-slate-200 border-dashed rounded-3xl p-12 text-center space-y-5">
          <div className="w-16 h-16 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
            <Sparkles className="w-8 h-8 text-emerald-600 animate-pulse" />
          </div>
          <div className="space-y-2">
            <h3 className="font-bold text-slate-800 text-xl">Generate your personalized weekly routine</h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              Our Google AI model will map out ideal study windows, avoid classes in your official timetable, and automatically budget breaks to secure academic excellence without burnout.
            </p>
          </div>
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white px-6 py-3 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all cursor-pointer"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" /> Cooking your optimal schedule...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" /> Let's Optimize!
              </>
            )}
          </button>
        </div>
      )}

      {schedule.length > 0 && (
        <div className="space-y-4">
          {/* Day Selector Ribbon */}
          <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-none border-b border-slate-100">
            <button
              onClick={() => setActiveDay('All')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeDay === 'All'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'bg-slate-50 text-slate-500 hover:text-slate-800 hover:bg-slate-100'
              }`}
            >
              Show All Week
            </button>
            {DAYS.map((day) => {
              const count = schedule.filter(e => e.dayOfWeek === day).length;
              return (
                <button
                  key={day}
                  onClick={() => setActiveDay(day)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                    activeDay === day
                      ? 'bg-slate-800 text-white shadow-xs'
                      : 'bg-slate-50 text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                  }`}
                >
                  <span>{day}</span>
                  {count > 0 && (
                    <span className={`text-[10px] rounded-full px-1.5 py-0.1 font-bold ${
                      activeDay === day ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-600'
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Schedule Events List */}
          {filteredEvents.length === 0 ? (
            <div className="bg-slate-50 rounded-2xl p-12 text-center text-slate-400 italic text-sm">
              No sessions scheduled for this day. Rest and rejuvenate!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="schedule-cards-grid">
              {filteredEvents.map((event) => {
                const isBreak = event.courseId === 'break';
                const courseObj = getCourse(event.courseId);
                const isCompleted = !!event.isCompleted;

                return (
                  <div
                    key={event.id}
                    className={`bg-white border rounded-2xl p-4 shadow-3xs flex justify-between items-start transition-all relative ${
                      isCompleted ? 'border-slate-200 opacity-70 bg-slate-50/50' : 'border-slate-200 hover:shadow-xs'
                    }`}
                    style={{ borderLeft: `5px solid ${getCourseColor(event.courseId)}` }}
                  >
                    <div className="space-y-2 flex-1 pr-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-md text-white uppercase ${
                          isBreak ? 'bg-emerald-500' : ''
                        }`}
                        style={{ backgroundColor: isBreak ? undefined : getCourseColor(event.courseId) }}
                        >
                          {isBreak ? 'Wellbeing' : (courseObj?.code || 'STUDY')}
                        </span>
                        
                        <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {event.startTime} - {event.endTime} ({event.durationMinutes}m)
                        </span>

                        <span className="text-[10px] font-medium bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-sm uppercase">
                          {event.dayOfWeek}
                        </span>
                      </div>

                      <h4 className={`font-bold text-slate-800 text-sm md:text-base ${isCompleted ? 'line-through text-slate-400' : ''}`}>
                        {event.title}
                      </h4>

                      {event.focusTopic && (
                        <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Target Objective</span>
                          <p className="text-xs text-slate-600 mt-0.5 font-medium leading-relaxed">
                            {event.focusTopic}
                          </p>
                        </div>
                      )}

                      {isBreak && (
                        <div className="flex items-center gap-2 text-xs text-emerald-600 font-semibold bg-emerald-50 border border-emerald-100 rounded-xl p-2.5">
                          <Coffee className="w-4 h-4 flex-shrink-0" />
                          <span>Cognitive science suggests regular 15m breaks boost recall by 25%. Rest fully!</span>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => onToggleComplete(event.id)}
                      className={`p-2 rounded-xl transition-all border cursor-pointer flex-shrink-0 ${
                        isCompleted
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                          : 'bg-white border-slate-200 hover:border-slate-300 text-slate-400 hover:text-slate-600'
                      }`}
                      title={isCompleted ? "Mark session incompleted" : "Log as completed"}
                    >
                      {isCompleted ? <Check className="w-5 h-5 stroke-[3]" /> : <CheckCircle2 className="w-5 h-5" />}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
