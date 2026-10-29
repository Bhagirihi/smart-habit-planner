export type TimeSlot = 'morning' | 'afternoon' | 'evening';
export type HabitType = 'do' | 'avoid' | 'measurable';
export type Frequency =
  | { kind: 'daily' }
  | { kind: 'weekdays'; days: number[] } // 0 = Sunday .. 6 = Saturday
  | { kind: 'timesPerWeek'; count: number };

export interface Habit {
  id: string;
  name: string;
  color: string;
  type: HabitType;
  target: number; // for measurable: amount needed; for do/avoid: 1
  unit: string; // e.g. "glasses", "pages", "" for do/avoid
  frequency: Frequency;
  slot: TimeSlot;
  reminderTime: string | null; // "07:00"
  reminderEnabled: boolean;
  skipDates: string[]; // YYYY-MM-DD planned skips
  paused: boolean;
  createdAt: string; // YYYY-MM-DD
}

export interface Routine {
  id: string;
  name: string;
  startTime: string; // "06:30"
  habitIds: string[];
  createdAt: string;
}

/** Key: `${habitId}|${date}` -> value logged that day (1 for do/avoid, amount for measurable). */
export type CheckIns = Record<string, number>;

export interface Settings {
  goal: string;
  wakeTime: string;
  notificationsEnabled: boolean;
  eveningReviewTime: string; // "21:00"
  premiumDemo: boolean; // demo-only preview switch in Settings; NOT a purchase
}

export interface AppState {
  onboarded: boolean;
  habits: Habit[];
  routines: Routine[];
  checkIns: CheckIns;
  settings: Settings;
}

export const FREE_HABIT_LIMIT = 5;
export const FREE_ROUTINE_LIMIT = 1;

export function checkInKey(habitId: string, date: string): string {
  return `${habitId}|${date}`;
}
