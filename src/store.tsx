import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { todayKey, uid, weekStartKey } from './lib/dates';
import * as db from './services/db';
import { scheduleHabitReminder, cancelAllReminders, cancelReminder, resolveReminderAction } from './services/notifications';
import { isPremium } from './services/subscription';
import { generateSuggestions, previousWeekStats } from './services/suggestions';
import type { Completion, Habit, NewHabitInput, Preferences, Routine, Suggestion, WeeklyReport } from './types';
import { FREE_HABIT_LIMIT, FREE_ROUTINE_LIMIT } from './types';

export interface Store {
  ready: boolean; loadError: string | null;
  prefs: Preferences; habits: Habit[]; completions: Completion[]; routines: Routine[];
  weeklyReport: WeeklyReport | null; isPremium: boolean;
  setPrefs: (p: Partial<Preferences>) => void;
  addHabit: (input: NewHabitInput) => { ok: boolean; message?: string; habit?: Habit };
  updateHabit: (h: Habit) => void; deleteHabit: (id: string) => void;
  // Resolves (and, if needed, re-schedules) the reminder for a habit that
  // was just saved. Returns the user-visible result; HabitForm surfaces a
  // permission denial instead of silently dropping the reminder.
  rescheduleReminder: (next: Habit, previous?: Habit | null) => Promise<{ ok: boolean; message: string }>;
  toggleDone: (habitId: string, date: string) => void;
  setMeasurableValue: (habitId: string, date: string, value: number) => void;
  setStatus: (habitId: string, date: string, status: Completion['status']) => void;
  addRoutine: (r: Omit<Routine, 'id' | 'createdAt' | 'updatedAt'>) => { ok: boolean; message?: string };
  updateRoutine: (r: Routine) => void; deleteRoutine: (id: string) => void;
  reorderRoutineHabits: (routineId: string, habitIds: string[]) => void;
  applySuggestion: (s: Suggestion) => string; dismissSuggestion: (id: string) => void;
  refreshWeeklyReport: () => void; deleteAllData: () => Promise<void>;
}
const Ctx = createContext<Store | null>(null);
export function useStore(): Store { const v = useContext(Ctx); if (!v) throw new Error('store missing'); return v; }
export const STARTER: Record<string, { name: string; icon: string; color: string; type: 'do' | 'measurable'; target: number; unit: string; timeSlot: 'morning' | 'afternoon' | 'evening' }[]> = {
  Fitness: [
    { name: 'Drink Water', icon: '💧', color: '#2DD4BF', type: 'measurable', target: 8, unit: 'glasses', timeSlot: 'morning' },
    { name: 'Walk 30 Minutes', icon: '🚶', color: '#60A5FA', type: 'do', target: 1, unit: '', timeSlot: 'morning' },
    { name: 'Stretch', icon: '🧘', color: '#A78BFA', type: 'do', target: 1, unit: '', timeSlot: 'morning' },
    { name: 'Eat Healthy', icon: '🥗', color: '#34D399', type: 'do', target: 1, unit: '', timeSlot: 'afternoon' },
    { name: 'Sleep 7 Hours', icon: '😴', color: '#FBBF24', type: 'measurable', target: 7, unit: 'hours', timeSlot: 'evening' },
    { name: 'Read 10 Pages', icon: '📖', color: '#FB7185', type: 'measurable', target: 10, unit: 'pages', timeSlot: 'evening' },
  ],
  Study: [
    { name: 'Read 10 Pages', icon: '📖', color: '#FB7185', type: 'measurable', target: 10, unit: 'pages', timeSlot: 'morning' },
    { name: 'Drink Water', icon: '💧', color: '#2DD4BF', type: 'measurable', target: 8, unit: 'glasses', timeSlot: 'morning' },
    { name: 'Stretch', icon: '🧘', color: '#A78BFA', type: 'do', target: 1, unit: '', timeSlot: 'afternoon' },
    { name: 'Walk 30 Minutes', icon: '🚶', color: '#60A5FA', type: 'do', target: 1, unit: '', timeSlot: 'afternoon' },
    { name: 'Eat Healthy', icon: '🥗', color: '#34D399', type: 'do', target: 1, unit: '', timeSlot: 'evening' },
    { name: 'Sleep 7 Hours', icon: '😴', color: '#FBBF24', type: 'measurable', target: 7, unit: 'hours', timeSlot: 'evening' },
  ],
  Health: [
    { name: 'Drink Water', icon: '💧', color: '#2DD4BF', type: 'measurable', target: 8, unit: 'glasses', timeSlot: 'morning' },
    { name: 'Eat Healthy', icon: '🥗', color: '#34D399', type: 'do', target: 1, unit: '', timeSlot: 'afternoon' },
    { name: 'Walk 30 Minutes', icon: '🚶', color: '#60A5FA', type: 'do', target: 1, unit: '', timeSlot: 'morning' },
    { name: 'Sleep 7 Hours', icon: '😴', color: '#FBBF24', type: 'measurable', target: 7, unit: 'hours', timeSlot: 'evening' },
    { name: 'Stretch', icon: '🧘', color: '#A78BFA', type: 'do', target: 1, unit: '', timeSlot: 'morning' },
    { name: 'Read 10 Pages', icon: '📖', color: '#FB7185', type: 'measurable', target: 10, unit: 'pages', timeSlot: 'evening' },
  ],
  Productivity: [
    { name: 'Read 10 Pages', icon: '📖', color: '#FB7185', type: 'measurable', target: 10, unit: 'pages', timeSlot: 'morning' },
    { name: 'Drink Water', icon: '💧', color: '#2DD4BF', type: 'measurable', target: 8, unit: 'glasses', timeSlot: 'morning' },
    { name: 'Walk 30 Minutes', icon: '🚶', color: '#60A5FA', type: 'do', target: 1, unit: '', timeSlot: 'afternoon' },
    { name: 'Stretch', icon: '🧘', color: '#A78BFA', type: 'do', target: 1, unit: '', timeSlot: 'afternoon' },
    { name: 'Eat Healthy', icon: '🥗', color: '#34D399', type: 'do', target: 1, unit: '', timeSlot: 'evening' },
    { name: 'Sleep 7 Hours', icon: '😴', color: '#FBBF24', type: 'measurable', target: 7, unit: 'hours', timeSlot: 'evening' },
  ],
  'Better Mornings': [
    { name: 'Drink Water', icon: '💧', color: '#2DD4BF', type: 'measurable', target: 8, unit: 'glasses', timeSlot: 'morning' },
    { name: 'Stretch', icon: '🧘', color: '#A78BFA', type: 'do', target: 1, unit: '', timeSlot: 'morning' },
    { name: 'Walk 30 Minutes', icon: '🚶', color: '#60A5FA', type: 'do', target: 1, unit: '', timeSlot: 'morning' },
    { name: 'Read 10 Pages', icon: '📖', color: '#FB7185', type: 'measurable', target: 10, unit: 'pages', timeSlot: 'morning' },
    { name: 'Eat Healthy', icon: '🥗', color: '#34D399', type: 'do', target: 1, unit: '', timeSlot: 'afternoon' },
    { name: 'Sleep 7 Hours', icon: '😴', color: '#FBBF24', type: 'measurable', target: 7, unit: 'hours', timeSlot: 'evening' },
  ],
};
export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [prefs, setPrefsState] = useState<Preferences>({ onboardingComplete: false, goal: null, wakeTime: '07:00', eveningReviewTime: '21:00', theme: 'dark', notificationsEnabled: true, tourSeen: false });
  const [habits, setHabits] = useState<Habit[]>([]);
  const [completions, setCompletions] = useState<Completion[]>([]);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [weeklyReport, setWeeklyReport] = useState<WeeklyReport | null>(null);
  useEffect(() => {
    try { db.initDb(); setPrefsState(db.loadPrefs()); setHabits(db.loadHabits()); setCompletions(db.loadCompletions()); setRoutines(db.loadRoutines()); }
    catch (e) { setLoadError(`Local data could not be loaded: ${String(e)}. You can still browse, but changes may not save.`); }
    setReady(true);
  }, []);
  const refreshWeeklyReport = () => {
    const today = todayKey();
    const stats = previousWeekStats(habits, completions, today);
    const suggestions = generateSuggestions(habits, completions, today);
    setWeeklyReport({ id: uid(), weekId: weekStartKey(today), totalCompletions: stats.totalCompletions, bestDay: stats.bestDay, bestStreak: 0, lowestHabitId: stats.lowestHabitId, suggestions, status: 'new' });
  };
  const value: Store = useMemo(() => ({
    ready, loadError, prefs, habits, completions, routines, weeklyReport, isPremium: isPremium(),
    setPrefs: (p) => { const next = { ...prefs, ...p }; setPrefsState(next); try { db.savePrefs(next); } catch { /* keep in-memory */ } },
    addHabit: (input) => {
      const active = habits.filter((h) => !h.archived).length;
      if (!isPremium() && active >= FREE_HABIT_LIMIT) return { ok: false, message: 'Free allows up to 5 active habits. Upgrade to Premium to add more.' };
      if (!input.name.trim()) return { ok: false, message: 'Give the habit a name.' };
      const h: Habit = { ...input, id: uid(), createdAt: Date.now(), updatedAt: Date.now(), paused: false, archived: false, notificationId: null };
      setHabits((prev) => [...prev, h]); try { db.upsertHabit(h); } catch { /* in-memory */ }
      return { ok: true, habit: h };
    },
    updateHabit: (h) => { const next = { ...h, updatedAt: Date.now() }; setHabits((prev) => prev.map((x) => (x.id === h.id ? next : x))); try { db.upsertHabit(next); } catch { /* in-memory */ } },
    rescheduleReminder: async (next, previous) => {
      const prev = previous ?? habits.find((x) => x.id === next.id) ?? null;
      const action = resolveReminderAction(prev, next);
      if (action === 'keep') return { ok: true, message: 'Reminder kept.' };
      if (action === 'none') return { ok: true, message: 'No reminder set.' };
      if (action === 'cancel') {
        await cancelReminder(prev?.notificationId);
        const updated: Habit = { ...next, notificationId: null };
        setHabits((p) => p.map((x) => (x.id === next.id ? updated : x))); try { db.upsertHabit(updated); } catch { /* in-memory */ }
        return { ok: true, message: 'Reminder cancelled.' };
      }
      const result = await scheduleHabitReminder(next, prev?.notificationId ?? null);
      // If scheduling failed after the old reminder was cancelled, do not
      // leave a stale identifier on the habit.
      const updated: Habit = { ...next, notificationId: result.ok ? result.notificationId : null };
      setHabits((p) => p.map((x) => (x.id === next.id ? updated : x))); try { db.upsertHabit(updated); } catch { /* in-memory */ }
      return { ok: result.ok, message: result.message };
    },
    deleteHabit: (id) => {
      const doomed = habits.find((h) => h.id === id);
      if (doomed?.notificationId) void cancelReminder(doomed.notificationId);
      setHabits((prev) => prev.filter((h) => h.id !== id));
      setCompletions((prev) => prev.filter((x) => x.habitId !== id));
      setRoutines((prev) => prev.map((r) => ({ ...r, habitIds: r.habitIds.filter((hid) => hid !== id) })).filter((r) => r.habitIds.length > 0 || true));
      try { db.deleteHabitRow(id); } catch { /* in-memory */ }
      // Persist routine reconciliation
      try { routines.forEach((r) => { const next = { ...r, habitIds: r.habitIds.filter((hid) => hid !== id) }; db.upsertRoutine(next); }); } catch { /* in-memory */ }
    },
    toggleDone: (habitId, date) => {
      const existing = completions.find((x) => x.habitId === habitId && x.date === date);
      if (existing?.status === 'done') {
        setCompletions((prev) => prev.filter((x) => !(x.habitId === habitId && x.date === date)));
        try { db.deleteCompletion(habitId, date); } catch { /* in-memory */ }
        return;
      }
      const x: Completion = { id: existing?.id ?? uid(), habitId, date, status: 'done', value: existing?.value ?? null, createdAt: Date.now(), updatedAt: Date.now() };
      setCompletions((prev) => [...prev.filter((y) => !(y.habitId === habitId && y.date === date)), x]);
      try { db.upsertCompletion(x); } catch { /* in-memory */ }
    },
    setMeasurableValue: (habitId, date, value) => {
      const existing = completions.find((x) => x.habitId === habitId && x.date === date);
      const x: Completion = { id: existing?.id ?? uid(), habitId, date, status: 'done', value, createdAt: Date.now(), updatedAt: Date.now() };
      setCompletions((prev) => [...prev.filter((y) => !(y.habitId === habitId && y.date === date)), x]);
      try { db.upsertCompletion(x); } catch { /* in-memory */ }
    },
    setStatus: (habitId, date, status) => {
      const existing = completions.find((x) => x.habitId === habitId && x.date === date);
      const x: Completion = { id: existing?.id ?? uid(), habitId, date, status, value: existing?.value ?? null, createdAt: Date.now(), updatedAt: Date.now() };
      setCompletions((prev) => [...prev.filter((y) => !(y.habitId === habitId && y.date === date)), x]);
      try { db.upsertCompletion(x); } catch { /* in-memory */ }
    },
    addRoutine: (r) => {
      if (!isPremium() && routines.length >= FREE_ROUTINE_LIMIT) return { ok: false, message: 'Free allows 1 routine. Upgrade to Premium for unlimited routines.' };
      if (!r.name.trim()) return { ok: false, message: 'Give the routine a name.' };
      const next: Routine = { ...r, id: uid(), createdAt: Date.now(), updatedAt: Date.now() };
      setRoutines((prev) => [...prev, next]); try { db.upsertRoutine(next); } catch { /* in-memory */ }
      return { ok: true };
    },
    updateRoutine: (r) => { setRoutines((prev) => prev.map((x) => (x.id === r.id ? r : x))); try { db.upsertRoutine(r); } catch { /* in-memory */ } },
    deleteRoutine: (id) => { setRoutines((prev) => prev.filter((r) => r.id !== id)); try { db.deleteRoutineRow(id); } catch { /* in-memory */ } },
    reorderRoutineHabits: (routineId, habitIds) => {
      setRoutines((prev) => prev.map((r) => (r.id === routineId ? { ...r, habitIds } : r)));
      const r = routines.find((x) => x.id === routineId); if (r) { try { db.upsertRoutine({ ...r, habitIds }); } catch { /* in-memory */ } }
    },
    applySuggestion: (s) => {
      const h = habits.find((x) => x.id === s.habitId);
      if (!h) return 'That habit no longer exists, so this suggestion could not be applied.';
      let updated = h; let msg = '';
      if (s.kind === 'move-to-morning') { updated = { ...h, timeSlot: 'morning' }; msg = 'Moved to the morning.'; }
      if (s.kind === 'reduce-frequency') { updated = { ...h, frequency: 'weekdays', weekdays: [1, 2, 3, 4, 5] }; msg = 'Changed to 5 days per week (Monday to Friday).'; }
      if (s.kind === 'lower-target') { updated = { ...h, target: Math.max(1, Math.round(h.target * 0.75)) }; msg = `Target lowered to ${updated.target} ${h.unit}.`; }
      if (s.kind === 'pause') { updated = { ...h, paused: true }; msg = 'Paused. You can unpause it anytime from Habit Detail.'; }
      setHabits((prev) => prev.map((x) => (x.id === h.id ? updated : x)));
      try { db.upsertHabit(updated); } catch { /* in-memory */ }
      setWeeklyReport((prev) => prev ? { ...prev, suggestions: prev.suggestions.map((x) => (x.id === s.id ? { ...x, applied: true } : x)) } : prev);
      return msg;
    },
    dismissSuggestion: (id) => { setWeeklyReport((prev) => prev ? { ...prev, suggestions: prev.suggestions.map((x) => (x.id === id ? { ...x, dismissed: true } : x)) } : prev); },
    refreshWeeklyReport,
    deleteAllData: async () => {
      await cancelAllReminders();
      try { db.clearAllData(); } catch { /* in-memory */ }
      setHabits([]); setCompletions([]); setRoutines([]); setWeeklyReport(null);
      setPrefsState({ onboardingComplete: false, goal: null, wakeTime: '07:00', eveningReviewTime: '21:00', theme: 'dark', notificationsEnabled: true, tourSeen: false });
    },
  }), [ready, loadError, prefs, habits, completions, routines, weeklyReport]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
