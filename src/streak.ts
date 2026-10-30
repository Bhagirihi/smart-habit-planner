// Pure streak engine — NO React Native, NO SQLite, NO Date.now() inside
// the counting logic, so it can be tested with a plain Node script.
// A streak is NEVER a stored counter: it is always computed from the
// completion history, so no midnight job, no rollover timer, and no
// "streak reset" write is ever needed. A new day simply changes what
// the same history computes to.
//
// Rules (from the spec, as implemented):
//   - Schedule: a habit's scheduled weekdays (0 = Sunday … 6 = Saturday,
//     JavaScript getDay convention). A day outside the schedule can never
//     count, break, or extend a streak.
//   - Done: a completion with status 'done' on a scheduled day counts.
//     Binary toggle = done at 100% of target. There is no partial-amount
//     tracking in this step: a partial amount is NOT a completion, and
//     partial amounts are a later step (documented in README).
//   - Skip: a completion with status 'skip' on a scheduled day does NOT
//     break the streak and does NOT count as a done day — the run simply
//     continues past it. (The UI toggle in this step only creates 'done'
//     records; 'skip' records are handled by the engine for when a Skip
//     UI exists, and for any history that contains them.)
//   - Missing: a scheduled day that has PASSED with no record breaks the
//     run to 0 at that point. A scheduled day that has NOT yet passed
//     (today, not yet done) is not a break — it just is not counted yet.
//   - Anchor: if today is done, the run ends today; otherwise it ends
//     yesterday (today not yet done, today skipped, or today unscheduled
//     all leave yesterday's run intact).
//   - Best streak: the longest run in the known history, computed with
//     the same rules. The app displays max(computed best, seeded best)
//     so seeded habits keep their historic best (e.g. water 21) even
//     though the seeded history only covers the last N days.

export type CompletionStatus = 'done' | 'skip';
export type CompletionByDate = Record<string, CompletionStatus>;

export function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

// Local YYYY-MM-DD for a Date (never UTC — a UTC date would shift the
// day for users west of UTC and break streaks at midnight).
export function toDateString(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function localToday(): string {
  return toDateString(new Date());
}

// Parse a YYYY-MM-DD string as a LOCAL date (noon, so DST transitions
// cannot shift it to a neighbouring day).
function parseLocal(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d, 12, 0, 0, 0);
}

export function addDays(dateStr: string, n: number): string {
  const d = parseLocal(dateStr);
  d.setDate(d.getDate() + n);
  return toDateString(d);
}

export function weekdayOf(dateStr: string): number {
  return parseLocal(dateStr).getDay();
}

function isScheduled(schedule: number[], dateStr: string): boolean {
  return schedule.includes(weekdayOf(dateStr));
}

// Current streak: consecutive scheduled done days ending at the anchor
// (today if done today, otherwise yesterday), skipping unscheduled days
// and skip days, stopping at the first passed scheduled day with no record.
export function computeStreak(
  completions: CompletionByDate,
  schedule: number[],
  today: string,
): number {
  const anchor = completions[today] === 'done' ? today : addDays(today, -1);
  let count = 0;
  // 10 years of history is far beyond any realistic streak; the bound
  // exists only so a corrupt schedule (e.g. empty) cannot loop forever.
  for (let i = 0; i < 3650; i++) {
    const day = addDays(anchor, -i);
    if (!isScheduled(schedule, day)) continue;
    const status = completions[day];
    if (status === 'done') {
      count++;
      continue;
    }
    if (status === 'skip') continue; // skip neither counts nor breaks
    break; // passed scheduled day with no record: run ends here
  }
  return count;
}

// Longest run in the known history, same rules, scanned forward from the
// earliest recorded date to today. Days before the first record are
// unknown, so they cannot start or break a run.
export function computeBestStreak(
  completions: CompletionByDate,
  schedule: number[],
  today: string,
): number {
  const dates = Object.keys(completions).sort();
  if (dates.length === 0) return 0;
  let best = 0;
  let current = 0;
  let day = dates[0]!;
  while (day <= today) {
    if (isScheduled(schedule, day)) {
      const status = completions[day];
      if (status === 'done') {
        current++;
        if (current > best) best = current;
      } else if (status === 'skip') {
        // neither counts nor breaks
      } else {
        current = 0; // passed scheduled day with no record
      }
    }
    if (day === today) break;
    day = addDays(day, 1);
  }
  return best;
}
