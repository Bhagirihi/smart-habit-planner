import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { AppState, CheckIns, Habit, Routine, Settings } from './types';
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
