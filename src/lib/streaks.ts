import type { CheckIns, Habit } from '../types';
import { addDays, dayOfWeek, todayKey, weekStartKey } from './dates';
import { checkInKey } from '../types';

export function isDueOn(habit: Habit, date: string): boolean {
  if (habit.paused) return false;
  if (date < habit.createdAt) return false;
  const f = habit.frequency;
  if (f.kind === 'daily') return true;
  if (f.kind === 'weekdays') return f.days.includes(dayOfWeek(date));
  return true; // timesPerWeek: due every day, completion judged per week
}

export function isDone(habit: Habit, date: string, checkIns: CheckIns): boolean {
  const v = checkIns[checkInKey(habit.id, date)];
  if (v === undefined) return false;
  return v >= habit.target;
}

export function isSkipped(habit: Habit, date: string): boolean {
  return habit.skipDates.includes(date);
}

/** Status for one habit on one date: done / skipped / missed (past, due, undone) / upcoming / not-due. */
export function dayStatus(
  habit: Habit,
  date: string,
  checkIns: CheckIns,
  today: string,
): 'done' | 'skipped' | 'missed' | 'pending' | 'not-due' {
  if (!isDueOn(habit, date)) return 'not-due';
  if (isSkipped(habit, date)) return 'skipped';
  if (isDone(habit, date, checkIns)) return 'done';
  if (date < today) return 'missed';
  return 'pending';
}

function weeklyDone(habit: Habit, weekStart: string, checkIns: CheckIns): boolean {
  if (habit.frequency.kind !== 'timesPerWeek') return false;
  let count = 0;
  for (let i = 0; i < 7; i++) {
    const d = addDays(weekStart, i);
    if (isDone(habit, d, checkIns)) count += 1;
  }
  return count >= habit.frequency.count;
}

/**
 * Current streak.
 * - daily / weekdays: consecutive due days ending today (if today is done) or
 *   yesterday (if today is still pending). A past undone due day breaks it.
 *   Planned skips neither count nor break.
 * - timesPerWeek: consecutive weeks meeting the target, same today/yesterday rule.
 */
export function computeStreak(habit: Habit, checkIns: CheckIns, today: string = todayKey()): number {
  if (habit.frequency.kind === 'timesPerWeek') {
    let streak = 0;
    let week = weekStartKey(today);
    if (!weeklyDone(habit, week, checkIns)) week = addDays(week, -7);
    while (weeklyDone(habit, week, checkIns)) {
      streak += 1;
      week = addDays(week, -7);
    }
    return streak;
  }
  let streak = 0;
  let cursor = today;
  // If today is due and not done yet, the streak is still alive from yesterday.
  if (isDueOn(habit, cursor) && !isSkipped(habit, cursor) && !isDone(habit, cursor, checkIns)) {
    cursor = addDays(cursor, -1);
  }
  for (let guard = 0; guard < 3650; guard++) {
    if (cursor < habit.createdAt) break;
    if (isSkipped(habit, cursor)) {
      cursor = addDays(cursor, -1);
      continue;
    }
    if (!isDueOn(habit, cursor)) {
      cursor = addDays(cursor, -1);
      continue;
    }
    if (isDone(habit, cursor, checkIns)) {
      streak += 1;
      cursor = addDays(cursor, -1);
      continue;
    }
    break; // missed due day breaks the streak
  }
  return streak;
}

export function computeBestStreak(habit: Habit, checkIns: CheckIns, today: string = todayKey()): number {
  if (habit.frequency.kind === 'timesPerWeek') {
    let best = 0;
    let run = 0;
    let week = weekStartKey(habit.createdAt);
    const last = weekStartKey(today);
    while (week <= last) {
      if (weeklyDone(habit, week, checkIns)) {
        run += 1;
        best = Math.max(best, run);
      } else if (week !== last) {
        run = 0;
      }
      week = addDays(week, 7);
    }
    return best;
  }
  let best = 0;
  let run = 0;
  let cursor = habit.createdAt;
  while (cursor <= today) {
    if (isSkipped(habit, cursor) || !isDueOn(habit, cursor)) {
      cursor = addDays(cursor, 1);
      continue;
    }
    if (isDone(habit, cursor, checkIns)) {
      run += 1;
      best = Math.max(best, run);
    } else {
      run = 0;
    }
    cursor = addDays(cursor, 1);
  }
  return best;
}

/** Completion % over the last `days` due days (skips excluded). Null when no due days. */
export function completionRate(habit: Habit, checkIns: CheckIns, today: string, days: number): number | null {
  let due = 0;
  let done = 0;
  for (let i = days - 1; i >= 0; i--) {
    const d = addDays(today, -i);
    if (!isDueOn(habit, d) || isSkipped(habit, d)) continue;
    due += 1;
    if (isDone(habit, d, checkIns)) done += 1;
  }
  if (due === 0) return null;
  return Math.round((done / due) * 100);
}

/** Yesterday's missed habits (due, not skipped, not done) - used for the Today banner. */
export function missedYesterday(habits: Habit[], checkIns: CheckIns, today: string): Habit[] {
  const y = addDays(today, -1);
  return habits.filter((h) => dayStatus(h, y, checkIns, today) === 'missed');
}
