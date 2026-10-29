export type HabitType = 'do' | 'avoid' | 'measurable';
export type FrequencyType = 'daily' | 'weekdays' | 'weekly';
export type TimeSlot = 'morning' | 'afternoon' | 'evening';
export type CompletionStatus = 'done' | 'skipped' | 'failed';
export type Goal = 'Fitness' | 'Study' | 'Health' | 'Productivity' | 'Better Mornings';
export interface Preferences {
  onboardingComplete: boolean; goal: Goal | null; wakeTime: string;
  eveningReviewTime: string; theme: 'dark'; notificationsEnabled: boolean;
}
export interface Habit {
  id: string; name: string; icon: string; color: string; type: HabitType;
  target: number; unit: string; frequency: FrequencyType; weekdays: number[];
  weeklyTarget: number; timeSlot: TimeSlot; startDate: string; skipDays: string[];
  reminderEnabled: boolean; reminderTime: string | null;
  createdAt: number; updatedAt: number; paused: boolean; archived: boolean;
}
export interface Completion {
  id: string; habitId: string; date: string; status: CompletionStatus;
  value: number | null; createdAt: number; updatedAt: number;
}
export interface Routine {
  id: string; name: string; startTime: string; habitIds: string[];
  createdAt: number; updatedAt: number;
}
export interface Suggestion { id: string; kind: 'move-to-morning' | 'reduce-frequency' | 'pause' | 'lower-target'; habitId: string; reason: string; applied: boolean; dismissed: boolean; }
export interface WeeklyReport {
  id: string; weekId: string; totalCompletions: number; bestDay: string; bestStreak: number;
  lowestHabitId: string | null; suggestions: Suggestion[]; status: 'new' | 'applied' | 'dismissed';
}
export interface NewHabitInput {
  name: string; icon: string; color: string; type: HabitType; target: number; unit: string;
  frequency: FrequencyType; weekdays: number[]; weeklyTarget: number; timeSlot: TimeSlot;
  startDate: string; skipDays: string[]; reminderEnabled: boolean; reminderTime: string | null;
}
export const FREE_HABIT_LIMIT = 5;
export const FREE_ROUTINE_LIMIT = 1;
export const newHabitDefaults = (startDate: string): NewHabitInput => ({
  name: '', icon: '✓', color: '#2DD4BF', type: 'do', target: 1, unit: '',
  frequency: 'daily', weekdays: [1, 2, 3, 4, 5], weeklyTarget: 3, timeSlot: 'morning',
  startDate, skipDays: [], reminderEnabled: false, reminderTime: null,
});
