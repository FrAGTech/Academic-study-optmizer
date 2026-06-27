/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { StudyScheduleEvent } from '../types';
import { Bell, BellRing, Volume2, ShieldAlert, Check, Play, Settings2, Sparkles, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AlertsManagerProps {
  schedule: StudyScheduleEvent[];
}

const QUOTES = [
  "Academic excellence is not an act, but a habit. Keep pushing! 🌟",
  "Success is the sum of small efforts, repeated day in and day out. 💪",
  "The secret of getting ahead is getting started. Crack open that book! 📚",
  "Believe you can and you're halfway there. You've got this! ✨",
  "Focus on being productive instead of busy. Let's make this study count! 🔥",
];

export default function AlertsManager({ schedule }: AlertsManagerProps) {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [remindMinutesBefore, setRemindMinutesBefore] = useState(10);
  const [enableSound, setEnableSound] = useState(true);
  const [enableMotivationalQuotes, setEnableMotivationalQuotes] = useState(true);
  
  // Simulated notifications logged list
  const [activeAlerts, setActiveAlerts] = useState<{ id: string; title: string; message: string; date: string }[]>([]);

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestBrowserPermission = async () => {
    if (!('Notification' in window)) {
      alert("This browser doesn't support desktop notifications.");
      return;
    }
    const result = await Notification.requestPermission();
    setPermission(result);
  };

  // Web Audio Synth to play a pleasant "study call" chime
  const playAlertChime = () => {
    if (!enableSound) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      // Pleasant dual tone chime
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc1.frequency.setValueAtTime(659.25, ctx.currentTime + 0.15); // E5
      osc1.frequency.setValueAtTime(783.99, ctx.currentTime + 0.3); // G5
      
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(261.63, ctx.currentTime); // C4
      osc2.frequency.setValueAtTime(329.63, ctx.currentTime + 0.15); // E4
      osc2.frequency.setValueAtTime(392.00, ctx.currentTime + 0.3); // G4

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 0.8);
      osc2.stop(ctx.currentTime + 0.8);
    } catch (e) {
      console.warn("Audio Context blocked or failed:", e);
    }
  };

  // Test sandbox trigger
  const triggerSandboxAlert = () => {
    playAlertChime();
    
    const randomQuote = QUOTES[Math.floor(Math.random() * QUOTES.length)];
    const title = "📚 Smart Study Alarm! [Test]";
    const body = enableMotivationalQuotes 
      ? `Time to master your course objectives. ${randomQuote}`
      : `Your study window is active now! Direct your focus fully.`;

    // 1. Browser Native push
    if (permission === 'granted') {
      try {
        new Notification(title, {
          body,
          icon: '/favicon.ico',
        });
      } catch (err) {
        console.warn("Failed to create native notification:", err);
      }
    }

    // 2. In-app simulation list
    const newAlert = {
      id: Math.random().toString(),
      title,
      message: body,
      date: new Date().toLocaleTimeString(),
    };
    setActiveAlerts(prev => [newAlert, ...prev].slice(0, 5));
  };

  return (
    <div className="space-y-6" id="alerts-manager-section">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Settings Column */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
              <BellRing className="w-5 h-5 text-indigo-600" />
              Customizable Reminders
            </h3>
            <p className="text-xs text-slate-500">Configure how and when you get alerted to begin your study routine</p>
          </div>

          {/* Browser Permission Prompt */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Desktop Integration</span>
              <p className="text-xs font-medium text-slate-600 mt-0.5">
                {permission === 'granted' 
                  ? '🟢 Desktop push alerts are enabled.' 
                  : permission === 'denied'
                  ? '🔴 Notifications are blocked by browser. Reset in URL bar settings.'
                  : '🟡 Standard browser notifications are pending authorization.'}
              </p>
            </div>
            {permission !== 'granted' && permission !== 'denied' && (
              <button
                onClick={requestBrowserPermission}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-3.5 py-2 rounded-xl shadow-xs transition-colors cursor-pointer whitespace-nowrap"
              >
                Enable Push
              </button>
            )}
          </div>

          {/* Alert Configuration Options */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1.5">Advance Alarm Lead Time</label>
              <select
                value={remindMinutesBefore}
                onChange={(e) => setRemindMinutesBefore(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition-all cursor-pointer"
              >
                <option value="0">At exact start time</option>
                <option value="5">5 minutes before</option>
                <option value="10">10 minutes before</option>
                <option value="15">15 minutes before</option>
                <option value="30">30 minutes before</option>
              </select>
            </div>

            {/* Sound Toggle */}
            <div className="flex justify-between items-center bg-slate-50 border border-slate-100 p-3 rounded-2xl">
              <div>
                <span className="text-xs font-bold text-slate-700 block">Synthesized Alarm Bell</span>
                <span className="text-[10px] text-slate-400">Play an alert sound when study starts</span>
              </div>
              <button
                onClick={() => setEnableSound(!enableSound)}
                className={`w-10 h-6 rounded-full p-1 transition-colors cursor-pointer ${
                  enableSound ? 'bg-indigo-600' : 'bg-slate-300'
                }`}
              >
                <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform transform ${
                  enableSound ? 'translate-x-4' : 'translate-x-0'
                }`} />
              </button>
            </div>

            {/* Quotes Toggle */}
            <div className="flex justify-between items-center bg-slate-50 border border-slate-100 p-3 rounded-2xl">
              <div>
                <span className="text-xs font-bold text-slate-700 block">Cognitive Motivation</span>
                <span className="text-[10px] text-slate-400">Inject curated motivational quotes into reminders</span>
              </div>
              <button
                onClick={() => setEnableMotivationalQuotes(!enableMotivationalQuotes)}
                className={`w-10 h-6 rounded-full p-1 transition-colors cursor-pointer ${
                  enableMotivationalQuotes ? 'bg-indigo-600' : 'bg-slate-300'
                }`}
              >
                <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform transform ${
                  enableMotivationalQuotes ? 'translate-x-4' : 'translate-x-0'
                }`} />
              </button>
            </div>
          </div>
        </div>

        {/* Sandbox simulator & history */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-500" />
              Alert Sandbox Simulator
            </h3>
            <p className="text-xs text-slate-500">Test how your custom study alerts operate instantly</p>
          </div>

          <div className="bg-slate-50/50 border border-slate-200 border-dashed rounded-2xl p-6 text-center space-y-4">
            <Bell className="w-10 h-10 text-indigo-500 mx-auto animate-bounce" />
            <div>
              <h4 className="font-bold text-slate-700 text-sm">Want to hear/see the chime?</h4>
              <p className="text-[11px] text-slate-400 max-w-xs mx-auto mt-0.5">
                Trigger a sandbox alert to hear the pleasant dual-tone chime and view the notification card.
              </p>
            </div>
            <button
              onClick={triggerSandboxAlert}
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-5 py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-white" /> Trigger Test Notification
            </button>
          </div>

          {/* Alert logs list */}
          {activeAlerts.length > 0 && (
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Recent Alerts Dispatched</span>
              <div className="space-y-2 max-h-[150px] overflow-y-auto">
                {activeAlerts.map((alert) => (
                  <div key={alert.id} className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-xs">
                    <div className="flex justify-between font-bold text-slate-700">
                      <span>{alert.title}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{alert.date}</span>
                    </div>
                    <p className="text-slate-500 mt-1 leading-relaxed">{alert.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
