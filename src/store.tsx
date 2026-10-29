import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { AppState, CheckIns, Habit, Routine, Settings, SubTask, Task } from './types';
import { checkInKey } from './types';
import { defaultState, loadState, saveState } from './lib/storage';
import { todayKey } from './lib/dates';
import { cancelAllNotifications, rescheduleAll } from './lib/notifications';

interface Store {
  loaded: boolean;
  state: AppState;
  isPremium: boolean;
  setState: (patch: Partial<AppState>) => void;
  completeOnboarding: (habits: Habit[], goal: string, wakeTime: string) => void;
  addHabit: (h: Habit) => void;
  updateHabit: (h: Habit) => void;
  deleteHabit: (id: string) => void;
  toggleDone: (habit: Habit, date: string) => void;
  addValue: (habit: Habit, date: string, value: number) => void;
  toggleSkip: (habitId: string, date: string) => void;
  addRoutine: (r: Routine) => void;
  updateRoutine: (r: Routine) => void;
  deleteRoutine: (id: string) => void;
  addTask: (t: Task) => void;
  updateTask: (t: Task) => void;
  deleteTask: (id: string) => void;
  toggleTask: (id: string) => void;
  addSubTask: (s: SubTask) => void;
  updateSubTask: (s: SubTask) => void;
  deleteSubTask: (id: string) => void;
  toggleSubTask: (id: string) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  resetAll: () => void;
}

const Ctx = createContext<Store | null>(null);

export function useStore(): Store {
  const v = useContext(Ctx);
  if (!v) throw new Error('useStore must be used inside StoreProvider');
  return v;
}

export function StoreProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const [loaded, setLoaded] = useState(false);
  const [state, setStateRaw] = useState<AppState>(defaultState);

  useEffect(() => {
    loadState().then((saved) => {
      if (saved) setStateRaw(saved);
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (loaded) void saveState(state);
  }, [loaded, state]);

  // Keep scheduled reminders in sync with habits/settings (best-effort).
  useEffect(() => {
    if (!loaded) return;
    if (state.settings.notificationsEnabled) {
      void rescheduleAll(state.habits, state.settings);
    } else {
      void cancelAllNotifications();
    }
  }, [loaded, state.habits, state.settings.notificationsEnabled, state.settings.eveningReviewTime]);

  const setState = useCallback((patch: Partial<AppState>) => {
    setStateRaw((prev) => ({ ...prev, ...patch }));
  }, []);

  const value = useMemo<Store>(() => {
    const isPremium = state.settings.premiumDemo;
    return {
      loaded,
      state,
      isPremium,
      setState,
      completeOnboarding: (habits, goal, wakeTime) => {
        setStateRaw((prev) => ({
          ...prev,
          onboarded: true,
          habits,
          settings: { ...prev.settings, goal, wakeTime },
        }));
      },
      addHabit: (h) => setStateRaw((p) => ({ ...p, habits: [...p.habits, h] })),
      updateHabit: (h) => setStateRaw((p) => ({ ...p, habits: p.habits.map((x) => (x.id === h.id ? h : x)) })),
      deleteHabit: (id) =>
        setStateRaw((p) => ({
          ...p,
          habits: p.habits.filter((x) => x.id !== id),
          routines: p.routines.map((r) => ({ ...r, habitIds: r.habitIds.filter((hid) => hid !== id) })),
          checkIns: Object.fromEntries(Object.entries(p.checkIns).filter(([k]) => !k.startsWith(`${id}|`))),
        })),
      toggleDone: (habit, date) => {
        const key = checkInKey(habit.id, date);
        setStateRaw((p) => {
          const next: CheckIns = { ...p.checkIns };
          if (next[key] !== undefined) delete next[key];
          else next[key] = habit.target;
          return { ...p, checkIns: next };
        });
      },
      addValue: (habit, date, value) => {
        const key = checkInKey(habit.id, date);
        setStateRaw((p) => ({ ...p, checkIns: { ...p.checkIns, [key]: value } }));
      },
      toggleSkip: (habitId, date) =>
        setStateRaw((p) => ({
          ...p,
          habits: p.habits.map((h) =>
            h.id === habitId
              ? { ...h, skipDates: h.skipDates.includes(date) ? h.skipDates.filter((d) => d !== date) : [...h.skipDates, date] }
              : h,
          ),
        })),
      addTask: (t) => setStateRaw((p) => ({ ...p, tasks: [...(p.tasks ?? []), t] })),
      updateTask: (t) => setStateRaw((p) => ({ ...p, tasks: (p.tasks ?? []).map((x) => (x.id === t.id ? t : x)) })),
      deleteTask: (id) =>
        setStateRaw((p) => ({
          ...p,
          tasks: (p.tasks ?? []).filter((x) => x.id !== id),
          subtasks: (p.subtasks ?? []).filter((x) => x.taskId !== id),
        })),
      toggleTask: (id) =>
        setStateRaw((p) => ({
          ...p,
          tasks: (p.tasks ?? []).map((x) => (x.id === id ? { ...x, done: !x.done, autoFinished: false } : x)),
        })),
      addSubTask: (s) => setStateRaw((p) => ({ ...p, subtasks: [...(p.subtasks ?? []), s] })),
      updateSubTask: (s) => setStateRaw((p) => ({ ...p, subtasks: (p.subtasks ?? []).map((x) => (x.id === s.id ? s : x)) })),
      deleteSubTask: (id) =>
        setStateRaw((p) => {
          const subtasks = (p.subtasks ?? []).filter((x) => x.id !== id);
          return { ...p, subtasks };
        }),
      toggleSubTask: (id) =>
        setStateRaw((p) => {
          const subtasks = (p.subtasks ?? []).map((x) => (x.id === id ? { ...x, done: !x.done } : x));
          const sub = subtasks.find((x) => x.id === id);
          if (!sub) return { ...p, subtasks };
          const siblings = subtasks.filter((x) => x.taskId === sub.taskId);
          const allDone = siblings.length > 0 && siblings.every((x) => x.done);
          const tasks = (p.tasks ?? []).map((t) => {
            if (t.id !== sub.taskId) return t;
            if (allDone) return { ...t, done: true, autoFinished: true };
            // Unchecking a subtask only un-does a task that was auto-finished.
            // A task the user finished by hand stays finished.
            if (t.autoFinished) return { ...t, done: false, autoFinished: false };
            return t;
          });
          return { ...p, subtasks, tasks };
        }),
      addRoutine: (r) => setStateRaw((p) => ({ ...p, routines: [...p.routines, r] })),
      updateRoutine: (r) => setStateRaw((p) => ({ ...p, routines: p.routines.map((x) => (x.id === r.id ? r : x)) })),
      deleteRoutine: (id) => setStateRaw((p) => ({ ...p, routines: p.routines.filter((x) => x.id !== id) })),
      updateSettings: (patch) => setStateRaw((p) => ({ ...p, settings: { ...p.settings, ...patch } })),
      resetAll: () => {
        void cancelAllNotifications();
        setStateRaw(defaultState);
      },
    };
  }, [loaded, state, setState]);

  void todayKey;
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
