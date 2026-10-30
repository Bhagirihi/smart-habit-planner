import { describe, expect, test } from '@jest/globals';
import {
  completionRate,
  computeBestStreak,
  computeStreak,
  dayStatus,
  isDone,
  isScheduledOn,
  missedYesterday,
} from '../src/services/streaks';
import type { Completion, Habit } from '../src/types';

// Today is Thursday 2026-10-29. Weekdays: Mon 2026-10-26, Tue 27, Wed 28, Thu 29,
// previous Mon 2026-10-19 … Sun 2026-10-25.
const TODAY = '2026-10-29';

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
    startDate: '2026-10-20',
    skipDays: [],
    reminderEnabled: false,
    reminderTime: null,
    notificationId: null,
    createdAt: 0,
    updatedAt: 0,
    paused: false,
    archived: false,
    ...overrides,
  };
}

function done(habitId: string, date: string, value: number | null = null): Completion {
  return { id: `${habitId}-${date}`, habitId, date, status: 'done', value, createdAt: 0, updatedAt: 0 };
}

function withStatus(habitId: string, date: string, status: Completion['status']): Completion {
  return { id: `${habitId}-${date}`, habitId, date, status, value: null, createdAt: 0, updatedAt: 0 };
}

describe('streaks', () => {
  test('daily consecutive streak counts today and preceding done days', () => {
    const h = makeHabit();
    const cs = [done('h1', '2026-10-27'), done('h1', '2026-10-28'), done('h1', '2026-10-29')];
    expect(computeStreak(h, cs, TODAY)).toBe(3);
  });

  test('streak breaks on a missed day', () => {
    const h = makeHabit();
    // Done 26th and today, but 27th and 28th have no record (missed).
    const cs = [done('h1', '2026-10-26'), done('h1', '2026-10-29')];
    expect(computeStreak(h, cs, TODAY)).toBe(1);
  });

  test('today pending does not break the streak', () => {
    const h = makeHabit();
    const cs = [done('h1', '2026-10-27'), done('h1', '2026-10-28')];
    expect(computeStreak(h, cs, TODAY)).toBe(2);
  });

  test('a skipped day does not break the streak', () => {
    const h = makeHabit();
    const cs = [done('h1', '2026-10-27'), withStatus('h1', '2026-10-28', 'skipped'), done('h1', '2026-10-29')];
    expect(computeStreak(h, cs, TODAY)).toBe(2);
  });

  test('a planned rest day in skipDays does not break the streak', () => {
    const h = makeHabit({ skipDays: ['2026-10-28'] });
    const cs = [done('h1', '2026-10-27'), done('h1', '2026-10-29')];
    expect(isScheduledOn(h, '2026-10-28')).toBe(false);
    expect(computeStreak(h, cs, TODAY)).toBe(2);
  });

  test('specific-weekday habit ignores unscheduled days', () => {
    const h = makeHabit({ frequency: 'weekdays', weekdays: [1, 3, 5], startDate: '2026-10-26' });
    // Mon 26 done, Tue 27 unscheduled, Wed 28 done, Thu 29 unscheduled/pending.
    const cs = [done('h1', '2026-10-26'), done('h1', '2026-10-28')];
    expect(isScheduledOn(h, '2026-10-27')).toBe(false);
    expect(computeStreak(h, cs, TODAY)).toBe(2);
  });

  test('weekly-frequency habit counts a week that meets its weekly target', () => {
    const h = makeHabit({ frequency: 'weekly', weeklyTarget: 2, startDate: '2026-10-19' });
    // Previous week (Mon 19 – Sun 25) has 2 done days; current week has only 1 so far.
    const cs = [done('h1', '2026-10-19'), done('h1', '2026-10-22'), done('h1', '2026-10-27')];
    expect(computeStreak(h, cs, TODAY)).toBe(1);
  });

  test('weekly-frequency habit ignores partial weeks', () => {
    const h = makeHabit({ frequency: 'weekly', weeklyTarget: 2, startDate: '2026-10-19' });
    const cs = [done('h1', '2026-10-22'), done('h1', '2026-10-27')];
    expect(computeStreak(h, cs, TODAY)).toBe(0);
  });

  test('measurable habit counts only days that reach the target', () => {
    const h = makeHabit({ type: 'measurable', target: 8, unit: 'glasses' });
    expect(isDone(h, done('h1', '2026-10-28', 8))).toBe(true);
    expect(isDone(h, done('h1', '2026-10-28', 5))).toBe(false);
    expect(dayStatus(h, '2026-10-28', [done('h1', '2026-10-28', 5)], TODAY)).toBe('partial');
    // Partial yesterday breaks the streak even though today is at target.
    const cs = [done('h1', '2026-10-28', 5), done('h1', '2026-10-29', 8)];
    expect(computeStreak(h, cs, TODAY)).toBe(1);
  });

  test('avoid habit failed day breaks the streak', () => {
    const h = makeHabit({ type: 'avoid' });
    const cs = [done('h1', '2026-10-27'), withStatus('h1', '2026-10-28', 'failed'), done('h1', '2026-10-29')];
    expect(dayStatus(h, '2026-10-28', cs, TODAY)).toBe('failed');
    expect(computeStreak(h, cs, TODAY)).toBe(1);
  });

  test('best streak keeps the longest run across a break', () => {
    const h = makeHabit();
    const cs = [
      done('h1', '2026-10-20'),
      done('h1', '2026-10-21'),
      done('h1', '2026-10-22'),
      // 23rd missed, then a shorter run.
      done('h1', '2026-10-26'),
      done('h1', '2026-10-27'),
    ];
    expect(computeBestStreak(h, cs, TODAY)).toBe(3);
  });

  test('completion rate excludes unscheduled days', () => {
    const h = makeHabit({ frequency: 'weekdays', weekdays: [1, 3], startDate: '2026-10-23' });
    // Last 7 days (23–29 Oct) schedule only Mon 26 and Wed 28; one of them done.
    const cs = [done('h1', '2026-10-26')];
    expect(completionRate(h, cs, TODAY, 7)).toBe(50);
  });

  test('completion rate is null when nothing is scheduled', () => {
    const h = makeHabit({ paused: true });
    expect(completionRate(h, [], TODAY, 7)).toBeNull();
  });

  test('habit is not scheduled before its start date', () => {
    const h = makeHabit({ startDate: '2026-10-28' });
    expect(isScheduledOn(h, '2026-10-27')).toBe(false);
    expect(isScheduledOn(h, '2026-10-28')).toBe(true);
  });

  test('missedYesterday returns only habits missed yesterday', () => {
    const doneHabit = makeHabit({ id: 'done-habit' });
    const missedHabit = makeHabit({ id: 'missed-habit' });
    const cs = [done('done-habit', '2026-10-28')];
    const missed = missedYesterday([doneHabit, missedHabit], cs, TODAY);
    expect(missed.map((h) => h.id)).toEqual(['missed-habit']);
  });

  test('paused habit has a zero streak', () => {
    const h = makeHabit({ paused: true });
    const cs = [done('h1', '2026-10-27'), done('h1', '2026-10-28')];
    expect(computeStreak(h, cs, TODAY)).toBe(0);
  });
});
