/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Lazy initialization of Gemini client
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      console.warn("WARNING: GEMINI_API_KEY environment variable is not defined!");
    }
    aiClient = new GoogleGenAI({
      apiKey: key || "MOCK_KEY_IF_EMPTY",
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// --- HEURISTIC OFFLINE FALLBACK ENGINES ---

function parseTimeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTimeString(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(h)}:${pad(m)}`;
}

interface TimetableEvent {
  id: string;
  title: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  type?: string;
  location?: string;
}

interface Course {
  id: string;
  name: string;
  code: string;
  credits: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

function hasConflict(
  day: string,
  startMins: number,
  endMins: number,
  timetable: TimetableEvent[]
): boolean {
  for (const event of timetable) {
    if (event.dayOfWeek.toLowerCase() === day.toLowerCase()) {
      const eventStart = parseTimeToMinutes(event.startTime);
      const eventEnd = parseTimeToMinutes(event.endTime);
      // Check overlap
      if (startMins < eventEnd && eventStart < endMins) {
        return true;
      }
    }
  }
  return false;
}

function generateFallbackSchedule(courses: Course[], timetable: TimetableEvent[], preferences: any) {
  const schedule: any[] = [];
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  // Create priority-weighted course deck
  const courseDeck: Course[] = [];
  courses.forEach(course => {
    const weight = course.difficulty === 'hard' ? 3 : course.difficulty === 'medium' ? 2 : 1;
    for (let i = 0; i < weight; i++) {
      courseDeck.push(course);
    }
  });

  let deckIndex = 0;
  let eventCounter = 1;

  const includeWeekends = preferences?.includeWeekends !== false;
  const timeOfDay = preferences?.timeOfDayPreference || 'Evening';
  const targetDailyHours = Number(preferences?.dailyHoursTarget) || 3;
  
  let preferredStartHour = 18;
  if (timeOfDay.toLowerCase() === 'morning') {
    preferredStartHour = 9;
  } else if (timeOfDay.toLowerCase() === 'afternoon') {
    preferredStartHour = 14;
  }

  for (const day of days) {
    const isWeekend = day === 'Saturday' || day === 'Sunday';
    if (isWeekend && !includeWeekends) {
      continue;
    }

    let sessionsToSchedule = 1;
    let sessionDuration = 90;

    if (targetDailyHours >= 4) {
      sessionsToSchedule = 2;
      sessionDuration = 90;
    } else if (targetDailyHours <= 2) {
      sessionsToSchedule = 1;
      sessionDuration = 60;
    } else {
      sessionsToSchedule = 2;
      sessionDuration = 75;
    }

    let currentStartMins = preferredStartHour * 60;

    for (let s = 0; s < sessionsToSchedule; s++) {
      let foundBlock = false;
      let startMins = currentStartMins;
      let endMins = startMins + sessionDuration;

      while (endMins <= 23 * 60) {
        if (!hasConflict(day, startMins, endMins, timetable)) {
          foundBlock = true;
          break;
        }
        startMins += 30;
        endMins = startMins + sessionDuration;
      }

      if (foundBlock) {
        if (courseDeck.length === 0) break;
        const course = courseDeck[deckIndex % courseDeck.length];
        deckIndex++;

        let focusTopic = "Review lecture slides, highlight major concepts, and formulate standard mock equations.";
        if (course.difficulty === 'hard') {
          focusTopic = "Tackle complex theorems, resolve challenging textbook exercises, and self-test using active recall lists.";
        } else if (course.difficulty === 'medium') {
          focusTopic = "Outline syllabus modules, construct clear mental flowcharts, and solve moderate review exercises.";
        } else {
          focusTopic = "Perform structural organization of flashcards, verify core definitions, and review introductory slides.";
        }

        const studyEvent = {
          id: `fallback-${eventCounter++}-${Date.now()}`,
          courseId: course.id,
          title: `[Study] ${course.code}: ${course.name}`,
          dayOfWeek: day,
          startTime: minutesToTimeString(startMins),
          endTime: minutesToTimeString(endMins),
          focusTopic,
          type: 'study',
          durationMinutes: sessionDuration,
          isCompleted: false,
        };

        schedule.push(studyEvent);

        const breakDuration = 15;
        const breakStartMins = endMins;
        const breakEndMins = breakStartMins + breakDuration;

        if (breakEndMins <= 23 * 60 && !hasConflict(day, breakStartMins, breakEndMins, timetable)) {
          const breakEvent = {
            id: `fallback-${eventCounter++}-${Date.now()}`,
            courseId: 'break',
            title: 'Well-being Breathing & Hydration Break',
            dayOfWeek: day,
            startTime: minutesToTimeString(breakStartMins),
            endTime: minutesToTimeString(breakEndMins),
            focusTopic: 'Engage in simple 4-7-8 rhythmic breathing, drink 1 cup of water, and stretch away from your workspace.',
            type: 'break',
            durationMinutes: breakDuration,
            isCompleted: false,
          };
          schedule.push(breakEvent);
        }

        currentStartMins = endMins + breakDuration + 30;
      } else {
        break;
      }
    }
  }

  // Squeeze missing courses in
  const scheduledCourseIds = new Set(schedule.filter(e => e.courseId !== 'break').map(e => e.courseId));
  for (const course of courses) {
    if (!scheduledCourseIds.has(course.id)) {
      for (const day of days) {
        const isWeekend = day === 'Saturday' || day === 'Sunday';
        if (isWeekend && !includeWeekends) continue;

        let found = false;
        for (const testStartHour of [8, 12, 17, 21]) {
          const sMin = testStartHour * 60;
          const eMin = sMin + 60;
          if (!hasConflict(day, sMin, eMin, timetable)) {
            schedule.push({
              id: `fallback-${eventCounter++}-${Date.now()}`,
              courseId: course.id,
              title: `[Study] ${course.code}: ${course.name}`,
              dayOfWeek: day,
              startTime: minutesToTimeString(sMin),
              endTime: minutesToTimeString(eMin),
              focusTopic: "Complete fundamental syllabus readings and draft index card summaries of core chapters.",
              type: 'study',
              durationMinutes: 60,
              isCompleted: false,
            });
            found = true;
            break;
          }
        }
        if (found) break;
      }
    }
  }

  const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  schedule.sort((a, b) => {
    const dayDiff = dayOrder.indexOf(a.dayOfWeek) - dayOrder.indexOf(b.dayOfWeek);
    if (dayDiff !== 0) return dayDiff;
    return a.startTime.localeCompare(b.startTime);
  });

  return schedule;
}

function generateFallbackAdjustments(courses: Course[], schedule: any[], progressLogs: any[], wellbeingLogs: any[]) {
  let masteryAnalysis = "";
  if (!progressLogs || progressLogs.length === 0) {
    masteryAnalysis = "No recent study sessions have been logged yet. Check off study items in the routine checkboard and log your mastery (1-5 stars) to see which subjects need attention!";
  } else {
    const courseStats = courses.map(c => {
      const logs = progressLogs.filter(l => l.courseId === c.id);
      const avg = logs.length > 0 ? logs.reduce((sum, l) => sum + l.masteryRating, 0) / logs.length : null;
      return { course: c, avg, count: logs.length };
    });

    const activeStats = courseStats.filter(s => s.avg !== null);
    if (activeStats.length === 0) {
      masteryAnalysis = "Awaiting study progress ratings. Remember to log your mastery level at the end of each session to get accurate course standings.";
    } else {
      activeStats.sort((a, b) => (a.avg || 0) - (b.avg || 0));
      const lowest = activeStats[0];
      const highest = activeStats[activeStats.length - 1];

      if (lowest.course.id === highest.course.id) {
        masteryAnalysis = `You've logged studies for ${lowest.course.name} with a steady comprehension level of ${lowest.avg?.toFixed(1)}/5 stars. Log other courses to balance your insights!`;
      } else {
        masteryAnalysis = `Comprehension breakdown: You are mastering ${highest.course.name} excellently (average rating of ${highest.avg?.toFixed(1)}/5). However, ${lowest.course.name} is currently lower at ${lowest.avg?.toFixed(1)}/5 stars, suggesting it needs more active recall or practice problems in your upcoming routine.`;
      }
    }
  }

  const scheduleSuggestions: string[] = [];
  const avgSleep = wellbeingLogs && wellbeingLogs.length > 0
    ? wellbeingLogs.reduce((sum, l) => sum + l.sleepHours, 0) / wellbeingLogs.length
    : 7.0;

  const totalSlots = schedule.filter(e => e.courseId !== 'break').length;
  const completedSlots = schedule.filter(e => e.isCompleted && e.courseId !== 'break').length;
  const completionRate = totalSlots > 0 ? (completedSlots / totalSlots) * 100 : 0;

  if (avgSleep < 7.0) {
    scheduleSuggestions.push(`Your sleep is averaging ${avgSleep.toFixed(1)} hours. To avoid cognitive burnout, try shifting hard study blocks to early afternoon and avoid scheduling high-focus slots after 20:00.`);
  } else {
    scheduleSuggestions.push("Your sleep cycle is well-regulated! Maximize this cognitive peak by placing your most difficult course material during your first study block of the day.");
  }

  if (totalSlots > 0) {
    if (completionRate < 50) {
      scheduleSuggestions.push(`Your current schedule completion is ${completionRate.toFixed(0)}%. Try reducing daily target hours slightly to build initial consistency before scaling up.`);
    } else {
      scheduleSuggestions.push(`Impressive consistency! You checked off ${completionRate.toFixed(0)}% of scheduled focus sessions. Consider adding a 15-minute 'Synthesis Review' at the end of each week to consolidate memories.`);
    }
  } else {
    scheduleSuggestions.push("Generate your first AI Study Routine! Once created, check off completed slots on the 'AI Study Routine' tab to track your academic progress.");
  }

  const hardestCourse = courses.find(c => c.difficulty === 'hard') || courses[0];
  if (hardestCourse) {
    scheduleSuggestions.push(`Prioritize spacing: Ensure study blocks for ${hardestCourse.name} are divided into multiple 60-minute intervals throughout the week, rather than one long marathon.`);
  }

  let wellbeingTip = "";
  const totalWater = wellbeingLogs && wellbeingLogs.length > 0
    ? wellbeingLogs.reduce((sum, l) => sum + l.waterIntakeCups, 0)
    : 0;
  const totalBreaks = wellbeingLogs && wellbeingLogs.length > 0
    ? wellbeingLogs.reduce((sum, l) => sum + l.breaksTaken, 0)
    : 0;
  const avgWater = wellbeingLogs && wellbeingLogs.length > 0 ? totalWater / wellbeingLogs.length : 0;

  if (wellbeingLogs && wellbeingLogs.length > 0) {
    if (avgWater < 6) {
      wellbeingTip = `Your average water intake is ${avgWater.toFixed(1)} cups daily. Hydration directly influences concentration; even mild dehydration drops cognitive focus by 10%. Place a water bottle near your study space as a physical prompt.`;
    } else if (avgSleep < 7) {
      wellbeingTip = "Your average rest time is below the recommended 7.5 hours. Memory consolidation happens during REM and deep sleep. Prioritize sleep hygiene over late-night revision to retain information.";
    } else if (totalBreaks < 4) {
      wellbeingTip = "You are working through tough material but logging few breathing breaks. Pausing for 5 minutes every hour physically resets your neurological fatigue, keeping your performance steady.";
    } else {
      wellbeingTip = "Excellent health habits! You are successfully logging high sleep, adequate water, and regular breaks. This physical baseline is the ultimate protection against burnout. Keep it up!";
    }
  } else {
    wellbeingTip = "Keep track of physical wellness indicators on the 'Burnout Prevention' tab (sleep hours, water intake, and mindful pauses) to receive personalized bio-feedback suggestions.";
  }

  return {
    masteryAnalysis,
    scheduleSuggestions,
    wellbeingTip,
    isFallback: true
  };
}

// 1. Endpoint: Generate Smart Study Schedule using Gemini
app.post("/api/generate-schedule", async (req, res) => {
  try {
    const { courses, timetable, preferences } = req.body;

    if (!courses || !Array.isArray(courses) || courses.length === 0) {
      return res.status(400).json({ error: "Courses array is required and cannot be empty." });
    }

    try {
      const ai = getGeminiClient();

      // System prompt describing the constraints and desired scheduling logic
      const systemInstruction = `You are an expert academic advisor and cognitive science-based scheduling assistant.
Your goal is to build a highly optimized, weekly personal study schedule for a university student.
The student has courses, an official university timetable of lectures/labs, and personal preferences.

CRITICAL RULES:
1. NO CONFLICTS: You MUST NEVER schedule study sessions during the times the student has classes (lectures, labs, tutorials) listed in their Timetable.
2. WORKLOAD BALANCE: Distribute study sessions evenly throughout the week.
3. SUBJECT PRIORITIZATION: Prioritize courses with higher credit hours and higher perceived difficulty (easy, medium, hard). Harder or high-credit courses should get more frequent and longer study sessions.
4. STUDY PREFERENCES: Respect the student's study window preferences (e.g., Morning: 08:00-12:00, Afternoon: 12:00-17:00, Evening: 17:00-22:00).
5. WELL-BEING BREAKS: Automatically schedule well-being breaks (10 to 20 minutes) inside or immediately following long sessions to support mental health, prevent burnout, and support Pomodoro principles.
6. LOGICAL TIMING: Session times must be in 'HH:MM' 24-hour format (e.g. 14:00 to 15:30).
7. FOCUS TOPICS: Provide helpful, concrete study objectives or focal topics for each session based on the course outlines/objectives (e.g., "Review fundamental theorems and practice set theory" or "Draft outline of research proposal").
8. DAY STRUCURE: Ensure days are Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday.

Return a JSON array of scheduled slots.`;

      const promptText = `
Student Courses:
${JSON.stringify(courses, null, 2)}

Official University Timetable (Lectures/Labs to Avoid):
${JSON.stringify(timetable, null, 2)}

Study Preferences:
- Study hours per day target: ${preferences?.dailyHoursTarget || 3} hours
- Prefer studying during: ${preferences?.timeOfDayPreference || "Evening"}
- Include weekend study? ${preferences?.includeWeekends ? "Yes" : "No"}
- Target study pace: ${preferences?.pace || "balanced"} (e.g. focused, intensive, spaced)

Based on these details, generate a weekly study schedule. Every course MUST have at least one study session. Schedule between 8 to 20 events in total for the week depending on the study hour targets.
Include well-being breaks as separate items in the array (with courseId set to "break" and type set to "break").
Include specific, actionable focus topics.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: promptText,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                courseId: {
                  type: Type.STRING,
                  description: "The ID of the course this study session belongs to, or 'break' for a wellbeing/burnout prevention slot.",
                },
                title: {
                  type: Type.STRING,
                  description: "Short title of the session, e.g. 'Advanced Calc Study Session' or 'Mental Rejuvenation Break'.",
                },
                dayOfWeek: {
                  type: Type.STRING,
                  description: "Day of the week (Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday).",
                },
                startTime: {
                  type: Type.STRING,
                  description: "Start time of the session in 24h format (e.g. '09:00', '14:30').",
                },
                endTime: {
                  type: Type.STRING,
                  description: "End time of the session in 24h format (e.g. '10:30', '15:15').",
                },
                focusTopic: {
                  type: Type.STRING,
                  description: "A highly concrete, motivating study task/topic tailored to the course objectives/syllabus outline. Empty for breaks.",
                },
                type: {
                  type: Type.STRING,
                  description: "Must be 'study', 'break', or 'review'.",
                },
                durationMinutes: {
                  type: Type.INTEGER,
                  description: "Total duration in minutes.",
                }
              },
              required: ["courseId", "title", "dayOfWeek", "startTime", "endTime", "focusTopic", "type", "durationMinutes"]
            }
          }
        }
      });

      const scheduleData = JSON.parse(response.text || "[]");
      res.json({ schedule: scheduleData, isFallback: false });
    } catch (apiError: any) {
      console.log("Upstream service busy. Proceeding with local heuristic study planner.");
      const fallbackSchedule = generateFallbackSchedule(courses, timetable, preferences);
      res.json({
        schedule: fallbackSchedule,
        isFallback: true,
        message: "Offline rule-based study routine generated due to cloud traffic."
      });
    }
  } catch (error: any) {
    console.log("Outer study schedule handler caught an exception:", error.message || error);
    res.status(500).json({ error: "An exception occurred while generating the study schedule." });
  }
});

// 2. Endpoint: Suggest Adjustments/Tips based on completion rates & mastery
app.post("/api/suggest-adjustments", async (req, res) => {
  try {
    const { courses, schedule, progressLogs, wellbeingLogs } = req.body;

    if (!courses || !Array.isArray(courses)) {
      return res.status(400).json({ error: "Courses are required." });
    }

    try {
      const ai = getGeminiClient();

      const systemInstruction = `You are an encouraging academic success coach and expert tutor.
Analyze the student's study habits, course details, completion history, and wellbeing logs.
Provide a clear, brief, actionable report to optimize their routine and support mental health.
Do not exceed 3-4 bullet points. Keep it punchy, hyper-specific, and deeply supportive.`;

      const promptText = `
Courses:
${JSON.stringify(courses, null, 2)}

Weekly Study Schedule:
${JSON.stringify(schedule, null, 2)}

Recent Completed Progress Logs (Study Sessions logged):
${JSON.stringify(progressLogs, null, 2)}

Recent Well-being Logs (Mood, sleep, water, breaks):
${JSON.stringify(wellbeingLogs, null, 2)}

Please provide:
1. Specific courses where the student has high mastery versus those needing attention.
2. Suggested adjustments to their study schedule (e.g., move difficult subjects to morning, increase spacing, schedule more break frequency).
3. A personalized, encouraging well-being tip based on their water, sleep, and mood logs.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: promptText,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              masteryAnalysis: {
                type: Type.STRING,
                description: "Brief summary of which subjects are mastered well vs those needing immediate boost.",
              },
              scheduleSuggestions: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "List of 2-3 specific scheduling adjustments.",
              },
              wellbeingTip: {
                type: Type.STRING,
                description: "A tailored, supportive tip targeting their physical/mental well-being.",
              }
            },
            required: ["masteryAnalysis", "scheduleSuggestions", "wellbeingTip"]
          }
        }
      });

      const recommendations = JSON.parse(response.text || "{}");
      res.json({ ...recommendations, isFallback: false });
    } catch (apiError: any) {
      console.log("Upstream service busy. Proceeding with local heuristic coach.");
      const fallbackRecommendations = generateFallbackAdjustments(courses, schedule || [], progressLogs || [], wellbeingLogs || []);
      res.json(fallbackRecommendations);
    }
  } catch (error: any) {
    console.log("Outer suggest adjustments handler caught an exception:", error.message || error);
    res.status(500).json({ error: "An exception occurred while generating suggestions." });
  }
});

// Serve static assets / handle SPA fallback
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
