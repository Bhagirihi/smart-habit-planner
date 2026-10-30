// Pure heatmap helpers for the Habits grid, unit-tested in
// __tests__/heatmap.test.ts. All cells come from real completion records;
// nothing here invents data.
import { addDays, todayKey } from './dates';
import { dayStatus } from '../services/streaks';
import type { Completion, Habit } from '../types';
import { c } from '../theme';

export type CellState = 'done' | 'partial' | 'missed' | 'unscheduled' | 'pending' | 'future';

export function cellState(habit: Habit, date: string, completions: Completion[], today: string): CellState {
  if (date > today) return 'future';
  const status = dayStatus(habit, date, completions, today);
  if (status === 'done') return 'done';
  if (status === 'partial') return 'partial';
  if (status === 'missed' || status === 'failed') return 'missed';
  if (status === 'not-scheduled' || status === 'skipped') return 'unscheduled';
  return 'pending';
}

// Background colour for a cell. Done cells use the full habit colour, never
// a pale wash; missed scheduled cells use the dark surface-alt; partial
// days use the accent green so they are never mistaken for a full day.
export function cellColor(state: CellState, habitColor: string): string {
  if (state === 'done') return habitColor;
  if (state === 'partial') return c.accent;
  if (state === 'missed') return c.surfaceAlt;
  return c.surfaceAlt;
}

export interface HeatMonth { key: string; label: string; days: string[] }

// Last 6 months ending today, grouped by month, oldest month first.
// Example: today 2026-10-30 gives May..October 2026.
export function monthsForWindow(today: string, monthsBack = 5): HeatMonth[] {
  const now = new Date(`${today}T12:00:00`);
  const start = new Date(now.getFullYear(), now.getMonth() - monthsBack, 1);
  const startKey = todayKey(start);
  const months: HeatMonth[] = [];
  let d = startKey;
  while (d <= today) {
    const key = d.slice(0, 7);
    const label = new Date(`${d}T12:00:00`).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
    const last = months[months.length - 1];
    if (last && last.key === key) last.days.push(d);
    else months.push({ key, label, days: [d] });
    d = addDays(d, 1);
  }
  return months;
}
