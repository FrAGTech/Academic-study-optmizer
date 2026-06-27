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

// 1. Endpoint: Generate Smart Study Schedule using Gemini
app.post("/api/generate-schedule", async (req, res) => {
  try {
    const { courses, timetable, preferences } = req.body;

    if (!courses || !Array.isArray(courses) || courses.length === 0) {
      return res.status(400).json({ error: "Courses array is required and cannot be empty." });
    }

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
    res.json({ schedule: scheduleData });
  } catch (error: any) {
    console.error("Error generating study schedule:", error);
    res.status(500).json({ error: error.message || "An error occurred while generating the schedule." });
  }
});

// 2. Endpoint: Suggest Adjustments/Tips based on completion rates & mastery
app.post("/api/suggest-adjustments", async (req, res) => {
  try {
    const { courses, schedule, progressLogs, wellbeingLogs } = req.body;

    if (!courses || !Array.isArray(courses)) {
      return res.status(400).json({ error: "Courses are required." });
    }

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
    res.json(recommendations);
  } catch (error: any) {
    console.error("Error suggesting adjustments:", error);
    res.status(500).json({ error: error.message || "An error occurred while suggesting adjustments." });
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
