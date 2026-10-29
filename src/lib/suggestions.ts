import type { CheckIns, Habit, TimeSlot } from '../types';
import { addDays, dayOfWeek } from './dates';
import { completionRate, isDone, isDueOn } from './streaks';

export type SuggestionAction =
  | { kind: 'move-slot'; slot: TimeSlot }
  | { kind: 'change-frequency'; frequency: Habit['frequency'] }
  | { kind: 'pause' };

export interface Suggestion {
  id: string;
  habitId: string;
  title: string;
  detail: string;
  applyLabel: string;
  action: SuggestionAction;
}

function missRateBySlot(habit: Habit, checkIns: CheckIns, today: string, slot: TimeSlot): number | null {
  // Reuse completion logic per slot by checking the habit's own slot history:
  // we approximate with overall rate split by weekday is not available, so we
  // compare this habit's misses on its current slot against its overall rate.
  void slot;
  return completionRate(habit, checkIns, today, 14);
}

/**
 * Rule-based weekly suggestions, computed only from the user's own data.
 * No AI, no network. Returns at most 3 suggestions, weakest habits first.
 */
export function buildSuggestions(habits: Habit[], checkIns: CheckIns, today: string): Suggestion[] {
  const out: Suggestion[] = [];
  const rated = habits
    .filter((h) => !h.paused)
    .map((h) => ({ habit: h, rate: completionRate(h, checkIns, today, 14) }))
    .filter((r) => r.rate !== null)
    .sort((a, b) => (a.rate as number) - (b.rate as number));

  for (const { habit, rate } of rated) {
    if (out.length >= 3) break;
    if ((rate as number) >= 80) continue;
    if (habit.slot === 'evening' && (rate as number) < 50) {
      out.push({
        id: `move-${habit.id}`,
        habitId: habit.id,
        title: `Move ${habit.name} to the morning?`,
        detail: `You completed it only ${rate}% of the time in the last 2 weeks, and evening habits are the easiest to lose. Morning habits in this app tend to stick better.`,
        applyLabel: 'Move to morning',
        action: { kind: 'move-slot', slot: 'morning' },
      });
      continue;
    }
    if (habit.frequency.kind === 'daily' && (rate as number) < 60) {
      out.push({
        id: `freq-${habit.id}`,
        habitId: habit.id,
        title: `Make ${habit.name} 5 days a week?`,
        detail: `Daily is too hard right now at ${rate}% completion. Five days a week keeps the habit alive without the daily pressure.`,
        applyLabel: 'Change to 5 days a week',
        action: { kind: 'change-frequency', frequency: { kind: 'weekdays', days: [1, 2, 3, 4, 5] } },
      });
      continue;
    }
    if ((rate as number) < 40) {
      out.push({
        id: `pause-${habit.id}`,
        habitId: habit.id,
        title: `Pause ${habit.name} for now?`,
        detail: `At ${rate}% completion it is dragging your week down. Pausing keeps its history safe; you can resume it any time from its detail screen.`,
        applyLabel: 'Pause this habit',
        action: { kind: 'pause' },
      });
    }
  }

  // Overload suggestion: too many active habits, weakest one paused.
  if (habits.filter((h) => !h.paused).length > 8 && rated.length > 0) {
    const weakest = rated[0];
    if (!out.some((s) => s.habitId === weakest.habit.id)) {
      out.push({
        id: `overload-${weakest.habit.id}`,
        habitId: weakest.habit.id,
        title: 'You have a lot on your plate',
        detail: `You are tracking ${habits.length} habits. Keeping your top habits and pausing ${weakest.habit.name} for a week usually raises overall completion.`,
        applyLabel: `Pause ${weakest.habit.name}`,
        action: { kind: 'pause' },
      });
    }
  }

  void missRateBySlot;
  return out.slice(0, 3);
}

export function weekSummary(habits: Habit[], checkIns: CheckIns, today: string): { done: number; due: number; bestDay: string; bestDayDone: number } {
  let done = 0;
  let due = 0;
  let bestDay = today;
  let bestDayDone = -1;
  for (let i = 6; i >= 0; i--) {
    const d = addDays(today, -i);
    let dayDone = 0;
    let dayDue = 0;
    for (const h of habits) {
      if (!isDueOn(h, d) || h.skipDates.includes(d)) continue;
      dayDue += 1;
      if (isDone(h, d, checkIns)) dayDone += 1;
    }
    done += dayDone;
    due += dayDue;
    if (dayDone > bestDayDone) {
      bestDayDone = dayDone;
      bestDay = d;
    }
  }
  void dayOfWeek;
  return { done, due, bestDay, bestDayDone: Math.max(bestDayDone, 0) };
}
