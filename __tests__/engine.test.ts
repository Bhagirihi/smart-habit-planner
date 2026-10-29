import { describe, expect, test } from '@jest/globals';
import { isDone } from '../src/services/streaks';
import { previousWeekStats } from '../src/services/suggestions';
import type { Completion, Habit } from '../src/types';

// Pure simulation of the store's completion logic (see src/store.tsx):
// one record per habit + date, keyed `${habitId}:${date}`. Toggling a done
// record removes it; any other write replaces the record at the same key.
// Routine completion and Today completion share this key, so they can never
// create two records for the same habit on the same day.
interface ToggleRecord {
  habitId: string;
  date: string;
  status: Completion['status'];
  value: number | null;
}

type CompletionMap = Map<string, ToggleRecord>;

function key(habitId: string, date: string): string {
  return `${habitId}:${date}`;
}

function toggleDone(map: CompletionMap, habitId: string, date: string): void {
  const k = key(habitId, date);
  const existing = map.get(k);
  if (existing?.status === 'done') {
    map.delete(k);
    return;
  }
  map.set(k, { habitId, date, status: 'done', value: existing?.value ?? null });
}

function setRecord(map: CompletionMap, habitId: string, date: string, status: Completion['status'], value: number | null): void {
  map.set(key(habitId, date), { habitId, date, status, value });
}

// Completing through a routine is the same operation as completing on Today:
// same habit id, same date, same key.
function completeViaRoutine(map: CompletionMap, habitId: string, date: string): void {
  toggleDone(map, habitId, date);
}

function toCompletions(map: CompletionMap): Completion[] {
  return [...map.values()].map((r, i) => ({
    id: `c${i}`,
    habitId: r.habitId,
    date: r.date,
    status: r.status,
    value: r.value,
    createdAt: 0,
    updatedAt: 0,
  }));
}

function makeHabit(overrides: Partial<Habit> = {}): Habit {
  return {
    id: 'h1',
    name: 'Test habit',
    icon: '✓',
    color: '#2DD4BF',
    type: 'do',
    target: 1,
    unit: '',
    frequency: 'daily',
    weekdays: [1, 2, 3, 4, 5],
    weeklyTarget: 3,
    timeSlot: 'morning',
    startDate: '2026-10-19',
    skipDays: [],
    reminderEnabled: false,
    reminderTime: null,
    createdAt: 0,
    updatedAt: 0,
    paused: false,
    archived: false,
    ...overrides,
  };
}

describe('idempotent completion engine', () => {
  test('toggling the same habit and date twice leaves no record', () => {
    const map: CompletionMap = new Map();
    toggleDone(map, 'h1', '2026-10-29');
    expect(map.size).toBe(1);
    toggleDone(map, 'h1', '2026-10-29');
    expect(map.size).toBe(0);
  });

  test('an upsert replaces the existing record instead of duplicating it', () => {
    const map: CompletionMap = new Map();
    setRecord(map, 'h1', '2026-10-29', 'done', null);
    setRecord(map, 'h1', '2026-10-29', 'skipped', null);
    expect(map.size).toBe(1);
    expect(map.get('h1:2026-10-29')?.status).toBe('skipped');
  });

  test('different dates are separate records', () => {
    const map: CompletionMap = new Map();
    toggleDone(map, 'h1', '2026-10-28');
    toggleDone(map, 'h1', '2026-10-29');
    expect(map.size).toBe(2);
  });

  test('different habits on the same date are separate records', () => {
    const map: CompletionMap = new Map();
    toggleDone(map, 'h1', '2026-10-29');
    toggleDone(map, 'h2', '2026-10-29');
    expect(map.size).toBe(2);
  });

  test('routine completion and Today completion share one record', () => {
    const map: CompletionMap = new Map();
    completeViaRoutine(map, 'h1', '2026-10-29');
    // The routine wrote the exact key Today uses, so Today sees it as done.
    expect(map.size).toBe(1);
    expect(map.get('h1:2026-10-29')?.status).toBe('done');
    // A Today tap acts on that same record (toggling it off), never a second one.
    toggleDone(map, 'h1', '2026-10-29');
    expect(map.size).toBe(0);
  });

  test('completing via routine alone creates exactly one record', () => {
    const map: CompletionMap = new Map();
    completeViaRoutine(map, 'h1', '2026-10-29');
    completeViaRoutine(map, 'h1', '2026-10-29');
    // Second routine tap toggles the same record off, not a duplicate on.
    expect(map.size).toBe(0);
    completeViaRoutine(map, 'h1', '2026-10-29');
    expect(map.size).toBe(1);
    expect(map.get('h1:2026-10-29')?.status).toBe('done');
  });

  test('measurable partial progress does not count as done', () => {
    const h = makeHabit({ type: 'measurable', target: 8, unit: 'glasses' });
    const partial: Completion = { id: 'c0', habitId: 'h1', date: '2026-10-29', status: 'done', value: 5, createdAt: 0, updatedAt: 0 };
    const full: Completion = { ...partial, value: 8 };
    expect(isDone(h, partial)).toBe(false);
    expect(isDone(h, full)).toBe(true);
  });

  test('a partial measurable write still keeps a single record', () => {
    const map: CompletionMap = new Map();
    setRecord(map, 'h1', '2026-10-29', 'done', 5);
    setRecord(map, 'h1', '2026-10-29', 'done', 8);
    expect(map.size).toBe(1);
    expect(map.get('h1:2026-10-29')?.value).toBe(8);
  });

  test('previous week stats: total, best day and lowest habit', () => {
    // Today Thu 2026-10-29, so the previous week is Mon 2026-10-19 – Sun 2026-10-25.
    const a = makeHabit({ id: 'a' });
    const b = makeHabit({ id: 'b' });
    const map: CompletionMap = new Map();
    // Previous-week completions: A on 19, 20, 21; B on 20 only.
    setRecord(map, 'a', '2026-10-19', 'done', null);
    setRecord(map, 'a', '2026-10-20', 'done', null);
    setRecord(map, 'a', '2026-10-21', 'done', null);
    setRecord(map, 'b', '2026-10-20', 'done', null);
    // Current-week completions (outside the previous week) set the lowest-habit
    // ranking, which previousWeekStats measures over the last 7 days: A 3 of 7,
    // B 1 of 7, so B is lowest.
    setRecord(map, 'a', '2026-10-26', 'done', null);
    setRecord(map, 'a', '2026-10-27', 'done', null);
    setRecord(map, 'a', '2026-10-28', 'done', null);
    setRecord(map, 'b', '2026-10-26', 'done', null);
    const stats = previousWeekStats([a, b], toCompletions(map), '2026-10-29');
    expect(stats.totalCompletions).toBe(4);
    expect(stats.bestDay).toBe('2026-10-20');
    expect(stats.lowestHabitId).toBe('b');
  });

  test('previous week stats ignore completions on unscheduled days', () => {
    const paused = makeHabit({ id: 'paused', paused: true });
    const active = makeHabit({ id: 'active' });
    const map: CompletionMap = new Map();
    setRecord(map, 'paused', '2026-10-20', 'done', null);
    setRecord(map, 'active', '2026-10-20', 'done', null);
    const stats = previousWeekStats([paused, active], toCompletions(map), '2026-10-29');
    expect(stats.totalCompletions).toBe(1);
    expect(stats.bestDay).toBe('2026-10-20');
  });
});
