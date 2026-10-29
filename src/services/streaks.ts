import { addDays, dayOfWeek, todayKey, weekStartKey } from '../lib/dates';
import type { Completion, Habit } from '../types';

export type DayStatus = 'not-scheduled' | 'pending' | 'done' | 'partial' | 'missed' | 'skipped' | 'failed';
export function isScheduledOn(h: Habit, date: string): boolean {
  if (h.paused || h.archived || date < h.startDate) return false;
  if (h.skipDays.includes(date)) return false;
  if (h.frequency === 'daily') return true;
  if (h.frequency === 'weekdays') return h.weekdays.includes(dayOfWeek(date));
  return true; // weekly: every day is an opportunity toward the weekly target
}
export function completionFor(habitId: string, date: string, cs: Completion[]): Completion | undefined {
  return cs.find((x) => x.habitId === habitId && x.date === date);
}
export function isDone(h: Habit, comp: Completion | undefined): boolean {
  if (!comp || comp.status !== 'done') return false;
  if (h.type === 'measurable') return (comp.value ?? 0) >= h.target;
  return true;
}
export function dayStatus(h: Habit, date: string, cs: Completion[], today: string): DayStatus {
  if (!isScheduledOn(h, date)) return 'not-scheduled';
  const comp = completionFor(h.id, date, cs);
  if (comp?.status === 'skipped') return 'skipped';
  if (comp?.status === 'failed') return 'failed';
  if (comp && h.type === 'measurable' && comp.status === 'done' && (comp.value ?? 0) > 0 && (comp.value ?? 0) < h.target) return 'partial';
  if (isDone(h, comp)) return 'done';
  if (date < today) return 'missed';
  return 'pending';
}
// Weekly habits: a week counts when done-days in that week >= weeklyTarget.
function weeklyDone(h: Habit, weekStart: string, cs: Completion[]): boolean {
  let n = 0;
  for (let i = 0; i < 7; i++) { const d = addDays(weekStart, i); if (isScheduledOn(h, d) && isDone(h, completionFor(h.id, d, cs))) n++; }
  return n >= h.weeklyTarget;
}
export function computeStreak(h: Habit, cs: Completion[], today: string): number {
  if (h.frequency === 'weekly') {
    let streak = 0; let week = weekStartKey(today);
    // Current week only counts once complete; do not count an in-progress week as a break.
    if (!weeklyDone(h, week, cs)) week = addDays(week, -7);
    while (weeklyDone(h, week, cs)) { streak++; week = addDays(week, -7); }
    return streak;
  }
  let streak = 0; let d = today;
  // Today pending does not break the streak: start from yesterday if today is not done.
  if (dayStatus(h, d, cs, today) !== 'done') d = addDays(d, -1);
  while (d >= h.startDate) {
    const s = dayStatus(h, d, cs, today);
    if (s === 'done') { streak++; d = addDays(d, -1); continue; }
    if (s === 'not-scheduled' || s === 'skipped') { d = addDays(d, -1); continue; }
    break; // missed, failed, partial, pending in the past all break the streak
  }
  return streak;
}
export function computeBestStreak(h: Habit, cs: Completion[], today: string): number {
  if (h.frequency === 'weekly') {
    let best = 0; let cur = 0; let week = weekStartKey(h.startDate);
    while (week <= weekStartKey(today)) { if (weeklyDone(h, week, cs)) { cur++; best = Math.max(best, cur); } else cur = 0; week = addDays(week, 7); }
    return best;
  }
  let best = 0; let cur = 0; let d = h.startDate;
  while (d <= today) {
    const s = dayStatus(h, d, cs, today);
    if (s === 'done') { cur++; best = Math.max(best, cur); }
    else if (s === 'not-scheduled' || s === 'skipped') { /* keep cur */ }
    else cur = 0;
    d = addDays(d, 1);
  }
  return best;
}
export function completionRate(h: Habit, cs: Completion[], today: string, days = 30): number | null {
  let scheduled = 0; let done = 0;
  for (let i = days - 1; i >= 0; i--) {
    const d = addDays(today, -i);
    if (!isScheduledOn(h, d)) continue;
    scheduled++;
    if (isDone(h, completionFor(h.id, d, cs))) done++;
  }
  if (scheduled === 0) return null;
  return Math.round((done / scheduled) * 100);
}
export function missedYesterday(habits: Habit[], cs: Completion[], today: string): Habit[] {
  const y = addDays(today, -1);
  return habits.filter((h) => dayStatus(h, y, cs, today) === 'missed');
}
export function todayKeyNow(): string { return todayKey(); }
