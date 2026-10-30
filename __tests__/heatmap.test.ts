import { describe, expect, test } from '@jest/globals';
import { cellState, monthsForWindow } from '../src/lib/heatmap';
import { HABIT_ICONS } from '../src/theme';
import type { Completion, Habit } from '../src/types';

const habit: Habit = {
  id: 'h1', name: 'Drink Water', icon: '💧', color: '#2DD4BF', type: 'do',
  target: 1, unit: '', frequency: 'daily', weekdays: [], weeklyTarget: 3,
  timeSlot: 'morning', startDate: '2026-01-01', skipDays: [],
  reminderEnabled: false, reminderTime: null, notificationId: null,
  createdAt: 0, updatedAt: 0, paused: false, archived: false,
};
const done: Completion[] = [
  { id: 'c1', habitId: 'h1', date: '2026-10-29', status: 'done', value: null, createdAt: 0, updatedAt: 0 },
];

describe('cellState', () => {
  test('done day, missed past day, future day, and unscheduled day map distinctly', () => {
    expect(cellState(habit, '2026-10-29', done, '2026-10-30')).toBe('done');
    expect(cellState(habit, '2026-10-28', done, '2026-10-30')).toBe('missed');
    expect(cellState(habit, '2026-11-02', done, '2026-10-30')).toBe('future');
    expect(cellState(habit, '2025-12-31', done, '2026-10-30')).toBe('unscheduled');
  });
  test('today not yet done is pending, not missed', () => {
    expect(cellState(habit, '2026-10-30', done, '2026-10-30')).toBe('pending');
  });
});

describe('monthsForWindow', () => {
  test('last 6 months ending today, oldest first, no day after today', () => {
    const months = monthsForWindow('2026-10-30');
    expect(months.map((m) => m.key)).toEqual(['2026-05', '2026-06', '2026-07', '2026-08', '2026-09', '2026-10']);
    const all = months.flatMap((m) => m.days);
    expect(all[0]).toBe('2026-05-01');
    expect(all[all.length - 1]).toBe('2026-10-30');
    expect(new Set(all).size).toBe(all.length);
  });
});

describe('HABIT_ICONS', () => {
  test('expanded list stays at or under 20 and has no duplicates', () => {
    expect(HABIT_ICONS.length).toBeLessThanOrEqual(20);
    expect(new Set(HABIT_ICONS).size).toBe(HABIT_ICONS.length);
    expect(HABIT_ICONS).toContain('👣');
    expect(HABIT_ICONS).toContain('🏃');
    expect(HABIT_ICONS).toContain('🚰');
  });
});
