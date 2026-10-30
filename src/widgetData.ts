// Live home-widget data (STEP 6) — pure logic, no React Native, no
// Supabase, no widget runtime. App.tsx computes the snapshot from app
// state with this file; src/widgets/HabitWidget.tsx only renders the
// snapshot props it receives. Nothing here invents history, streaks,
// or steps: a day's status comes only from real completion rows.
//
// Week status rule (documented, because the widget has one circle per
// day, not one per habit):
//   - The week is Monday-first, in LOCAL dates (never UTC).
//   - A future day is 'future', today is always 'today' (amber,
//     in-progress, even if some habits are already done today).
//   - A past day is 'done' if ANY habit has a 'done' completion that
//     day, otherwise 'missed' (grey). A day with only 'skip' records
//     and no 'done' record therefore renders as 'missed' in the
//     widget — the widget has no skip colour, and no habit was
//     completed that day. Skip still neither counts nor breaks the
//     streak (see src/streak.ts); this is only the widget circle.
//   - Source: 'real' when App has loaded completion history from
//     Supabase (configured + signed in), 'static' otherwise. Static
//     mode keeps the app's long-standing fictional week
//     (Mon–Wed done, Thu today, Fri–Sun future) — it is a fallback,
//     not a claim about real history.

export type WeekStatus = 'done' | 'today' | 'missed' | 'future';

export type DayCompletion = 'done' | 'skip';

// One aggregated status per local date: 'done' wins over 'skip' when a
// day has both (at least one habit was completed that day).
export type DayCompletionMap = Record<string, DayCompletion>;

export const STATIC_WEEK_STATUS: WeekStatus[] = [
  'done',
  'done',
  'done',
  'today',
  'future',
  'future',
  'future',
];

// LEGACY ONLY — the compile-time initialProps fallback in
// HabitWidget.tsx (shown only before the app ever sends a snapshot,
// which happens on launch). Do NOT use this for any on-screen week:
// on-screen weeks always come from computeWeekStatus (real history)
// or staticFallbackWeek (below), both of which use the real local
// date. STATIC_TODAY_INDEX = 3 is the old hardcoded Thursday.
export const STATIC_TODAY_INDEX = 3;

// Static fallback week for when no real history exists (unconfigured
// or unsigned-in). It is STILL a fallback — the statuses are not real
// history — but its today index and today circle are REAL: days
// before today show 'done', today shows 'today', days after today
// show 'future', for the Monday-first week containing the real
// local date. Never hardcode Thursday (or any other weekday) here:
// today is always available, so there is no reason to guess it.
export function staticFallbackWeek(today: string): {
  status: WeekStatus[];
  todayIndex: number;
} {
  const todayIndex = todayIndexInWeek(today);
  const status: WeekStatus[] = [];
  for (let i = 0; i < 7; i++) {
    status.push(i < todayIndex ? 'done' : i === todayIndex ? 'today' : 'future');
  }
  return { status, todayIndex };
}

export function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

export function toDateString(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function localTodayString(): string {
  return toDateString(new Date());
}

function parseLocal(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d, 12, 0, 0, 0);
}

export function addDaysString(dateStr: string, n: number): string {
  const d = parseLocal(dateStr);
  d.setDate(d.getDate() + n);
  return toDateString(d);
}

// Monday-first: index of `today` within its Mon–Sun week (0 = Monday).
export function todayIndexInWeek(today: string): number {
  const day = parseLocal(today).getDay(); // 0 = Sunday … 6 = Saturday
  return (day + 6) % 7;
}

// Monday of the week containing `today`, as a local YYYY-MM-DD string.
export function mondayOfWeek(today: string): string {
  return addDaysString(today, -todayIndexInWeek(today));
}

// Real week status from an aggregated day-completion map. Returns 7
// statuses, Monday first, plus the index of today within that week.
export function computeWeekStatus(
  dayMap: DayCompletionMap,
  today: string,
): { status: WeekStatus[]; todayIndex: number } {
  const todayIndex = todayIndexInWeek(today);
  const monday = mondayOfWeek(today);
  const status: WeekStatus[] = [];
  for (let i = 0; i < 7; i++) {
    const date = addDaysString(monday, i);
    if (date > today) {
      status.push('future');
    } else if (date === today) {
      status.push('today');
    } else {
      status.push(dayMap[date] === 'done' ? 'done' : 'missed');
    }
  }
  return { status, todayIndex };
}

// Aggregate per-habit completion rows into one status per day:
// 'done' if any habit was done that day, else 'skip' if any habit was
// skipped that day, else absent (no record that day).
export function aggregateDayCompletions(
  rows: { date: string; status: 'done' | 'skip' }[],
): DayCompletionMap {
  const out: DayCompletionMap = {};
  for (const row of rows) {
    if (row.status === 'done') {
      out[row.date] = 'done';
    } else if (out[row.date] !== 'done') {
      out[row.date] = 'skip';
    }
  }
  return out;
}

export interface WidgetSnapshot {
  doneCount: number;
  total: number;
  percent: number;
  doneNames: string;
  weekStatus: WeekStatus[];
  todayIndex: number;
}

// The snapshot the widget shows before the app ever sends one
// (initialProps in HabitWidget): the long-standing static values.
export const INITIAL_WIDGET_SNAPSHOT: WidgetSnapshot = {
  doneCount: 3,
  total: 6,
  percent: 50,
  doneNames: 'Drink water · Morning run · Walk',
  weekStatus: [...STATIC_WEEK_STATUS],
  todayIndex: STATIC_TODAY_INDEX,
};
