/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Course, TimetableEvent, StudyScheduleEvent } from '../types';
import { 
  googleSignIn, logout, initAuth, getAccessToken 
} from '../lib/googleAuth';
import { 
  createCalendarEvent, getDateForDayOfWeek, formatDateTimeISO, GoogleCalendarEvent 
} from '../lib/googleCalendar';
import { 
  Calendar, Check, RefreshCw, AlertCircle, CalendarRange, Clock, 
  Sparkles, CheckSquare, Square, LogOut, Loader2, Info, ChevronRight, HelpCircle
} from 'lucide-react';
import { User } from 'firebase/auth';

interface CalendarSyncManagerProps {
  schedule: StudyScheduleEvent[];
  timetable: TimetableEvent[];
  courses: Course[];
}

interface SyncItem {
  id: string;
  sourceId: string;
  type: 'schedule' | 'timetable';
  title: string;
  dayOfWeek: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  startTime: string;
  endTime: string;
  details: string;
  location?: string;
  selected: boolean;
}

export default function CalendarSyncManager({
  schedule,
  timetable,
  courses,
}: CalendarSyncManagerProps) {
  // Authentication states
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [needsAuth, setNeedsAuth] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Sync Configuration State
  const [selectedWeekStart, setSelectedWeekStart] = useState<Date>(() => {
    // Default to the nearest Monday
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    const monday = new Date(d.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
  });

  const [includeStudySchedule, setIncludeStudySchedule] = useState(true);
  const [includeTimetable, setIncludeTimetable] = useState(true);

  // Unified items list for the selected week
  const [syncItems, setSyncItems] = useState<SyncItem[]>([]);
  
  // Progress & feedback states
  const [syncProgress, setSyncProgress] = useState<{
    status: 'idle' | 'syncing' | 'success' | 'error';
    current: number;
    total: number;
    message: string;
    syncedIds: string[];
  }>({
    status: 'idle',
    current: 0,
    total: 0,
    message: '',
    syncedIds: [],
  });

  // Track historically synced items to prevent duplicate syncs
  const [alreadySyncedIds, setAlreadySyncedIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('study_opt_already_synced_ids');
    return saved ? JSON.parse(saved) : [];
  });

  // Load Auth state
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, currentToken) => {
        setUser(currentUser);
        setToken(currentToken);
        setNeedsAuth(false);
      },
      () => {
        setUser(null);
        setToken(null);
        setNeedsAuth(true);
      }
    );
    return () => unsubscribe();
  }, []);

  // Recalculate and build sync items list whenever week, schedule, timetable, or inclusion filters change
  useEffect(() => {
    const items: SyncItem[] = [];

    // Course mapper
    const getCourseCode = (courseId: string) => {
      if (courseId === 'break') return 'WELLBEING';
      const c = courses.find(x => x.id === courseId);
      return c ? c.code : 'STUDY';
    };

    // 1. Process Study Schedule
    if (includeStudySchedule) {
      schedule.forEach((event) => {
        items.push({
          id: `schedule-${event.id}`,
          sourceId: event.id,
          type: 'schedule',
          title: `[Study] ${getCourseCode(event.courseId)}: ${event.title}`,
          dayOfWeek: event.dayOfWeek,
          startTime: event.startTime,
          endTime: event.endTime,
          details: event.focusTopic || 'Rest, hydrate, and relax.',
          selected: !alreadySyncedIds.includes(`schedule-${event.id}`), // auto-select if not yet synced
        });
      });
    }

    // 2. Process Official Timetable
    if (includeTimetable) {
      timetable.forEach((event) => {
        items.push({
          id: `timetable-${event.id}`,
          sourceId: event.id,
          type: 'timetable',
          title: `[Class] ${event.title}`,
          dayOfWeek: event.dayOfWeek,
          startTime: event.startTime,
          endTime: event.endTime,
          details: `Official scheduled class. Type: ${event.type}.`,
          location: event.location,
          selected: !alreadySyncedIds.includes(`timetable-${event.id}`), // auto-select if not yet synced
        });
      });
    }

    // Sort items by day and startTime
    const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    items.sort((a, b) => {
      const dayDiff = dayOrder.indexOf(a.dayOfWeek) - dayOrder.indexOf(b.dayOfWeek);
      if (dayDiff !== 0) return dayDiff;
      return a.startTime.localeCompare(b.startTime);
    });

    setSyncItems(items);
  }, [selectedWeekStart, schedule, timetable, includeStudySchedule, includeTimetable, courses, alreadySyncedIds]);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setToken(result.accessToken);
        setUser(result.user);
        setNeedsAuth(false);
      }
    } catch (err: any) {
      console.error('Login failed:', err);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    if (window.confirm('Disconnect your Google Account?')) {
      await logout();
      setUser(null);
      setToken(null);
      setNeedsAuth(true);
    }
  };

  const toggleItemSelection = (id: string) => {
    setSyncItems(prev => prev.map(item => 
      item.id === id ? { ...item, selected: !item.selected } : item
    ));
  };

  const toggleSelectAll = () => {
    const allSelected = syncItems.every(x => x.selected);
    setSyncItems(prev => prev.map(item => ({ ...item, selected: !allSelected })));
  };

  // Helper: format standard readable week title
  const getWeekRangeLabel = (start: Date) => {
    const end = new Date(start.getTime());
    end.setDate(start.getDate() + 6);
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
    return `Week of ${start.toLocaleDateString(undefined, options)} - ${end.toLocaleDateString(undefined, options)}`;
  };

  // Shift selected week start
  const handleShiftWeek = (offsetWeeks: number) => {
    const newMonday = new Date(selectedWeekStart.getTime());
    newMonday.setDate(selectedWeekStart.getDate() + (offsetWeeks * 7));
    setSelectedWeekStart(newMonday);
  };

  // Trigger calendar sync execution
  const handleStartSync = async () => {
    const itemsToSync = syncItems.filter(item => item.selected);
    if (itemsToSync.length === 0) {
      alert("No events selected for calendar sync.");
      return;
    }

    // Explicit confirmation dialoug
    const confirmMessage = `Synchronize ${itemsToSync.length} selected events directly to your Google Calendar primary feed for ${getWeekRangeLabel(selectedWeekStart)}? This will insert new calendar entries.`;
    if (!window.confirm(confirmMessage)) {
      return;
    }

    const currentToken = token || await getAccessToken();
    if (!currentToken) {
      setNeedsAuth(true);
      return;
    }

    setSyncProgress({
      status: 'syncing',
      current: 0,
      total: itemsToSync.length,
      message: 'Initializing connection to Google Calendar API...',
      syncedIds: [],
    });

    const newlySyncedIds: string[] = [];
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

    try {
      for (let i = 0; i < itemsToSync.length; i++) {
        const item = itemsToSync[i];
        
        setSyncProgress(prev => ({
          ...prev,
          current: i + 1,
          message: `Syncing "${item.title}" (${item.dayOfWeek})...`,
        }));

        // Compute exact dates
        const absoluteDayDate = getDateForDayOfWeek(selectedWeekStart, item.dayOfWeek);
        const startISO = formatDateTimeISO(absoluteDayDate, item.startTime);
        const endISO = formatDateTimeISO(absoluteDayDate, item.endTime);

        const apiEvent: GoogleCalendarEvent = {
          summary: item.title,
          location: item.location || 'Online / Remote Study',
          description: item.details,
          start: {
            dateTime: startISO,
            timeZone,
          },
          end: {
            dateTime: endISO,
            timeZone,
          },
          reminders: {
            useDefault: false,
            overrides: [
              { method: 'popup', minutes: 10 }
            ]
          }
        };

        await createCalendarEvent(currentToken, apiEvent);
        newlySyncedIds.push(item.id);
      }

      // Add newly synced items to history
      const updatedSyncHistory = [...alreadySyncedIds, ...newlySyncedIds];
      setAlreadySyncedIds(updatedSyncHistory);
      localStorage.setItem('study_opt_already_synced_ids', JSON.stringify(updatedSyncHistory));

      setSyncProgress(prev => ({
        ...prev,
        status: 'success',
        message: `Successfully synchronized ${itemsToSync.length} events to your primary Google Calendar!`,
      }));

    } catch (error: any) {
      console.error("Google Calendar Sync failure:", error);
      setSyncProgress(prev => ({
        ...prev,
        status: 'error',
        message: error.message || 'An error occurred during synchronization. Verify calendar permissions.',
      }));
    }
  };

  const handleClearHistory = () => {
    if (window.confirm("Reset your event synchronization history tracker? This will allow you to re-export previously synced items.")) {
      setAlreadySyncedIds([]);
      localStorage.removeItem('study_opt_already_synced_ids');
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-6" id="calendar-sync-manager">
      
      {/* Header Banner */}
      <div className="border-b border-slate-100 pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
            <CalendarRange className="w-6 h-6 text-indigo-600" />
            Google Calendar Synchronizer
          </h2>
          <p className="text-xs text-slate-500 mt-1">Export your structured study routines and class schedules directly to your personal Google Calendar.</p>
        </div>

        {/* Auth profile controls */}
        {!needsAuth && user && (
          <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 px-3.5 py-1.5 rounded-2xl">
            {user.photoURL ? (
              <img src={user.photoURL} alt={user.displayName || 'Google User'} referrerPolicy="no-referrer" className="w-8 h-8 rounded-full border border-slate-300" />
            ) : (
              <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-xs">
                {user.displayName?.[0] || 'U'}
              </div>
            )}
            <div className="text-left">
              <span className="text-xs font-bold text-slate-700 block max-w-[150px] truncate">{user.displayName || 'Google Account'}</span>
              <span className="text-[10px] text-slate-400 block max-w-[150px] truncate">{user.email}</span>
            </div>
            <button 
              onClick={handleLogout}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Connection Layer */}
      {needsAuth ? (
        <div className="bg-slate-50 border border-slate-200 border-dashed rounded-3xl p-8 text-center space-y-6 max-w-xl mx-auto my-6">
          <div className="w-16 h-16 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
            <Calendar className="w-8 h-8 text-indigo-600 animate-pulse" />
          </div>
          <div className="space-y-2">
            <h3 className="font-extrabold text-slate-800 text-lg">Connect Google Calendar</h3>
            <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
              Authorizing connection lets you import study goals and syllabus lecture timetables to your cloud calendar in real-time, helping you protect study slots.
            </p>
          </div>

          <button
            onClick={handleLogin}
            disabled={isLoggingIn}
            className="inline-flex items-center justify-center gap-3 bg-white hover:bg-slate-50 text-slate-700 font-bold text-sm px-6 py-3 border border-slate-300 rounded-2xl shadow-xs transition-colors cursor-pointer w-full max-w-xs"
          >
            {isLoggingIn ? (
              <>
                <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />
                Connecting Auth...
              </>
            ) : (
              <>
                <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                </svg>
                <span>Authorize Google Calendar</span>
              </>
            )}
          </button>
          
          <div className="text-[10px] text-slate-400 leading-relaxed">
            Standard Google OAuth security applied. Your credentials remain private.
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* Calendar Sync Options Panel */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Week selector & controls */}
            <div className="lg:col-span-1 bg-slate-50 border border-slate-200 rounded-3xl p-5 space-y-5 flex flex-col justify-between">
              <div className="space-y-4">
                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold bg-indigo-100 text-indigo-800 border border-indigo-200 rounded-md px-2 py-0.5 uppercase tracking-wider">
                  <CalendarRange className="w-3 h-3" />
                  Target Week
                </span>

                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-1.5 bg-white border border-slate-200 p-1.5 rounded-2xl">
                    <button 
                      onClick={() => handleShiftWeek(-1)}
                      className="p-2 hover:bg-slate-100 rounded-xl font-bold text-slate-600 transition-colors cursor-pointer"
                      title="Previous Week"
                    >
                      ←
                    </button>
                    <span className="text-xs font-bold text-slate-700 text-center select-none truncate max-w-[150px]">
                      {getWeekRangeLabel(selectedWeekStart)}
                    </span>
                    <button 
                      onClick={() => handleShiftWeek(1)}
                      className="p-2 hover:bg-slate-100 rounded-xl font-bold text-slate-600 transition-colors cursor-pointer"
                      title="Next Week"
                    >
                      →
                    </button>
                  </div>
                  <button
                    onClick={() => {
                      const d = new Date();
                      const day = d.getDay();
                      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
                      setSelectedWeekStart(new Date(d.setDate(diff)));
                    }}
                    className="w-full text-center text-[10px] font-extrabold uppercase text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
                  >
                    Reset to This Week
                  </button>
                </div>

                {/* Filters */}
                <div className="space-y-2.5 pt-3 border-t border-slate-200">
                  <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block">Source Filters</span>
                  
                  <label className="flex items-center gap-3 bg-white hover:bg-slate-100/50 border border-slate-200 p-3 rounded-2xl cursor-pointer select-none transition-colors">
                    <input 
                      type="checkbox" 
                      checked={includeStudySchedule} 
                      onChange={(e) => setIncludeStudySchedule(e.target.checked)}
                      className="w-4 h-4 accent-indigo-600 cursor-pointer rounded"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-700 block">Include Study Routine</span>
                      <span className="text-[9px] text-slate-400">All AI-optimized study times</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 bg-white hover:bg-slate-100/50 border border-slate-200 p-3 rounded-2xl cursor-pointer select-none transition-colors">
                    <input 
                      type="checkbox" 
                      checked={includeTimetable} 
                      onChange={(e) => setIncludeTimetable(e.target.checked)}
                      className="w-4 h-4 accent-indigo-600 cursor-pointer rounded"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-700 block">Include Lecture Timetable</span>
                      <span className="text-[9px] text-slate-400">Registered class times & labs</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Sync Actions */}
              <div className="pt-4 border-t border-slate-200 space-y-3">
                <button
                  onClick={handleStartSync}
                  disabled={syncProgress.status === 'syncing' || syncItems.filter(x => x.selected).length === 0}
                  className="w-full inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold text-sm px-5 py-3 rounded-2xl shadow-sm transition-all cursor-pointer"
                >
                  {syncProgress.status === 'syncing' ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Syncing...
                    </>
                  ) : (
                    <>
                      <CalendarRange className="w-4 h-4" />
                      Sync {syncItems.filter(x => x.selected).length} Events
                    </>
                  )}
                </button>

                {alreadySyncedIds.length > 0 && (
                  <button
                    onClick={handleClearHistory}
                    className="w-full text-center text-[10px] text-slate-400 hover:text-rose-600 transition-colors cursor-pointer font-semibold block"
                  >
                    Reset Sync History ({alreadySyncedIds.length} tracks)
                  </button>
                )}
              </div>
            </div>

            {/* List of events to be synced */}
            <div className="lg:col-span-2 border border-slate-200 rounded-3xl p-5 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <span className="text-xs font-bold text-slate-700 uppercase">
                  Events Preview ({syncItems.length})
                </span>
                {syncItems.length > 0 && (
                  <button 
                    onClick={toggleSelectAll}
                    className="text-[10px] font-extrabold uppercase text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
                  >
                    {syncItems.every(x => x.selected) ? 'Deselect All' : 'Select All'}
                  </button>
                )}
              </div>

              {/* Progress Panel */}
              {syncProgress.status !== 'idle' && (
                <div className={`p-4 rounded-2xl border text-xs leading-relaxed space-y-2 ${
                  syncProgress.status === 'syncing' ? 'bg-indigo-50 border-indigo-150 text-indigo-800' :
                  syncProgress.status === 'success' ? 'bg-emerald-50 border-emerald-150 text-emerald-800' :
                  'bg-rose-50 border-rose-150 text-rose-800'
                }`}>
                  <div className="flex justify-between items-center font-bold">
                    <span className="flex items-center gap-1.5">
                      {syncProgress.status === 'syncing' && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                      {syncProgress.status === 'success' && <Check className="w-4 h-4" />}
                      {syncProgress.status === 'error' && <AlertCircle className="w-4 h-4" />}
                      {syncProgress.status === 'syncing' ? 'Calendar Sync in Progress...' : 'Sync Operation Completed'}
                    </span>
                    {syncProgress.status === 'syncing' && (
                      <span className="font-mono">{syncProgress.current} / {syncProgress.total}</span>
                    )}
                  </div>
                  <p className="font-medium text-[11px]">{syncProgress.message}</p>
                  
                  {syncProgress.status === 'syncing' && (
                    <div className="w-full bg-indigo-200/50 h-2 rounded-full overflow-hidden mt-1.5">
                      <div 
                        className="bg-indigo-600 h-full transition-all duration-300"
                        style={{ width: `${(syncProgress.current / syncProgress.total) * 100}%` }}
                      />
                    </div>
                  )}
                </div>
              )}

              {syncItems.length === 0 ? (
                <div className="bg-slate-50 rounded-2xl p-12 text-center text-slate-400 italic text-xs border border-dashed border-slate-200">
                  No active study routine or lectures found to export for this week. Use the "AI Study Routine" tab to generate a routine, or adjust source filters.
                </div>
              ) : (
                <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                  {syncItems.map((item) => {
                    const isSynced = alreadySyncedIds.includes(item.id);
                    return (
                      <div 
                        key={item.id}
                        onClick={() => toggleItemSelection(item.id)}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer flex justify-between items-center gap-4 text-xs ${
                          item.selected 
                            ? 'bg-indigo-50/40 border-indigo-150 text-slate-700 hover:bg-indigo-50/60' 
                            : 'bg-white border-slate-150 text-slate-500 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <button className="flex-shrink-0 mt-0.5 text-indigo-600">
                            {item.selected ? (
                              <CheckSquare className="w-4 h-4 fill-indigo-100" />
                            ) : (
                              <Square className="w-4 h-4" />
                            )}
                          </button>
                          <div className="space-y-1 min-w-0">
                            <span className="font-bold block truncate text-slate-800">{item.title}</span>
                            
                            <div className="flex gap-2 items-center flex-wrap text-[10px] text-slate-400 font-medium">
                              <span className="bg-slate-100 px-1.5 py-0.2 rounded text-slate-600 uppercase font-bold">{item.dayOfWeek}</span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {item.startTime} - {item.endTime}
                              </span>
                              {item.location && <span className="truncate">📍 {item.location}</span>}
                            </div>
                            
                            <p className="text-[10px] text-slate-400 italic truncate max-w-md">{item.details}</p>
                          </div>
                        </div>

                        {isSynced && (
                          <span className="text-[9px] font-extrabold uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full flex-shrink-0 select-none">
                            Synced ✓
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>

          {/* Educational Info segment */}
          <div className="bg-indigo-50/40 border border-indigo-100 rounded-3xl p-5 flex gap-4 items-start text-xs leading-relaxed text-indigo-900 font-medium">
            <Info className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-bold text-indigo-950">How Time-Blocking Protects Mental Sustainability</h4>
              <p className="text-[11px] text-indigo-800">
                Time-blocking on a primary digital calendar is highly recommended by cognitive researchers. When you book specific blocks for rest and specific blocks for dynamic focus, you create visual barriers that discourage friends, professors, or administrators from scheduling over your critical recovery times, preventing gradual academic burnout.
              </p>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
