// Expo SQLite (SDK 58: expo-sqlite ~16) — structured local store.
// Tables use JSON for list fields (weekdays, skipDays, habitIds) to keep the
// schema small; all parsing is defensive so a corrupt row is skipped, never fatal.
import * as SQLite from 'expo-sqlite';
import type { Completion, Habit, Preferences, Routine } from '../types';

let db: SQLite.SQLiteDatabase | null = null;
function getDb(): SQLite.SQLiteDatabase {
  if (!db) db = SQLite.openDatabaseSync('smarthabit.db');
  return db;
}
function parse<T>(raw: string, fallback: T): T { try { return JSON.parse(raw) as T; } catch { return fallback; } }
function rowToHabit(r: Record<string, unknown>): Habit {
  return {
    id: String(r.id), name: String(r.name), icon: String(r.icon), color: String(r.color),
    type: r.type as Habit['type'], target: Number(r.target), unit: String(r.unit ?? ''),
    frequency: r.frequency as Habit['frequency'],
    weekdays: parse<number[]>(String(r.weekdays ?? '[]'), []),
    weeklyTarget: Number(r.weekly_target ?? 3), timeSlot: r.time_slot as Habit['timeSlot'],
    startDate: String(r.start_date), skipDays: parse<string[]>(String(r.skip_days ?? '[]'), []),
    reminderEnabled: Number(r.reminder_enabled) === 1, reminderTime: (r.reminder_time as string | null) ?? null,
    notificationId: (r.notification_id as string | null) ?? null,
    createdAt: Number(r.created_at), updatedAt: Number(r.updated_at),
    paused: Number(r.paused) === 1, archived: Number(r.archived) === 1,
  };
}
export function initDb(): void {
  const d = getDb();
  d.execSync(`CREATE TABLE IF NOT EXISTS prefs (id INTEGER PRIMARY KEY, onboarding_complete INTEGER, goal TEXT, wake_time TEXT, evening_review_time TEXT, theme TEXT, notifications_enabled INTEGER);
  CREATE TABLE IF NOT EXISTS habits (id TEXT PRIMARY KEY, name TEXT, icon TEXT, color TEXT, type TEXT, target REAL, unit TEXT, frequency TEXT, weekdays TEXT, weekly_target INTEGER, time_slot TEXT, start_date TEXT, skip_days TEXT, reminder_enabled INTEGER, reminder_time TEXT, created_at INTEGER, updated_at INTEGER, paused INTEGER, archived INTEGER);
  CREATE TABLE IF NOT EXISTS completions (id TEXT PRIMARY KEY, habit_id TEXT, date TEXT, status TEXT, value REAL, created_at INTEGER, updated_at INTEGER, UNIQUE(habit_id, date));
  CREATE TABLE IF NOT EXISTS routines (id TEXT PRIMARY KEY, name TEXT, start_time TEXT, habit_ids TEXT, created_at INTEGER, updated_at INTEGER);
  CREATE TABLE IF NOT EXISTS weekly_reports (id TEXT PRIMARY KEY, week_id TEXT, total_completions INTEGER, best_day TEXT, best_streak INTEGER, lowest_habit_id TEXT, suggestions TEXT, status TEXT);`);
  // Migration for databases created before reminder identifiers were stored.
  try { d.execSync('ALTER TABLE habits ADD COLUMN notification_id TEXT'); } catch { /* column already exists */ }
  // Additive migration for the guided-tour flag; never a breaking change.
  try { d.execSync('ALTER TABLE prefs ADD COLUMN tour_seen INTEGER'); } catch { /* column already exists */ }
}
export function loadPrefs(): Preferences {
  const d = getDb();
  const row = d.getFirstSync<Record<string, unknown>>('SELECT * FROM prefs WHERE id = 1');
  if (!row) return { onboardingComplete: false, goal: null, wakeTime: '07:00', eveningReviewTime: '21:00', theme: 'dark', notificationsEnabled: true, tourSeen: false };
  return {
    onboardingComplete: Number(row.onboarding_complete) === 1, goal: (row.goal as Preferences['goal']) ?? null,
    wakeTime: String(row.wake_time ?? '07:00'), eveningReviewTime: String(row.evening_review_time ?? '21:00'),
    theme: 'dark', notificationsEnabled: Number(row.notifications_enabled) !== 0,
    tourSeen: Number(row.tour_seen ?? 0) === 1,
  };
}
export function savePrefs(p: Preferences): void {
  getDb().runSync('INSERT OR REPLACE INTO prefs (id, onboarding_complete, goal, wake_time, evening_review_time, theme, notifications_enabled, tour_seen) VALUES (1, ?, ?, ?, ?, ?, ?, ?)',
    [p.onboardingComplete ? 1 : 0, p.goal, p.wakeTime, p.eveningReviewTime, 'dark', p.notificationsEnabled ? 1 : 0, p.tourSeen ? 1 : 0]);
}
export function loadHabits(): Habit[] {
  return getDb().getAllSync<Record<string, unknown>>('SELECT * FROM habits ORDER BY created_at ASC').map((r) => { try { return rowToHabit(r); } catch { return null; } }).filter((h): h is Habit => h !== null);
}
export function upsertHabit(h: Habit): void {
  getDb().runSync('INSERT OR REPLACE INTO habits VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
    [h.id, h.name, h.icon, h.color, h.type, h.target, h.unit, h.frequency, JSON.stringify(h.weekdays), h.weeklyTarget, h.timeSlot, h.startDate, JSON.stringify(h.skipDays), h.reminderEnabled ? 1 : 0, h.reminderTime, h.createdAt, h.updatedAt, h.paused ? 1 : 0, h.archived ? 1 : 0, h.notificationId]);
}
export function deleteHabitRow(id: string): void { const d = getDb(); d.runSync('DELETE FROM habits WHERE id = ?', [id]); d.runSync('DELETE FROM completions WHERE habit_id = ?', [id]); }
export function loadCompletions(): Completion[] {
  return getDb().getAllSync<Record<string, unknown>>('SELECT * FROM completions').map((r) => ({
    id: String(r.id), habitId: String(r.habit_id), date: String(r.date), status: r.status as Completion['status'],
    value: r.value === null ? null : Number(r.value), createdAt: Number(r.created_at), updatedAt: Number(r.updated_at),
  }));
}
export function upsertCompletion(x: Completion): void {
  getDb().runSync('INSERT INTO completions VALUES (?,?,?,?,?,?,?) ON CONFLICT(habit_id, date) DO UPDATE SET status = excluded.status, value = excluded.value, updated_at = excluded.updated_at',
    [x.id, x.habitId, x.date, x.status, x.value, x.createdAt, x.updatedAt]);
}
export function deleteCompletion(habitId: string, date: string): void { getDb().runSync('DELETE FROM completions WHERE habit_id = ? AND date = ?', [habitId, date]); }
export function loadRoutines(): Routine[] {
  return getDb().getAllSync<Record<string, unknown>>('SELECT * FROM routines ORDER BY created_at ASC').map((r) => ({
    id: String(r.id), name: String(r.name), startTime: String(r.start_time),
    habitIds: parse<string[]>(String(r.habit_ids ?? '[]'), []), createdAt: Number(r.created_at), updatedAt: Number(r.updated_at),
  }));
}
export function upsertRoutine(r: Routine): void { getDb().runSync('INSERT OR REPLACE INTO routines VALUES (?,?,?,?,?,?)', [r.id, r.name, r.startTime, JSON.stringify(r.habitIds), r.createdAt, r.updatedAt]); }
export function deleteRoutineRow(id: string): void { getDb().runSync('DELETE FROM routines WHERE id = ?', [id]); }
export function clearAllData(): void {
  const d = getDb();
  d.execSync('DELETE FROM habits; DELETE FROM completions; DELETE FROM routines; DELETE FROM weekly_reports; DELETE FROM prefs;');
}
