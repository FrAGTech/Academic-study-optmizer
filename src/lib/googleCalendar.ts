/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface GoogleCalendarEvent {
  summary: string;
  location?: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  reminders?: {
    useDefault: boolean;
    overrides: Array<{
      method: 'popup' | 'email';
      minutes: number;
    }>;
  };
}

/**
 * Fetches basic info about the user's primary calendar to verify access.
 */
export async function getPrimaryCalendarInfo(accessToken: string): Promise<any> {
  const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary', {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to fetch primary calendar: ${response.status}`);
  }

  return response.json();
}

/**
 * Inserts a single event into the primary calendar.
 */
export async function createCalendarEvent(
  accessToken: string,
  event: GoogleCalendarEvent
): Promise<any> {
  const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(event),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to create event: ${response.status}`);
  }

  return response.json();
}

/**
 * Helper to calculate the absolute Date for a specific day of the week,
 * relative to a given starting Monday.
 */
export function getDateForDayOfWeek(
  startOfWeek: Date,
  dayOfWeek: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday'
): Date {
  const dayIndices: Record<string, number> = {
    'Monday': 0,
    'Tuesday': 1,
    'Wednesday': 2,
    'Thursday': 3,
    'Friday': 4,
    'Saturday': 5,
    'Sunday': 6,
  };

  const targetIndex = dayIndices[dayOfWeek] ?? 0;
  
  // Clone the startOfWeek date
  const resultDate = new Date(startOfWeek.getTime());
  
  // Find current Monday index
  // Note: startOfWeek is assumed to be a Monday. Let's force-set it or adjust index relative to it.
  resultDate.setDate(resultDate.getDate() + targetIndex);
  return resultDate;
}

/**
 * Formats a Date object and "HH:MM" string into an ISO string for Google Calendar,
 * while preserving the correct calendar timezone format.
 */
export function formatDateTimeISO(date: Date, timeStr: string): string {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const result = new Date(date.getTime());
  result.setHours(hours, minutes, 0, 0);
  
  // Return format: YYYY-MM-DDTHH:mm:ss
  const pad = (n: number) => n.toString().padStart(2, '0');
  
  const yyyy = result.getFullYear();
  const mm = pad(result.getMonth() + 1);
  const dd = pad(result.getDate());
  const hh = pad(result.getHours());
  const min = pad(result.getMinutes());
  const ss = pad(result.getSeconds());
  
  return `${yyyy}-${mm}-${dd}T${hh}:${min}:${ss}`;
}
