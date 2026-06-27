/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Course, StudyScheduleEvent, StudyProgressLog, WellbeingLog } from '../types';
import { 
  TrendingUp, Award, Clock, Heart, Sparkles, Brain, CheckCircle, 
  ChevronRight, RefreshCw, AlertCircle, PlayCircle, Star
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Cell, LineChart, Line, Legend
} from 'recharts';

interface DashboardProps {
  courses: Course[];
  schedule: StudyScheduleEvent[];
  progressLogs: StudyProgressLog[];
  wellbeingLogs: WellbeingLog[];
  onFetchSuggestions: () => Promise<any>;
}

export default function Dashboard({
  courses,
  schedule,
  progressLogs,
  wellbeingLogs,
  onFetchSuggestions,
}: DashboardProps) {
  const [suggestions, setSuggestions] = useState<any>(null);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [errorSuggestions, setErrorSuggestions] = useState('');

  const loadAISuggestions = async () => {
    if (courses.length === 0) {
      setErrorSuggestions('Add courses and generate a schedule first to get AI feedback.');
      return;
    }
    setLoadingSuggestions(true);
    setErrorSuggestions('');
    try {
      const data = await onFetchSuggestions();
      setSuggestions(data);
    } catch (err: any) {
      console.error(err);
      setErrorSuggestions('Unable to connect to Gemini API. Please make sure GEMINI_API_KEY is configured.');
    } finally {
      setLoadingSuggestions(false);
    }
  };

  useEffect(() => {
    // Attempt lazy loading suggestions on first load if we have data
    if (courses.length > 0 && progressLogs.length > 0 && !suggestions) {
      loadAISuggestions();
    }
  }, [courses, progressLogs]);

  // Compute stats
  const totalPlannedHours = schedule.reduce((sum, e) => sum + e.durationMinutes, 0) / 60;
  const totalCompletedHours = progressLogs.reduce((sum, log) => sum + log.durationMinutes, 0) / 60;
  
  const totalPlannedSessions = schedule.filter(e => e.type === 'study' || e.type === 'review').length;
  const completedSessions = progressLogs.length;
  const completionRate = totalPlannedSessions > 0 ? Math.round((completedSessions / totalPlannedSessions) * 100) : 0;

  // Average mastery rating (1-5) across courses
  const averageMastery = progressLogs.length > 0 
    ? (progressLogs.reduce((sum, log) => sum + log.masteryRating, 0) / progressLogs.length).toFixed(1)
    : 'N/A';

  // Calculate study hours per course for chart
  const hoursPerCourseData = courses.map(course => {
    const courseLogs = progressLogs.filter(log => log.courseId === course.id);
    const completedHours = courseLogs.reduce((sum, log) => sum + log.durationMinutes, 0) / 60;
    
    // Average mastery
    const avgMastery = courseLogs.length > 0
      ? Number((courseLogs.reduce((sum, log) => sum + log.masteryRating, 0) / courseLogs.length).toFixed(1))
      : 0;

    return {
      name: course.code,
      fullName: course.name,
      hours: Number(completedHours.toFixed(1)),
      mastery: avgMastery,
      color: course.color,
    };
  });

  // Calculate daily well-being trend (mood + sleep)
  const wellbeingChartData = wellbeingLogs.slice(-7).map(log => {
    // Format YYYY-MM-DD to short format like "Jun 24"
    const dateObj = new Date(log.date);
    const formattedDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return {
      date: formattedDate,
      sleep: log.sleepHours,
      mood: log.moodRating,
      water: log.waterIntakeCups,
    };
  });

  // Highlight color for mastery stars
  const renderMasteryStars = (rating: number) => {
    return (
      <div className="flex gap-0.5 items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-3.5 h-3.5 ${
              star <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6" id="dashboard-section">
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="kpi-cards">
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-3xs flex items-center gap-4">
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase">Hours Completed</span>
            <h3 className="text-2xl font-black text-slate-800 mt-0.5">{totalCompletedHours.toFixed(1)} hrs</h3>
            <p className="text-[11px] text-slate-400 font-medium">Target: {totalPlannedHours.toFixed(1)} hrs planned</p>
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-3xs flex items-center gap-4">
          <div className="p-3.5 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase">Weekly Completion</span>
            <h3 className="text-2xl font-black text-slate-800 mt-0.5">{completionRate}%</h3>
            <p className="text-[11px] text-slate-400 font-medium">{completedSessions} of {totalPlannedSessions} study slots logged</p>
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-3xs flex items-center gap-4">
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-100 text-amber-500">
            <Brain className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase">Avg Course Mastery</span>
            <h3 className="text-2xl font-black text-slate-800 mt-0.5">{averageMastery} / 5</h3>
            <p className="text-[11px] text-slate-400 font-medium">Derived from study log self-ratings</p>
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-3xs flex items-center gap-4">
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-100 text-rose-600">
            <Heart className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase">Mental Well-being</span>
            <h3 className="text-2xl font-black text-slate-800 mt-0.5">
              {wellbeingLogs.length > 0 
                ? (wellbeingLogs.reduce((s, l) => s + l.moodRating, 0) / wellbeingLogs.length).toFixed(1) 
                : '5.0'} / 5
            </h3>
            <p className="text-[11px] text-slate-400 font-medium">Daily average health indicator</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Core Charts Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Chart 1: Study hours per subject */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="font-bold text-slate-800 text-base">Completed Study Distribution</h3>
                <p className="text-xs text-slate-500">Total hours spent studying each course during this routine</p>
              </div>
            </div>

            {hoursPerCourseData.length === 0 ? (
              <div className="h-[220px] flex items-center justify-center text-slate-400 text-sm italic">
                No course data available. Please register courses first.
              </div>
            ) : (
              <div className="h-[220px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={hoursPerCourseData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} unit="h" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                      labelFormatter={(value, items) => {
                        const item = hoursPerCourseData.find(d => d.name === value);
                        return item ? item.fullName : value;
                      }}
                    />
                    <Bar dataKey="hours" radius={[8, 8, 0, 0]}>
                      {hoursPerCourseData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Chart 2: Well-being correlation */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs">
            <div>
              <h3 className="font-bold text-slate-800 text-base">Well-being Trends (Last 7 Days)</h3>
              <p className="text-xs text-slate-500">Tracking sleep hours, water intake, and self-reported mood</p>
            </div>

            {wellbeingChartData.length === 0 ? (
              <div className="h-[200px] flex items-center justify-center text-slate-400 text-sm italic">
                No well-being data entered yet. Log your metrics in the Wellbeing Section!
              </div>
            ) : (
              <div className="h-[200px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={wellbeingChartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
                    <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    <Line type="monotone" dataKey="sleep" name="Sleep (hours)" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="mood" name="Mood Rating" stroke="#f43f5e" strokeWidth={2.5} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="water" name="Water (cups)" stroke="#0ea5e9" strokeWidth={2.5} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar: AI Success Coach & Subject Mastery List */}
        <div className="space-y-6">
          {/* Google AI Routine Adjustments Suggestions */}
          <div className="bg-slate-900 text-white rounded-3xl p-5 shadow-md border border-slate-800 flex flex-col justify-between min-h-[300px]">
            <div>
              <div className="flex justify-between items-start">
                <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-md px-2 py-0.5 uppercase tracking-wider">
                  <Sparkles className="w-3 h-3" />
                  Gemini AI Routine Coach
                </span>
                
                <button
                  onClick={loadAISuggestions}
                  disabled={loadingSuggestions}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                  title="Refresh recommendations"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingSuggestions ? 'animate-spin' : ''}`} />
                </button>
              </div>

              <h3 className="font-extrabold text-lg mt-4 tracking-tight leading-snug">Personalized Routine Optimization Suggestions</h3>

              {loadingSuggestions && (
                <div className="py-12 flex flex-col items-center justify-center gap-2">
                  <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
                  <span className="text-xs text-slate-400 font-mono">Analyzing performance metrics...</span>
                </div>
              )}

              {!loadingSuggestions && errorSuggestions && (
                <div className="mt-4 p-3 bg-white/5 border border-white/10 rounded-xl text-xs text-slate-300 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-white">AI Engine Off</p>
                    <p className="mt-0.5">{errorSuggestions}</p>
                  </div>
                </div>
              )}

              {!loadingSuggestions && !errorSuggestions && !suggestions && (
                <div className="py-10 text-center text-slate-400 space-y-4">
                  <p className="text-xs leading-relaxed">
                    Log at least one study session to activate the real-time continuous feedback algorithm.
                  </p>
                  <button
                    onClick={loadAISuggestions}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-slate-900 px-4 py-2 rounded-xl transition-all cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" /> Consult Coach
                  </button>
                </div>
              )}

              {!loadingSuggestions && !errorSuggestions && suggestions && (
                <div className="space-y-4 mt-4 animate-fade-in text-sm">
                  <div>
                    <h4 className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Mastery Overview</h4>
                    <p className="text-slate-200 text-xs mt-1 leading-relaxed">
                      {suggestions.masteryAnalysis}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Adjustment Suggestions</h4>
                    <ul className="list-disc pl-4 space-y-1 mt-1 text-xs text-slate-300">
                      {suggestions.scheduleSuggestions?.map((sug: string, i: number) => (
                        <li key={i} className="leading-relaxed">{sug}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-emerald-950/40 border border-emerald-500/20 rounded-xl p-3">
                    <h4 className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Coach Well-being Tip</h4>
                    <p className="text-emerald-300 text-xs mt-1 font-medium italic leading-relaxed">
                      "{suggestions.wellbeingTip}"
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Subject Mastery Rankings */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs">
            <h3 className="font-bold text-slate-800 text-base mb-3">Subject Mastery Indices</h3>
            {hoursPerCourseData.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-sm italic">
                Register courses to track mastery.
              </div>
            ) : (
              <div className="space-y-3">
                {hoursPerCourseData.map((course) => (
                  <div key={course.name} className="flex justify-between items-center border-b border-slate-50 pb-2 last:border-0 last:pb-0">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: course.color }} />
                      <div className="text-left">
                        <h4 className="text-xs font-bold text-slate-700 uppercase">{course.name}</h4>
                        <p className="text-[10px] text-slate-400">{course.fullName}</p>
                      </div>
                    </div>
                    <div>
                      {course.mastery > 0 ? (
                        <div className="flex flex-col items-end gap-0.5">
                          {renderMasteryStars(course.mastery)}
                          <span className="text-[10px] font-medium text-slate-500">Rating: {course.mastery}/5</span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-medium italic">No logs logged</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
