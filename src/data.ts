import type { Habit, Routine, Suggestion } from './theme';

// Static UI-only data. Nothing here is saved, synced, or sent anywhere.
// Reloading the app resets every toggle below to these values.
export const HABITS: Habit[] = [
  { id: 'water', name: 'Drink water', icon: '💧', color: '#60A5FA', slot: 'morning', streak: 12, bestStreak: 21, rate: 86, target: '8 glasses', reminder: '7:30 AM' },
  { id: 'run', name: 'Morning run', icon: '🏃', color: '#34D399', slot: 'morning', streak: 7, bestStreak: 14, rate: 74, target: '20 min', reminder: '6:30 AM' },
  { id: 'read', name: 'Read 20 pages', icon: '📖', color: '#FBBF24', slot: 'evening', streak: 9, bestStreak: 18, rate: 81, target: '20 pages', reminder: '9:00 PM' },
  { id: 'meditate', name: 'Meditate', icon: '🧘', color: '#A78BFA', slot: 'morning', streak: 5, bestStreak: 11, rate: 68, target: '10 min', reminder: '7:00 AM' },
  { id: 'journal', name: 'Evening journal', icon: '✍️', color: '#FB7185', slot: 'evening', streak: 4, bestStreak: 9, rate: 62, target: '5 lines', reminder: '9:30 PM' },
  { id: 'walk', name: 'Walk 6,000 steps', icon: '👣', color: '#2DD4BF', slot: 'afternoon', streak: 15, bestStreak: 26, rate: 91, target: '6,000 steps', reminder: '2:00 PM' },
];
// Session-start completed set: 3 of 5 shown as done on Today (matches the ring).
export const INITIAL_DONE = new Set<string>(['water', 'run', 'walk']);
export const ROUTINES: Routine[] = [
  { id: 'morning', name: 'Morning routine', startTime: '6:30 AM', percent: 67, habitIds: ['run', 'meditate', 'water'] },
  { id: 'evening', name: 'Wind down', startTime: '9:00 PM', percent: 50, habitIds: ['read', 'journal'] },
];
export const SUGGESTIONS: Suggestion[] = [
  { id: 's1', habitId: 'journal', title: 'Move Evening journal to the morning', reason: 'Lowest completion this week — mornings work better for this habit.', state: 'new' },
  { id: 's2', habitId: 'meditate', title: 'Lower Meditate target to 5 min', reason: 'Shorter targets are easier to keep on busy days.', state: 'new' },
  { id: 's3', habitId: 'walk', title: 'Keep Walk 6,000 steps as it is', reason: 'Your strongest habit this week — no change suggested.', state: 'new' },
];
export const STARTER_HABITS = [
  { id: 'water', name: 'Drink water', icon: '💧' },
  { id: 'run', name: 'Morning run', icon: '🏃' },
  { id: 'read', name: 'Read 20 pages', icon: '📖' },
  { id: 'meditate', name: 'Meditate', icon: '🧘' },
  { id: 'walk', name: 'Walk 6,000 steps', icon: '👣' },
];
// Deterministic heatmap cell: 0 = unscheduled/faint, 1 = missed, 2 = partial, 3 = done.
export function heatCell(habitId: string, index: number): number {
  let h = 0;
  for (let i = 0; i < habitId.length; i++) h = (h * 31 + habitId.charCodeAt(i)) % 997;
  return (h + index * 7) % 4;
}
export function heatColor(cell: number, color: string): string {
  if (cell === 3) return color;
  if (cell === 2) return '#34D399';
  if (cell === 1) return '#0F1E1B';
  return '#1B2F2B';
}
export const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
export const WEEK_DATES = ['27', '28', '29', '30', '31', '1', '2'];
// Static demo value — real value comes from subscription later.
// Do NOT present this as a real trial start/end date, subscription, or account.
export const FREE_TIER_DAYS_LEFT = 12;
export const FREE_HABIT_LIMIT = 5;
export const FREE_ROUTINE_LIMIT = 1;
// Last-7-days grid cell for the widget: 'done' | 'missed' | 'partial' | 'faint'.
// Days 0-5 are deterministic static history; day 6 is today and is decided
// by the session done-set at render time (see WidgetCard).
export function last7Cell(habitId: string, dayIndex: number): 'done' | 'missed' | 'partial' | 'faint' {
  const cell = heatCell(habitId, dayIndex);
  if (cell === 3) return 'done';
  if (cell === 2) return 'partial';
  if (cell === 1) return 'missed';
  return 'faint';
}
export function last7Color(state: 'done' | 'missed' | 'partial' | 'faint', color: string): string {
  if (state === 'done') return color;
  if (state === 'partial') return '#34D399';
  if (state === 'missed') return '#0F1E1B';
  return '#1B2F2B';
}
