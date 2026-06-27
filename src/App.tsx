/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Course, TimetableEvent, StudyScheduleEvent, StudyProgressLog, WellbeingLog } from './types';
import Dashboard from './components/Dashboard';
import CourseManager from './components/CourseManager';
import TimetableManager from './components/TimetableManager';
import StudyScheduleView from './components/StudyScheduleView';
import ProgressTracker from './components/ProgressTracker';
import WellbeingSection from './components/WellbeingSection';
import AlertsManager from './components/AlertsManager';
import CalendarSyncManager from './components/CalendarSyncManager';
import { 
  Sparkles, BookOpen, Calendar, Clock, BarChart2, Heart, BellRing, ClipboardList,
  GraduationCap, Info, ChevronRight, Check, Play, CalendarRange
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Seeding standard high-quality mockup data for first load
const DEFAULT_COURSES: Course[] = [
  {
    id: 'c1',
    name: 'Analysis of Algorithms',
    code: 'CS301',
    credits: 4,
    outline: 'Divide and conquer, greedy paradigms, dynamic programming, NP-completeness, graph traversals.',
    objectives: 'Design optimal solutions, analyze time/space asymptotic complexity, prove correctness.',
    difficulty: 'hard',
    targetGrade: 'A',
    color: '#6366f1', // Indigo
  },
  {
    id: 'c2',
    name: 'Linear Algebra & Diff Equations',
    code: 'MATH205',
    credits: 3,
    outline: 'Eigenvalues, vector spaces, matrix factorizations, systems of differential equations.',
    objectives: 'Solve complex linear systems, model dynamical systems using matrix math.',
    difficulty: 'medium',
    targetGrade: 'A',
    color: '#0ea5e9', // Sky
  },
  {
    id: 'c3',
    name: 'Advanced Classical Mechanics',
    code: 'PHYS112',
    credits: 3,
    outline: 'Lagrangian dynamics, Newtonian systems, central forces, rigid body rotation.',
    objectives: 'Formulate equations of motion for complex classical systems, understand angular momentum.',
    difficulty: 'hard',
    targetGrade: 'A-',
    color: '#f43f5e', // Rose
  },
];

const DEFAULT_TIMETABLE: TimetableEvent[] = [
  {
    id: 't1',
    courseId: 'c1',
    title: 'CS301 - Algorithms Lecture',
    dayOfWeek: 'Monday',
    startTime: '10:00',
    endTime: '11:30',
    location: 'Tech Hall, Room 302',
    type: 'lecture',
  },
  {
    id: 't2',
    courseId: 'c2',
    title: 'MATH205 - Linear Algebra Lecture',
    dayOfWeek: 'Wednesday',
    startTime: '10:00',
    endTime: '11:30',
    location: 'Math Tower, Room 104',
    type: 'lecture',
  },
  {
    id: 't3',
    courseId: 'c3',
    title: 'PHYS112 - Classical Mechanics Lecture',
    dayOfWeek: 'Tuesday',
    startTime: '14:00',
    endTime: '15:30',
    location: 'Physics Wing, Lab 1A',
    type: 'lecture',
  },
];

const DEFAULT_SCHEDULE: StudyScheduleEvent[] = [
  {
    id: 's1',
    courseId: 'c1',
    title: 'Review: Dynamic Programming',
    dayOfWeek: 'Monday',
    startTime: '14:00',
    endTime: '15:30',
    focusTopic: 'Solve Knapsack problem variations and analyze overlapping subproblems.',
    isCompleted: true,
    type: 'study',
    durationMinutes: 90,
  },
  {
    id: 's-break-1',
    courseId: 'break',
    title: 'Mindfulness Break & Tea',
    dayOfWeek: 'Monday',
    startTime: '15:30',
    endTime: '15:45',
    focusTopic: 'Rest eyes and stretch to lower cortisol.',
    isCompleted: true,
    type: 'break',
    durationMinutes: 15,
  },
  {
    id: 's2',
    courseId: 'c3',
    title: 'Physics Equations practice',
    dayOfWeek: 'Tuesday',
    startTime: '16:00',
    endTime: '17:30',
    focusTopic: 'Derive equations of motion using Lagrangian coordinates.',
    isCompleted: false,
    type: 'study',
    durationMinutes: 90,
  },
  {
    id: 's3',
    courseId: 'c2',
    title: 'Linear Algebra Matrix math',
    dayOfWeek: 'Wednesday',
    startTime: '14:00',
    endTime: '15:30',
    focusTopic: 'Review Eigenvalues and solve system matrix transformation sets.',
    isCompleted: true,
    type: 'study',
    durationMinutes: 90,
  },
  {
    id: 's4',
    courseId: 'c1',
    title: 'Practice: Graph Traversals',
    dayOfWeek: 'Thursday',
    startTime: '13:00',
    endTime: '14:30',
    focusTopic: 'Solve DFS/BFS pathing variations on LeetCode.',
    isCompleted: false,
    type: 'study',
    durationMinutes: 90,
  },
];

const DEFAULT_PROGRESS_LOGS: StudyProgressLog[] = [
  {
    id: 'log1',
    eventId: 's1',
    courseId: 'c1',
    date: '2026-06-22',
    durationMinutes: 90,
    focusTopic: 'Dynamic Programming: Knapsack solutions',
    masteryRating: 4,
    notes: 'Understood standard memoization state transitions. Need more practice on subset sum variation.',
  },
  {
    id: 'log2',
    eventId: 's3',
    courseId: 'c2',
    date: '2026-06-24',
    durationMinutes: 90,
    focusTopic: 'Linear Algebra: Eigenvalues',
    masteryRating: 5,
    notes: 'Very clear. Diagonalization properties make absolute sense.',
  },
  {
    id: 'log-adhoc',
    eventId: 'manual',
    courseId: 'c3',
    date: '2026-06-25',
    durationMinutes: 60,
    focusTopic: 'Formulated constraints for pendulum problem',
    masteryRating: 3,
    notes: 'Struggled a bit with degree of freedom coordinates. Ask professor during office hours.',
  },
];

const DEFAULT_WELLBEING_LOGS: WellbeingLog[] = [
  { date: '2026-06-21', waterIntakeCups: 6, breaksTaken: 2, moodRating: 3, sleepHours: 7.5 },
  { date: '2026-06-22', waterIntakeCups: 8, breaksTaken: 3, moodRating: 4, sleepHours: 8.0 },
  { date: '2026-06-23', waterIntakeCups: 5, breaksTaken: 1, moodRating: 2, sleepHours: 6.5 },
  { date: '2026-06-24', waterIntakeCups: 7, breaksTaken: 4, moodRating: 4, sleepHours: 7.5 },
  { date: '2026-06-25', waterIntakeCups: 8, breaksTaken: 3, moodRating: 5, sleepHours: 8.5 },
  { date: '2026-06-26', waterIntakeCups: 6, breaksTaken: 2, moodRating: 3, sleepHours: 7.0 },
  { date: '2026-06-27', waterIntakeCups: 4, breaksTaken: 1, moodRating: 3, sleepHours: 7.0 },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'schedule' | 'timetable' | 'courses' | 'progress' | 'wellbeing' | 'alerts' | 'calendar'>('dashboard');

  // Application State
  const [courses, setCourses] = useState<Course[]>(() => {
    const saved = localStorage.getItem('study_opt_courses');
    return saved ? JSON.parse(saved) : DEFAULT_COURSES;
  });

  const [timetable, setTimetable] = useState<TimetableEvent[]>(() => {
    const saved = localStorage.getItem('study_opt_timetable');
    return saved ? JSON.parse(saved) : DEFAULT_TIMETABLE;
  });

  const [schedule, setSchedule] = useState<StudyScheduleEvent[]>(() => {
    const saved = localStorage.getItem('study_opt_schedule');
    return saved ? JSON.parse(saved) : DEFAULT_SCHEDULE;
  });

  const [progressLogs, setProgressLogs] = useState<StudyProgressLog[]>(() => {
    const saved = localStorage.getItem('study_opt_progress_logs');
    return saved ? JSON.parse(saved) : DEFAULT_PROGRESS_LOGS;
  });

  const [wellbeingLogs, setWellbeingLogs] = useState<WellbeingLog[]>(() => {
    const saved = localStorage.getItem('study_opt_wellbeing_logs');
    return saved ? JSON.parse(saved) : DEFAULT_WELLBEING_LOGS;
  });

  const [isGeneratingSchedule, setIsGeneratingSchedule] = useState(false);

  // Synchronize state changes to localStorage
  useEffect(() => {
    localStorage.setItem('study_opt_courses', JSON.stringify(courses));
  }, [courses]);

  useEffect(() => {
    localStorage.setItem('study_opt_timetable', JSON.stringify(timetable));
  }, [timetable]);

  useEffect(() => {
    localStorage.setItem('study_opt_schedule', JSON.stringify(schedule));
  }, [schedule]);

  useEffect(() => {
    localStorage.setItem('study_opt_progress_logs', JSON.stringify(progressLogs));
  }, [progressLogs]);

  useEffect(() => {
    localStorage.setItem('study_opt_wellbeing_logs', JSON.stringify(wellbeingLogs));
  }, [wellbeingLogs]);

  // Actions
  const handleAddCourse = (course: Course) => {
    setCourses(prev => [...prev, course]);
  };

  const handleDeleteCourse = (id: string) => {
    setCourses(prev => prev.filter(c => c.id !== id));
    // Clean related timetable / schedule events
    setTimetable(prev => prev.filter(e => e.courseId !== id));
    setSchedule(prev => prev.filter(e => e.courseId !== id));
  };

  const handleUpdateCourse = (updated: Course) => {
    setCourses(prev => prev.map(c => c.id === updated.id ? updated : c));
  };

  const handleAddTimetableEvent = (event: TimetableEvent) => {
    setTimetable(prev => [...prev, event]);
  };

  const handleDeleteTimetableEvent = (id: string) => {
    setTimetable(prev => prev.filter(e => e.id !== id));
  };

  const handleBulkImportTimetable = (events: TimetableEvent[]) => {
    setTimetable(events);
  };

  const handleToggleCompleteSchedule = (id: string) => {
    setSchedule(prev => prev.map(event => {
      if (event.id === id) {
        const nextState = !event.isCompleted;
        
        // Auto log study progress if marked completed!
        if (nextState) {
          const matchedLog = progressLogs.find(l => l.eventId === id);
          if (!matchedLog && event.courseId !== 'break') {
            const newLog: StudyProgressLog = {
              id: Math.random().toString(36).substr(2, 9),
              eventId: event.id,
              courseId: event.courseId,
              date: new Date().toISOString().split('T')[0],
              durationMinutes: event.durationMinutes,
              focusTopic: event.focusTopic || event.title,
              masteryRating: 3, // neutral initial rating
              notes: 'Logged automatically from schedule checklist completion.',
            };
            setProgressLogs(p => [...p, newLog]);
          }
        } else {
          // If toggled back to incomplete, delete the auto-created log
          setProgressLogs(p => p.filter(l => l.eventId !== id));
        }

        return { ...event, isCompleted: nextState };
      }
      return event;
    }));
  };

  const handleResetSchedule = () => {
    if (confirm("Are you sure you want to clear your current schedule?")) {
      setSchedule([]);
    }
  };

  // Google AI Generator Call
  const handleGenerateAISchedule = async (preferences: any) => {
    setIsGeneratingSchedule(true);
    try {
      const response = await fetch('/api/generate-schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courses,
          timetable,
          preferences,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate optimized schedule.');
      }

      const data = await response.json();
      if (data.schedule && Array.isArray(data.schedule)) {
        // Hydrate each element with random ID if not present
        const hydrated = data.schedule.map((evt: any) => ({
          ...evt,
          id: evt.id || Math.random().toString(36).substr(2, 9),
          isCompleted: false,
        }));
        setSchedule(hydrated);
      }
    } catch (err: any) {
      alert("Error calling Google AI endpoint. Please check console or verify your server is running with GEMINI_API_KEY.");
      console.error(err);
    } finally {
      setIsGeneratingSchedule(false);
    }
  };

  // Google AI Recommendations Call
  const handleFetchSuggestions = async () => {
    const response = await fetch('/api/suggest-adjustments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        courses,
        schedule,
        progressLogs,
        wellbeingLogs,
      }),
    });
    if (!response.ok) {
      throw new Error("Unable to contact AI Optimization module.");
    }
    return await response.json();
  };

  const handleAddLog = (log: StudyProgressLog) => {
    setProgressLogs(prev => [...prev, log]);
  };

  const handleDeleteLog = (id: string) => {
    setProgressLogs(prev => prev.filter(l => l.id !== id));
  };

  const handleUpdateWellbeing = (updated: WellbeingLog) => {
    setWellbeingLogs(prev => {
      const index = prev.findIndex(l => l.date === updated.date);
      if (index > -1) {
        const copy = [...prev];
        copy[index] = updated;
        return copy;
      } else {
        return [...prev, updated];
      }
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans" id="academic-study-optimizer-app">
      
      {/* Upper Navigation Bar */}
      <header className="bg-white border-b border-slate-200 py-4 px-6 sticky top-0 z-40 shadow-3xs" id="app-header">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-sm">
              <GraduationCap className="w-6 h-6 stroke-[2]" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-1.5">
                Academic Study Optimizer
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Google AI</span>
              </h1>
              <p className="text-xs text-slate-500 font-medium">Cognitive science-based routine optimization & well-being guard</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
            <Info className="w-4 h-4 text-slate-400" />
            <span className="text-slate-600 font-medium">Auto-saving locally to browser storage</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 space-y-6" id="app-main">
        
        {/* Navigation Ribbon Tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-1.5 scrollbar-thin scrollbar-thumb-slate-300">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: BarChart2, color: 'text-slate-600' },
            { id: 'schedule', label: 'AI Study Routine', icon: Sparkles, color: 'text-emerald-600' },
            { id: 'timetable', label: 'Official Timetable', icon: Calendar, color: 'text-indigo-600' },
            { id: 'courses', label: 'Syllabus Courses', icon: BookOpen, color: 'text-violet-600' },
            { id: 'progress', label: 'Study Progress Log', icon: ClipboardList, color: 'text-amber-600' },
            { id: 'wellbeing', label: 'Burnout Prevention', icon: Heart, color: 'text-rose-600' },
            { id: 'alerts', label: 'Study Alerts', icon: BellRing, color: 'text-cyan-600' },
            { id: 'calendar', label: 'Google Calendar Sync', icon: CalendarRange, color: 'text-indigo-600' },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-150 cursor-pointer whitespace-nowrap border ${
                  isActive
                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm font-bold'
                    : 'bg-white text-slate-600 hover:text-slate-900 border-slate-200 hover:bg-slate-50 shadow-3xs'
                }`}
                id={`tab-${tab.id}`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : tab.color}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Area with simple animation */}
        <div className="min-h-[500px]" id="tab-content-area">
          {activeTab === 'dashboard' && (
            <Dashboard 
              courses={courses}
              schedule={schedule}
              progressLogs={progressLogs}
              wellbeingLogs={wellbeingLogs}
              onFetchSuggestions={handleFetchSuggestions}
            />
          )}

          {activeTab === 'schedule' && (
            <StudyScheduleView
              schedule={schedule}
              courses={courses}
              timetable={timetable}
              onGenerateSchedule={handleGenerateAISchedule}
              onToggleComplete={handleToggleCompleteSchedule}
              onResetSchedule={handleResetSchedule}
              isGenerating={isGeneratingSchedule}
              onSyncGoogleCalendar={() => setActiveTab('calendar')}
            />
          )}

          {activeTab === 'timetable' && (
            <TimetableManager
              timetable={timetable}
              courses={courses}
              onAddEvent={handleAddTimetableEvent}
              onDeleteEvent={handleDeleteTimetableEvent}
              onBulkImport={handleBulkImportTimetable}
            />
          )}

          {activeTab === 'courses' && (
            <CourseManager
              courses={courses}
              onAddCourse={handleAddCourse}
              onDeleteCourse={handleDeleteCourse}
              onUpdateCourse={handleUpdateCourse}
            />
          )}

          {activeTab === 'progress' && (
            <ProgressTracker
              progressLogs={progressLogs}
              courses={courses}
              schedule={schedule}
              onAddLog={handleAddLog}
              onDeleteLog={handleDeleteLog}
            />
          )}

          {activeTab === 'wellbeing' && (
            <WellbeingSection
              wellbeingLogs={wellbeingLogs}
              onUpdateWellbeing={handleUpdateWellbeing}
            />
          )}

          {activeTab === 'alerts' && (
            <AlertsManager 
              schedule={schedule}
            />
          )}

          {activeTab === 'calendar' && (
            <CalendarSyncManager
              schedule={schedule}
              timetable={timetable}
              courses={courses}
            />
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 px-6 mt-12" id="app-footer">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-400 font-medium">
          <p>© 2026 Academic Study Optimizer. Empowering students with cognitive discipline.</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-slate-600 transition-colors">Science & Research Reference</a>
            <a href="#" className="hover:text-slate-600 transition-colors">Privacy Principles</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
