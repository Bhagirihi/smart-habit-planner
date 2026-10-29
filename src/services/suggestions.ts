import { addDays, weekStartKey } from '../lib/dates';
import { completionRate, isDone, isScheduledOn } from './streaks';
import type { Completion, Habit, Suggestion } from '../types';
import { uid } from '../lib/dates';

export interface WeekStats { totalCompletions: number; bestDay: string; bestStreak: number; lowestHabitId: string | null; }
export function previousWeekStats(habits: Habit[], cs: Completion[], today: string): WeekStats {
  const start = addDays(weekStartKey(today), -7);
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  let total = 0; let bestDay = days[0]; let bestCount = -1;
  for (const d of days) {
    const n = habits.filter((h) => isScheduledOn(h, d) && isDone(h, cs.find((x) => x.habitId === h.id && x.date === d))).length;
    total += n; if (n > bestCount) { bestCount = n; bestDay = d; }
  }
  // Best streak is computed by caller via computeBestStreak; placeholder 0 here is replaced in store.
  let lowest: string | null = null; let lowestRate = 101;
  for (const h of habits) { const r = completionRate(h, cs, today, 7); if (r !== null && r < lowestRate) { lowestRate = r; lowest = h.id; } }
  return { totalCompletions: total, bestDay, bestStreak: 0, lowestHabitId: lowest };
}
export function generateSuggestions(habits: Habit[], cs: Completion[], today: string): Suggestion[] {
  const out: Suggestion[] = [];
  for (const h of habits) {
    const rate = completionRate(h, cs, today, 14);
    if (rate === null) continue;
    // Morning vs evening: if evening habit is weak and a morning habit is strong, suggest moving it.
    if (h.timeSlot === 'evening' && rate < 50) {
      const morningStrong = habits.some((m) => m.timeSlot === 'morning' && (completionRate(m, cs, today, 14) ?? 0) >= 70);
      if (morningStrong) out.push({ id: uid(), kind: 'move-to-morning', habitId: h.id, reason: `You complete morning habits more consistently (${rate}% for this habit in the last 14 days). Consider moving it to the morning.`, applied: false, dismissed: false });
    }
    if (h.frequency === 'daily' && rate < 50) {
      out.push({ id: uid(), kind: 'reduce-frequency', habitId: h.id, reason: `This habit is at ${rate}% over the last 14 days. Try 5 days per week instead of every day.`, applied: false, dismissed: false });
    }
    if (h.type === 'measurable') {
      const partialDays = cs.filter((x) => x.habitId === h.id && x.status === 'done' && (x.value ?? 0) > 0 && (x.value ?? 0) < h.target).length;
      if (partialDays >= 3) out.push({ id: uid(), kind: 'lower-target', habitId: h.id, reason: `You logged partial progress on ${partialDays} days without reaching the target of ${h.target} ${h.unit}. A smaller target may be easier to keep.`, applied: false, dismissed: false });
    }
    if (rate < 30) out.push({ id: uid(), kind: 'pause', habitId: h.id, reason: `This is your least consistent habit (${rate}% in the last 14 days). Consider pausing it for one week — pausing is reversible and does not delete history.`, applied: false, dismissed: false });
  }
  return out.slice(0, 3);
}
