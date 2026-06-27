/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { WellbeingLog } from '../types';
import { Heart, Droplet, Coffee, Eye, Moon, Smile, Sparkles, Wind, Check, BrainCircuit } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface WellbeingSectionProps {
  wellbeingLogs: WellbeingLog[];
  onUpdateWellbeing: (log: WellbeingLog) => void;
}

const CHECKLIST_ITEMS = [
  { id: 'stretch', text: 'Did light stretching or physical movement (5+ mins)' },
  { id: 'nature', text: 'Stepped outside or looked at natural sunlight/plants' },
  { id: 'screen', text: 'Rested eyes from screens for at least 15 minutes' },
  { id: 'social', text: 'Spoke with a classmate, friend, or family member' },
];

export default function WellbeingSection({
  wellbeingLogs,
  onUpdateWellbeing,
}: WellbeingSectionProps) {
  // Current day's log state
  const todayStr = new Date().toISOString().split('T')[0];
  const currentLog = wellbeingLogs.find(l => l.date === todayStr) || {
    date: todayStr,
    waterIntakeCups: 0,
    breaksTaken: 0,
    moodRating: 3,
    sleepHours: 7,
  };

  // Breathing trainer state
  const [breathState, setBreathState] = useState<'idle' | 'inhale' | 'hold' | 'exhale' | 'hold-empty'>('idle');
  const [breathTimer, setBreathTimer] = useState(4);
  const [breathCount, setBreathCount] = useState(0);

  // Wellness checks logged locally
  const [checkedItems, setCheckedItems] = useState<string[]>([]);

  // Breathing cycle logic
  useEffect(() => {
    if (breathState === 'idle') return;

    const timer = setInterval(() => {
      setBreathTimer((prev) => {
        if (prev <= 1) {
          // Trigger state transition
          if (breathState === 'inhale') {
            setBreathState('hold');
            return 4;
          } else if (breathState === 'hold') {
            setBreathState('exhale');
            return 4;
          } else if (breathState === 'exhale') {
            setBreathState('hold-empty');
            return 4;
          } else if (breathState === 'hold-empty') {
            setBreathCount(c => c + 1);
            // Log a break taken in the wellbeing stats!
            onUpdateWellbeing({
              ...currentLog,
              breaksTaken: currentLog.breaksTaken + 1
            });
            setBreathState('inhale');
            return 4;
          }
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [breathState, currentLog]);

  const handleStartBreathing = () => {
    setBreathState('inhale');
    setBreathTimer(4);
    setBreathCount(0);
  };

  const handleStopBreathing = () => {
    setBreathState('idle');
    setBreathTimer(4);
  };

  const handleAddWater = () => {
    onUpdateWellbeing({
      ...currentLog,
      waterIntakeCups: Math.min(currentLog.waterIntakeCups + 1, 16)
    });
  };

  const handleRemoveWater = () => {
    onUpdateWellbeing({
      ...currentLog,
      waterIntakeCups: Math.max(currentLog.waterIntakeCups - 1, 0)
    });
  };

  const handleSetSleep = (hours: number) => {
    onUpdateWellbeing({
      ...currentLog,
      sleepHours: hours
    });
  };

  const handleSetMood = (mood: number) => {
    onUpdateWellbeing({
      ...currentLog,
      moodRating: mood
    });
  };

  const toggleCheck = (id: string) => {
    setCheckedItems(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6" id="wellbeing-section">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Breathing Trainer (Calming Box) */}
        <div className="lg:col-span-2 bg-gradient-to-tr from-emerald-500 to-teal-600 text-white rounded-3xl p-6 shadow-md relative overflow-hidden flex flex-col justify-between min-h-[350px]">
          <div className="absolute top-0 right-0 p-12 bg-white/5 rounded-full blur-3xl" />
          
          <div className="z-10">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold bg-white/20 border border-white/30 rounded-md px-2 py-0.5 uppercase tracking-wider">
              <Wind className="w-3 h-3" />
              Box Breathing Trainer
            </span>
            <h3 className="font-extrabold text-xl mt-3 tracking-tight">Box Breathing & Cortisol Release</h3>
            <p className="text-emerald-100 text-xs mt-1 max-w-md leading-relaxed">
              Box breathing is used by elite performers to settle the nervous system. Take a quick 2-minute study break to center yourself before complex homework.
            </p>
          </div>

          {/* Interactive Breathing Area */}
          <div className="z-10 py-6 flex flex-col sm:flex-row items-center justify-around gap-6">
            <div className="relative flex items-center justify-center w-40 h-40">
              {/* Outer Breathing Ring */}
              <motion.div
                animate={{
                  scale: breathState === 'inhale' ? 1.4 : breathState === 'hold' ? 1.4 : breathState === 'exhale' ? 0.9 : 0.9,
                }}
                transition={{ duration: 4, ease: "linear" }}
                className="absolute inset-0 bg-white/10 rounded-full border-2 border-white/30"
              />
              
              {/* Core Breathing Bubble */}
              <motion.div
                animate={{
                  scale: breathState === 'inhale' ? 1.35 : breathState === 'hold' ? 1.35 : breathState === 'exhale' ? 0.85 : 0.85,
                  backgroundColor: breathState === 'hold' ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.7)'
                }}
                transition={{ duration: 4, ease: "linear" }}
                className="w-24 h-24 rounded-full flex flex-col items-center justify-center shadow-lg text-teal-800 font-black"
              >
                {breathState === 'idle' ? (
                  <button
                    onClick={handleStartBreathing}
                    className="w-full h-full rounded-full flex items-center justify-center font-bold text-sm text-teal-800 cursor-pointer"
                  >
                    Breathe
                  </button>
                ) : (
                  <div className="text-center">
                    <span className="text-2xl">{breathTimer}s</span>
                    <p className="text-[9px] font-bold uppercase mt-0.5">{breathState}</p>
                  </div>
                )}
              </motion.div>
            </div>

            <div className="space-y-3 max-w-xs text-left">
              {breathState === 'idle' ? (
                <div className="space-y-2">
                  <p className="text-xs text-emerald-500 font-bold bg-white px-2.5 py-1 rounded-lg inline-block">Ready to reset?</p>
                  <p className="text-xs text-emerald-100 leading-relaxed">
                    Click <strong>Breathe</strong> to launch a guiding loop: Inhale (4s) → Hold (4s) → Exhale (4s) → Hold (4s). Each cycle logs a wellness check-in.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-emerald-200">Cycles Completed: <strong className="text-white text-sm bg-white/10 px-2 py-0.5 rounded-full ml-1">{breathCount}</strong></p>
                  <p className="text-xs text-emerald-500 font-bold bg-white px-2.5 py-1 rounded-lg inline-block">
                    {breathState === 'inhale' && '🌬️ Draw breath in deeply...'}
                    {breathState === 'hold' && '🎈 Keep lungs full and steady...'}
                    {breathState === 'exhale' && '🍃 Slowly let tension leave...'}
                    {breathState === 'hold-empty' && '🧘 Keep lungs completely relaxed...'}
                  </p>
                  <button
                    onClick={handleStopBreathing}
                    className="text-xs border border-white/30 hover:border-white/50 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                  >
                    Stop Session
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="z-10 border-t border-white/20 pt-3 flex justify-between items-center text-xs text-emerald-100">
            <span>Daily Breathing Breaks completed: <strong>{currentLog.breaksTaken}</strong></span>
            <span>Boosts cognitive focus & spatial memory</span>
          </div>
        </div>

        {/* Right Side: Hydration & Well-being stats */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-5">
          <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
            <Heart className="w-5 h-5 text-rose-500" />
            Daily Well-being Log
          </h3>

          {/* Hydration tracker */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-600 uppercase flex items-center gap-1">
                <Droplet className="w-4 h-4 text-sky-500 fill-sky-500" />
                Water Hydration
              </span>
              <span className="text-xs font-bold text-slate-700">{currentLog.waterIntakeCups} / 8 Cups</span>
            </div>
            
            <div className="flex gap-1.5 items-center">
              {Array.from({ length: 8 }).map((_, index) => (
                <button
                  key={index}
                  onClick={index < currentLog.waterIntakeCups ? handleRemoveWater : handleAddWater}
                  className={`w-7 h-9 rounded-md transition-all border flex items-end justify-center pb-1 cursor-pointer ${
                    index < currentLog.waterIntakeCups
                      ? 'bg-sky-400 border-sky-500 text-white hover:bg-sky-500'
                      : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                  }`}
                  title={index < currentLog.waterIntakeCups ? "Log cup removed" : "Log cup finished"}
                >
                  <span className="text-[8px] font-extrabold uppercase select-none">
                    {index < currentLog.waterIntakeCups ? 'H2O' : ''}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Sleep Hours logger */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-600 uppercase flex items-center gap-1">
                <Moon className="w-4 h-4 text-indigo-500" />
                Last Night Sleep
              </span>
              <span className="text-xs font-bold text-slate-700">{currentLog.sleepHours} Hours</span>
            </div>

            <div className="flex gap-1 justify-between bg-slate-50 border border-slate-200 p-1.5 rounded-xl">
              {[4, 5, 6, 7, 8, 9, 10].map((hours) => (
                <button
                  key={hours}
                  onClick={() => handleSetSleep(hours)}
                  className={`flex-1 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    currentLog.sleepHours === hours
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                  }`}
                >
                  {hours}h
                </button>
              ))}
            </div>
          </div>

          {/* Daily Mood Meter */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-600 uppercase flex items-center gap-1">
                <Smile className="w-4 h-4 text-amber-500" />
                Daily Mood state
              </span>
              <span className="text-xs font-bold text-slate-700">Level: {currentLog.moodRating} / 5</span>
            </div>

            <div className="flex gap-1 bg-slate-50 border border-slate-200 p-1.5 rounded-xl">
              {[
                { r: 1, label: '😭 Tired' },
                { r: 2, label: '🥱 Stressed' },
                { r: 3, label: '😐 Okay' },
                { r: 4, label: '😊 Focused' },
                { r: 5, label: '🔥 Peak' },
              ].map(({ r, label }) => (
                <button
                  key={r}
                  onClick={() => handleSetMood(r)}
                  className={`flex-1 py-1 px-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                    currentLog.moodRating === r
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Daily mental health Checklist & scientific facts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs">
          <h3 className="font-bold text-slate-800 text-base mb-3 flex items-center gap-2">
            <Check className="w-5 h-5 text-emerald-600" />
            Mental Health Prevention Checklist
          </h3>
          <p className="text-xs text-slate-500 mb-4">Complete these micro-tasks throughout the day to secure cognitive sustainability</p>

          <div className="space-y-3">
            {CHECKLIST_ITEMS.map((item) => {
              const isChecked = checkedItems.includes(item.id);
              return (
                <button
                  key={item.id}
                  onClick={() => toggleCheck(item.id)}
                  className={`w-full text-left p-3 rounded-2xl border transition-all flex items-center gap-3 cursor-pointer ${
                    isChecked
                      ? 'bg-emerald-50 border-emerald-150 text-slate-700'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100/50 text-slate-600'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 transition-colors ${
                    isChecked ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white border-slate-300'
                  }`}>
                    {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                  <span className="text-xs font-semibold">{item.text}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
            <BrainCircuit className="w-5 h-5 text-indigo-600" />
            Why Well-being Boosts GPA
          </h3>

          <div className="space-y-3.5 text-xs text-slate-600 font-medium">
            <div className="flex gap-2 items-start">
              <span className="text-base">💧</span>
              <p className="leading-relaxed">
                <strong>Dehydration diminishes logic:</strong> A minor 1-2% drop in cellular hydration triggers fatigue, decreasing mathematical problem-solving speed by up to 15%. Keep your water glass full!
              </p>
            </div>

            <div className="flex gap-2 items-start">
              <span className="text-base">🛌</span>
              <p className="leading-relaxed">
                <strong>Sleep consolidates learning:</strong> Deep slow-wave sleep transfers short-term study memories (hippocampus) into permanent structural storage (neocortex). Studying for 8 hours without 7+ hours of sleep is largely lost energy!
              </p>
            </div>

            <div className="flex gap-2 items-start">
              <span className="text-base">☕</span>
              <p className="leading-relaxed">
                <strong>The 50/10 Rule:</strong> Studies prove that human focus plateaus after 50 minutes. Stepping outside or stretching during our scheduled breaks resets dopamine pathways, restoring attention levels.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
