/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Course {
  id: string;
  name: string;
  code: string;
  credits: number;
  outline: string;
  objectives: string;
  difficulty: 'easy' | 'medium' | 'hard';
  targetGrade: string;
  color: string;
}

export interface TimetableEvent {
  id: string;
  courseId: string; // can be empty or specific course
  title: string;
  dayOfWeek: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  startTime: string; // e.g. "09:00"
  endTime: string; // e.g. "10:30"
  location?: string;
  type: 'lecture' | 'lab' | 'tutorial' | 'other';
}

export interface StudyScheduleEvent {
  id: string;
  courseId: string; // Can be "break" or course ID
  title: string;
  dayOfWeek: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  startTime: string; // e.g. "14:00"
  endTime: string; // e.g. "15:30"
  focusTopic: string;
  isCompleted?: boolean;
  type: 'study' | 'break' | 'review';
  durationMinutes: number;
}

export interface StudyProgressLog {
  id: string;
  eventId: string;
  courseId: string;
  date: string; // "YYYY-MM-DD"
  durationMinutes: number;
  focusTopic: string;
  masteryRating: number; // 1-5
  notes?: string;
}

export interface WellbeingLog {
  date: string; // YYYY-MM-DD
  waterIntakeCups: number;
  breaksTaken: number;
  moodRating: number; // 1-5
  sleepHours: number;
}
