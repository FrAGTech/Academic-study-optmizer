/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Course, StudyScheduleEvent, StudyProgressLog, WellbeingLog } from '../types';
import { 
  Award, Trophy, Star, Sparkles, TrendingUp, Zap, HelpCircle, 
  Droplet, Moon, Heart, Flame, ShieldAlert, CheckCircle2, User, RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface LeaderboardProps {
  courses: Course[];
  schedule: StudyScheduleEvent[];
  progressLogs: StudyProgressLog[];
  wellbeingLogs: WellbeingLog[];
}

interface PeerStudent {
  id: string;
  name: string;
  major: string;
  avatarSeed: string;
  avatarColor: string;
  baseScore: number;
  activityTrend: 'up' | 'stable' | 'down';
}

// Fixed study champions/peers
const PEERS: PeerStudent[] = [
  { id: 'p1', name: 'Alexander Mercer', major: 'Computer Science', avatarSeed: 'AM', avatarColor: 'bg-indigo-500', baseScore: 1120, activityTrend: 'up' },
  { id: 'p2', name: 'Chloe Lin', major: 'Linear Algebra', avatarSeed: 'CL', avatarColor: 'bg-sky-500', baseScore: 980, activityTrend: 'up' },
  { id: 'p3', name: 'Sarah Devlin', major: 'Astrophysics', avatarSeed: 'SD', avatarColor: 'bg-rose-500', baseScore: 780, activityTrend: 'stable' },
  { id: 'p4', name: 'Elena Rostova', major: 'Biochemistry', avatarSeed: 'ER', avatarColor: 'bg-amber-500', baseScore: 590, activityTrend: 'stable' },
];

export default function Leaderboard({
  courses,
  schedule,
  progressLogs,
  wellbeingLogs,
}: LeaderboardProps) {
  const [userName, setUserName] = useState<string>(() => {
    return localStorage.getItem('study_opt_username') || 'Elite Scholar';
  });
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(userName);

  // Success Score Formula:
  // - Completed study events = 50 pts each
  // - Study focus minutes = 1 pt per minute
  // - Average mastery rating * 30 points
  // - Water cups logged = 5 pts each
  // - Breathing sessions (wellbeing breaksTaken) = 20 pts each
  // - Logged sleep hours = 5 pts per hour
  
  const completedSessionsCount = schedule.filter(e => e.isCompleted && e.courseId !== 'break').length;
  const totalStudyMinutes = progressLogs.reduce((sum, log) => sum + log.durationMinutes, 0);
  
  const totalWaterCups = wellbeingLogs.reduce((sum, log) => sum + log.waterIntakeCups, 0);
  const totalBreathingBreaks = wellbeingLogs.reduce((sum, log) => sum + log.breaksTaken, 0);
  const totalSleepHours = wellbeingLogs.reduce((sum, log) => sum + log.sleepHours, 0);
  
  const avgMasteryRating = progressLogs.length > 0
    ? progressLogs.reduce((sum, log) => sum + log.masteryRating, 0) / progressLogs.length
    : 0;

  // Compute User Base Score
  let userScore = 0;
  userScore += completedSessionsCount * 50;
  userScore += totalStudyMinutes * 1;
  userScore += Math.round(avgMasteryRating * 30);
  userScore += totalWaterCups * 5;
  userScore += totalBreathingBreaks * 20;
  userScore += Math.round(totalSleepHours * 2);

  // Bonus Achievements check:
  const achievements = [
    {
      id: 'hydro',
      title: 'Hydration Dynamo',
      desc: 'Log 8+ cups of water on any single day',
      icon: Droplet,
      iconColor: 'text-sky-500 bg-sky-50 border-sky-100',
      pts: 100,
      unlocked: wellbeingLogs.some(log => log.waterIntakeCups >= 8),
    },
    {
      id: 'zen',
      title: 'Zen Master',
      desc: 'Log 5+ mindful breathing sessions total',
      icon: Heart,
      iconColor: 'text-emerald-500 bg-emerald-50 border-emerald-100',
      pts: 150,
      unlocked: totalBreathingBreaks >= 5,
    },
    {
      id: 'focused',
      title: 'Deep Work Devotee',
      desc: 'Achieve a 5/5 perfect Course Mastery rating',
      icon: Flame,
      iconColor: 'text-amber-500 bg-amber-50 border-amber-100',
      pts: 120,
      unlocked: progressLogs.some(log => log.masteryRating === 5),
    },
    {
      id: 'sleeper',
      title: 'Circadian Champion',
      desc: 'Average 7.5+ hours of sleep over logged days',
      icon: Moon,
      iconColor: 'text-indigo-500 bg-indigo-50 border-indigo-100',
      pts: 100,
      unlocked: wellbeingLogs.length > 0 && (totalSleepHours / wellbeingLogs.length) >= 7.5,
    },
  ];

  // Add achievement bonus points to overall score
  achievements.forEach(ach => {
    if (ach.unlocked) {
      userScore += ach.pts;
    }
  });

  const handleSaveName = () => {
    const trimmed = tempName.trim();
    if (trimmed) {
      setUserName(trimmed);
      localStorage.setItem('study_opt_username', trimmed);
    }
    setIsEditingName(false);
  };

  // Combine user with peer rankings
  const rankings = [
    ...PEERS,
    { 
      id: 'user', 
      name: `${userName} (You)`, 
      major: courses.length > 0 ? courses[0].name : 'Academic Journey', 
      avatarSeed: userName.substring(0, 2).toUpperCase(), 
      avatarColor: 'bg-emerald-600 border-2 border-emerald-300', 
      baseScore: userScore, 
      activityTrend: 'up' as const 
    }
  ].sort((a, b) => b.baseScore - a.baseScore);

  const userRankIndex = rankings.findIndex(r => r.id === 'user') + 1;
  const userRankSuffix = userRankIndex === 1 ? 'st' : userRankIndex === 2 ? 'nd' : userRankIndex === 3 ? 'rd' : 'th';

  return (
    <div className="space-y-6" id="leaderboard-section">
      
      {/* Upper overview and profile customizer */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-black bg-indigo-100 text-indigo-800 border border-indigo-200 rounded-md px-2 py-0.5 uppercase tracking-wider">
              <Trophy className="w-3.5 h-3.5" />
              Academic Success Ranking
            </span>
            <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
              Success Score & Peer Standings
            </h2>
            <p className="text-xs text-slate-500 max-w-xl">
              Track your daily cumulative success index. Your points are auto-calculated from logged study hours, syllabus completions, and physical wellness habits. Keep a healthy balance!
            </p>
          </div>

          {/* Profile Name Customizer */}
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl w-full md:w-auto flex items-center gap-3 flex-shrink-0">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-xs">
              {userName.substring(0, 2).toUpperCase()}
            </div>
            <div className="text-left flex-1">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Scholar Alias</span>
              {isEditingName ? (
                <div className="flex gap-1.5 mt-1">
                  <input
                    type="text"
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    maxLength={20}
                    className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs font-semibold focus:outline-none focus:border-indigo-500 text-slate-800"
                  />
                  <button
                    onClick={handleSaveName}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                  >
                    Save
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-sm font-extrabold text-slate-800 truncate max-w-[120px]">{userName}</span>
                  <button
                    onClick={() => {
                      setTempName(userName);
                      setIsEditingName(true);
                    }}
                    className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold hover:underline cursor-pointer"
                  >
                    Edit
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Competitor List & Score Formula Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Leaderboard Competitor Board */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500 fill-amber-100" />
                Active Class Standings
              </h3>
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                Real-Time Simulated Sync
              </span>
            </div>

            {/* User Standing KPI banner */}
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-150 rounded-2xl p-4 flex items-center justify-between gap-4 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-emerald-600 rounded-full flex items-center justify-center text-white text-xl font-black shadow-xs">
                  {userRankIndex}
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-800 text-sm">
                    You are in <strong className="text-emerald-700 text-base">{userRankIndex}{userRankSuffix}</strong> place!
                  </h4>
                  <p className="text-xs text-slate-500 font-medium">
                    {userRankIndex === 1 
                      ? 'Incredible performance! You are leading the cohort in cognitive hygiene.' 
                      : `Keep completing your study times and wellness checklist to catch up!`}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Total Success Points</span>
                <span className="text-xl font-black text-emerald-800">{userScore} pts</span>
              </div>
            </div>

            {/* Standings Table/List */}
            <div className="space-y-2.5">
              {rankings.map((student, idx) => {
                const isSelf = student.id === 'user';
                const rankNum = idx + 1;
                
                return (
                  <div
                    key={student.id}
                    className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                      isSelf 
                        ? 'bg-gradient-to-r from-indigo-50/20 to-emerald-50/20 border-emerald-400/80 shadow-xs' 
                        : 'bg-slate-50/50 border-slate-150 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      {/* Place Indicator */}
                      <div className="w-6 text-center flex-shrink-0">
                        {rankNum === 1 ? (
                          <span className="text-lg">👑</span>
                        ) : rankNum === 2 ? (
                          <span className="text-lg">🥈</span>
                        ) : rankNum === 3 ? (
                          <span className="text-lg">🥉</span>
                        ) : (
                          <span className="text-xs font-bold text-slate-400 font-mono">{rankNum}</span>
                        )}
                      </div>

                      {/* Avatar */}
                      <div className={`w-9 h-9 rounded-full ${student.avatarColor} text-white font-extrabold text-xs flex items-center justify-center flex-shrink-0`}>
                        {student.avatarSeed}
                      </div>

                      <div className="text-left min-w-0">
                        <span className={`text-xs font-bold block truncate ${isSelf ? 'text-emerald-700 font-extrabold' : 'text-slate-800'}`}>
                          {student.name}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium block truncate">{student.major}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 flex-shrink-0">
                      <div className="text-right">
                        <span className="text-xs font-black text-slate-800 font-mono">{student.baseScore}</span>
                        <span className="text-[10px] text-slate-400 block font-medium">points</span>
                      </div>

                      <span className="text-xs" title="Daily Activity Indicator">
                        {student.activityTrend === 'up' ? '📈' : '➖'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick tips */}
          <div className="mt-6 pt-3.5 border-t border-slate-100 flex items-center gap-2 text-[11px] text-slate-400 font-medium">
            <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-400 flex-shrink-0" />
            <span>Success points refresh instantly whenever you check off scheduled blocks or add water cups.</span>
          </div>
        </div>

        {/* Dynamic Achievements & How to Earn */}
        <div className="space-y-6">
          
          {/* How to Earn Points Guide */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-800 text-base flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-indigo-600 fill-indigo-100" />
              Success Score Formula
            </h3>
            
            <div className="space-y-2.5 text-xs text-slate-600 font-medium">
              <div className="flex justify-between items-center border-b border-slate-100 pb-1.5">
                <span className="text-slate-500">📚 Focus Blocks Checked</span>
                <span className="text-slate-800 font-bold">+50 pts each</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-100 pb-1.5">
                <span className="text-slate-500">⏰ Study Minutes Logged</span>
                <span className="text-slate-800 font-bold">+1 pt per min</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-100 pb-1.5">
                <span className="text-slate-500">⭐ Course Mastery Average</span>
                <span className="text-slate-800 font-bold">avg * 30 pts</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-100 pb-1.5">
                <span className="text-slate-500">💧 Water Cups Drank</span>
                <span className="text-slate-800 font-bold">+5 pts each</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-100 pb-1.5">
                <span className="text-slate-500">🧘 Mindful Breathing Breaks</span>
                <span className="text-slate-800 font-bold">+20 pts each</span>
              </div>
              <div className="flex justify-between items-center pb-1">
                <span className="text-slate-500">🛌 Sleep Hours Tracked</span>
                <span className="text-slate-800 font-bold">+2 pts per hour</span>
              </div>
            </div>
          </div>

          {/* Academic Achievements Badges */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-800 text-base flex items-center gap-1.5">
              <Award className="w-5 h-5 text-indigo-600" />
              Academic Badges
            </h3>

            <div className="space-y-3">
              {achievements.map((ach) => {
                const IconComponent = ach.icon;
                return (
                  <div 
                    key={ach.id}
                    className={`p-3 rounded-2xl border transition-all flex gap-3 items-center ${
                      ach.unlocked 
                        ? 'bg-indigo-50/20 border-indigo-200 text-slate-700' 
                        : 'bg-slate-50/40 border-slate-200 text-slate-400 opacity-60'
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-xl border flex items-center justify-center flex-shrink-0 ${
                      ach.unlocked ? ach.iconColor : 'bg-slate-100 border-slate-200 text-slate-300'
                    }`}>
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <div className="text-left flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <span className={`text-xs font-bold block truncate ${ach.unlocked ? 'text-slate-800' : 'text-slate-400'}`}>
                          {ach.title}
                        </span>
                        <span className="text-[10px] font-bold font-mono text-indigo-600">
                          +{ach.pts}p
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 block leading-tight">{ach.desc}</span>
                      
                      {ach.unlocked ? (
                        <span className="text-[8px] font-extrabold uppercase text-emerald-600 flex items-center gap-0.5 mt-1">
                          ✓ Completed & Unlocked
                        </span>
                      ) : (
                        <span className="text-[8px] font-bold uppercase text-slate-400 block mt-1">
                          🔒 Locked
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
