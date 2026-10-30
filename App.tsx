import React, { useCallback, useEffect, useRef, useState } from 'react';
import { BackHandler, Dimensions, Pressable, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { c, spacing, type } from './src/theme';
import type { Habit, Routine, Suggestion } from './src/theme';
import { HABITS, INITIAL_DONE, ROUTINES, SUGGESTIONS } from './src/data';
import {
  computeBestStreak,
  computeStreak,
  localToday,
  type CompletionByDate,
} from './src/streak';
import {
  aggregateDayCompletions,
  computeWeekStatus,
  staticFallbackWeek,
  type DayCompletionMap,
  type WeekStatus,
} from './src/widgetData';
import {
  ensureUserHabits,
  ensureUserRoutines,
  getCurrentAuthUser,
  isSupabaseConfigured,
  loadCompletionRows,
  loadHabitRows,
  loadRoutineRows,
  loadSuggestionStates,
  onAuthStateChange,
  parseSchedule,
  rowToHabit,
  rowToRoutine,
  setCompletion,
  setSuggestionState,
  signOut as supabaseSignOut,
  upsertHabit,
  upsertRoutine,
  type AuthUser,
  type DbCompletionRow,
  type DbHabitRow,
  type DbRoutineRow,
  type HabitInput,
  type RoutineInput,
} from './src/supabase';
import {
  checkPremium,
  fetchOfferings,
  isRevenueCatConfigured,
  purchasePackageById,
  restorePurchases as rcRestorePurchases,
  type RcPackage,
} from './src/revenuecat';
import * as Notifications from 'expo-notifications';
import {
  cancelAllNotifications,
  getNotifPermission,
  openNotifSettings as openSystemNotifSettings,
  requestNotifPermission as requestSystemNotifPermission,
  scheduleAllNotifications,
  setupNotifications,
  type NotifPermission,
} from './src/notifications';
import {
  getAnalyticsOptOut,
  logAnalyticsEvent,
  probeFirebase,
  recordCrashError,
  setAnalyticsOptOut,
  type AnalyticsEventName,
  type AnalyticsParams,
} from './src/firebase';
import type { Nav, Route, TabName, TourMeasure, TourRect, TourTarget, UiState } from './src/navigation';
import { isTabRoute, TAB_ROUTES } from './src/navigation';
import Splash from './src/screens/Splash';
import { Goal, Starter, Welcome } from './src/screens/Onboarding';
import Today from './src/screens/Today';
import { HabitDetail, HabitForm, HabitsGrid } from './src/screens/HabitScreens';
import { RoutineDetail, RoutineForm, Routines } from './src/screens/RoutineScreens';
import { Progress, WeeklyReport } from './src/screens/ProgressReport';
import { Legal, Settings } from './src/screens/SettingsLegal';
import { Forgot, Login, Signup } from './src/screens/AuthScreens';
import WidgetPreview from './src/screens/WidgetPreview';
import PaymentSetup from './src/screens/PaymentSetup';
import Paywall from './src/components/Paywall';
import { TOUR_STEPS, TourTooltip, type TourDestination } from './src/components/Tooltip';

const TABS: { id: TabName; label: string; icon: string }[] = [
  { id: 'today', label: 'Today', icon: '🏠' },
  { id: 'routines', label: 'Routines', icon: '🗂️' },
  { id: 'progress', label: 'Progress', icon: '📊' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
];

// AppInner runs INSIDE SafeAreaProvider, so useSafeAreaInsets() works.
//
// REVIEW FIX (why the previous fix did not replicate on device):
// The previous fix converted window rects by subtracting live insets and
// rendered the overlay as a direct child of SafeAreaView. That is still
// ambiguous on Android: an absolute child of SafeAreaView is positioned
// relative to SafeAreaView's own box, whose origin is NOT guaranteed to
// equal the safe-area content origin on every device / SafeAreaView
// implementation — so the frame could land shifted by the inset again,
// in either direction, depending on the device. The only coordinate
// system that cannot be wrong is the overlay's own parent:
//   - the overlay now lives INSIDE the root <View flex:1> (inside
//     SafeAreaView, so it still cannot go under a system bar),
//   - every target rect is converted by subtracting the ROOT view's own
//     window rect (measured at the same moment), NOT by subtracting
//     insets from a theory about SafeAreaView.
// rootRect is measured, never assumed. If root measurement fails, the
// old inset conversion is kept as a fallback only.
function AppInner() {
  const insets = useSafeAreaInsets();
  const rootRef = useRef<any>(null);
  // STEP 5 (Firebase Analytics + Crashlytics): configured only after a
  // successful native probe (see src/firebase.ts) — installing the
  // packages alone never makes this true, and Expo Go never makes it
  // true. analyticsEnabled defaults true but is effective ONLY when
  // configured AND enabled ("default on only when configured").
  const [firebaseConfigured, setFirebaseConfigured] = useState(false);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);
  const analyticsEnabledRef = useRef(true);
  const firebaseConfiguredRef = useRef(false);
  // Single logging helper: no-op unless configured AND opted in.
  // Callers pass only the whitelisted, non-personal parameters from
  // src/firebase.ts — never names, targets, prices, or user text.
  const logEvent = useCallback((name: AnalyticsEventName, params?: AnalyticsParams) => {
    if (!firebaseConfiguredRef.current || !analyticsEnabledRef.current) return;
    void logAnalyticsEvent(name, params, true);
  }, []);
  // Launch probe: load the saved opt-out first, then probe Firebase,
  // then log app_open exactly once when (and only when) both pass.
  // A failed probe is a silent no-op — the app is simply unconfigured.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const optOut = await getAnalyticsOptOut();
        if (!cancelled) { setAnalyticsEnabled(!optOut); analyticsEnabledRef.current = !optOut; }
        const configured = await probeFirebase();
        if (cancelled) return;
        setFirebaseConfigured(configured);
        firebaseConfiguredRef.current = configured;
        if (configured && !optOut) {
          await logAnalyticsEvent('app_open', undefined, true);
        }
      } catch {
        // Probe/opt-out failures are never app errors: unconfigured.
      }
    })();
    return () => { cancelled = true; };
  }, []);
  const toggleAnalytics = useCallback((enabled: boolean) => {
    setAnalyticsEnabled(enabled);
    analyticsEnabledRef.current = enabled;
    void setAnalyticsOptOut(!enabled);
  }, []);
  const [stack, setStack] = useState<Route[]>([{ name: 'splash' }]);
  const [sheet, setSheet] = useState(false);
  const [paywall, setPaywall] = useState(false);
  const [done, setDone] = useState<Set<string>>(new Set(INITIAL_DONE));
  // STEP 1 (Supabase persistence): runtime habit list + streak maps.
  // Initial values are exactly the static seed (data.ts), so the
  // NOT-configured path behaves exactly as the app did before this step,
  // and the configured path never flashes an empty list while loading —
  // the Supabase load below overwrites these when it lands.
  const [habits, setHabits] = useState<Habit[]>(HABITS);
  const [streaks, setStreaks] = useState<Record<string, number>>(
    Object.fromEntries(HABITS.map((h) => [h.id, h.streak])),
  );
  const [bestStreaks, setBestStreaks] = useState<Record<string, number>>(
    Object.fromEntries(HABITS.map((h) => [h.id, h.bestStreak])),
  );
  // STEP 8 (production hardening, QA fix M2): the completion history
  // and schedules behind the streak maps, so toggleDone can recompute
  // streaks immediately instead of waiting for a reload. Empty in
  // session/static mode (streaks there are the seed display values,
  // adjusted by a +/-1 delta on toggle — see toggleDone); filled by
  // applySupabaseData in configured mode. Schedules default to daily
  // for every habit, matching the seed (daily schedule in the DB).
  const DAILY_SCHEDULE = [0, 1, 2, 3, 4, 5, 6];
  const [completionsByHabit, setCompletionsByHabit] = useState<Record<string, CompletionByDate>>({});
  const [schedulesByHabit, setSchedulesByHabit] = useState<Record<string, number[]>>(
    Object.fromEntries(HABITS.map((h) => [h.id, [...DAILY_SCHEDULE]])),
  );
  const [supabaseError, setSupabaseError] = useState<string | null>(null);
  // STEP 6 (live home widget): aggregated completion history, one
  // status per local date ('done' wins over 'skip'). Empty in static
  // mode — the widget then shows the static fallback week. Set only
  // from real Supabase rows in applySupabaseData below, never invented.
  const [dayCompletions, setDayCompletions] = useState<DayCompletionMap>({});
  // 'real' only after a Supabase load for a signed-in user; 'static'
  // otherwise (unconfigured, unsigned-in, or after sign-out).
  const [widgetSource, setWidgetSource] = useState<'real' | 'static'>('static');
  // STEP 2 (Supabase Auth): the signed-in user, restored from the
  // persisted session on launch when configured. Null = no account:
  // the app still works fully (static, session-only). Auth is optional,
  // never a gate — see the auth effect below.
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [authLoading, setAuthLoading] = useState(isSupabaseConfigured);
  // STEP 3 (RevenueCat): premium is false by default and stays false
  // when unconfigured — the app never claims Premium without an active
  // entitlement from RevenueCat. Offerings are loaded best-effort on
  // launch (configured only); a failure leaves premium false and
  // records the error for Settings / Paywall, never a fake price.
  const [isPremium, setIsPremium] = useState(false);
  const [offerings, setOfferings] = useState<RcPackage[]>([]);
  const [revenueCatError, setRevenueCatError] = useState<string | null>(null);
  const [revenueCatLoading, setRevenueCatLoading] = useState(isRevenueCatConfigured);
  const refreshRevenueCat = useCallback(async () => {
    if (!isRevenueCatConfigured) return;
    setRevenueCatLoading(true);
    try {
      const [pkgs, premium] = await Promise.all([fetchOfferings(), checkPremium()]);
      setOfferings(pkgs);
      setIsPremium(premium);
      setRevenueCatError(null);
    } catch (e) {
      // Premium stays false on error — an error is never reported as
      // "not premium" silently either; it is surfaced in Settings.
      // Crashlytics gets only a generic identifier, never the message.
      void recordCrashError('revenuecat_load_failed', analyticsEnabledRef.current);
      setRevenueCatError(e instanceof Error ? e.message : 'RevenueCat load failed.');
    } finally {
      setRevenueCatLoading(false);
    }
  }, []);
  useEffect(() => {
    if (!isRevenueCatConfigured) return;
    refreshRevenueCat();
  }, [refreshRevenueCat]);
  const purchasePackage = useCallback(async (identifier: string) => {
    setRevenueCatError(null);
    try {
      const premium = await purchasePackageById(identifier);
      setIsPremium(premium);
      if (premium) {
        // Real purchase only: no price, no product id in the event.
        logEvent('purchase_completed');
        await refreshRevenueCat();
      }
      return premium;
    } catch (e) {
      setRevenueCatError(e instanceof Error ? e.message : 'Purchase failed.');
      throw e;
    }
  }, [refreshRevenueCat, logEvent]);
  const restorePurchases = useCallback(async () => {
    setRevenueCatError(null);
    try {
      const premium = await rcRestorePurchases();
      setIsPremium(premium);
      if (premium) await refreshRevenueCat();
      return premium;
    } catch (e) {
      setRevenueCatError(e instanceof Error ? e.message : 'Restore failed.');
      throw e;
    }
  }, [refreshRevenueCat]);

  // Merge DB rows + completion history into display habits: streaks come
  // ONLY from src/streak.ts (never a stored counter), best keeps the
  // seeded historic best when the known history is shorter than it.
  const applySupabaseData = useCallback((rows: DbHabitRow[], completions: DbCompletionRow[]) => {
    const today = localToday();
    const byHabit: Record<string, CompletionByDate> = {};
    for (const row of completions) {
      if (!byHabit[row.habit_id]) byHabit[row.habit_id] = {};
      byHabit[row.habit_id]![row.date] = row.status;
    }
    const nextHabits: Habit[] = [];
    const nextStreaks: Record<string, number> = {};
    const nextBest: Record<string, number> = {};
    const nextSchedules: Record<string, number[]> = {};
    for (const row of rows) {
      const base = rowToHabit(row);
      const schedule = parseSchedule(row.schedule);
      const history = byHabit[row.id] ?? {};
      nextStreaks[row.id] = computeStreak(history, schedule, today);
      nextBest[row.id] = Math.max(computeBestStreak(history, schedule, today), base.bestStreak);
      nextSchedules[row.id] = schedule;
      nextHabits.push({ ...base, streak: nextStreaks[row.id]!, bestStreak: nextBest[row.id]! });
    }
    setHabits(nextHabits);
    setStreaks(nextStreaks);
    setBestStreaks(nextBest);
    // STEP 8: keep the history/schedules behind the streak maps, so
    // toggleDone can recompute them immediately (QA fix M2).
    setCompletionsByHabit(byHabit);
    setSchedulesByHabit(nextSchedules);
    // STEP 7: full history for the real Weekly Report (same rows, no
    // second source of truth — the report computes from these rows).
    setCompletionHistory(completions);
    setHistorySource('real');
    // STEP 6: real week history for the widget (and only from these rows).
    setDayCompletions(aggregateDayCompletions(completions));
    setWidgetSource('real');
    const todayDone = new Set(
      completions.filter((r) => r.date === today && r.status === 'done').map((r) => r.habit_id),
    );
    setDone(todayDone);
  }, []);

  const refreshSupabase = useCallback(async (userId: string) => {
    const rows = await loadHabitRows(userId);
    const completions = await loadCompletionRows();
    applySupabaseData(rows, completions);
  }, [applySupabaseData]);

  // STEP 7: routines for one user. Seeding happens in loadForUser
  // (ensureUserRoutines) before this reload, so a first sign-in sees
  // the demo routines and a returning user sees their own — never an
  // empty list caused by a missing seed, and never a deletion.
  const refreshRoutines = useCallback(async (userId: string) => {
    const rows: DbRoutineRow[] = await loadRoutineRows(userId);
    setRoutines(rows.map(rowToRoutine));
  }, []);

  // Load (and, on first sign-in, merge/seed) one user's data. Never
  // called without a signed-in user: configured-but-unsigned-in is
  // NOT an error, it is the normal no-account state (static list).
  // STEP 7 adds routines + suggestion states to the same load, so a
  // signed-in user gets their routines and their applied/dismissed
  // suggestion states back after a reload, not just their habits.
  const loadForUser = useCallback(async (userId: string) => {
    await ensureUserHabits(userId);
    await ensureUserRoutines(userId);
    await refreshSupabase(userId);
    await refreshRoutines(userId);
    try {
      const states = await loadSuggestionStates(userId);
      const byId = new Map(states.map((s) => [s.suggestion_id, s.state]));
      setSuggestions(SUGGESTIONS.map((s) => (byId.has(s.id) ? { ...s, state: byId.get(s.id)! } : s)));
    } catch {
      // Suggestion states are non-critical: habits/routines already
      // loaded above, and a state-load failure must not wipe them.
      // States stay at their static defaults for this session.
    }
  }, [refreshSupabase, refreshRoutines]);

  // Reset local state to the static seed list. Used on sign-out and
  // when the session ends: local state is discarded, Supabase rows are
  // NEVER deleted by this — they stay in the project for next sign-in.
  const resetToStatic = useCallback(() => {
    setHabits(HABITS);
    setStreaks(Object.fromEntries(HABITS.map((h) => [h.id, h.streak])));
    setBestStreaks(Object.fromEntries(HABITS.map((h) => [h.id, h.bestStreak])));
    // STEP 8: back to empty history + daily schedules (session mode
    // streaks are seed display values, not computed history).
    setCompletionsByHabit({});
    setSchedulesByHabit(Object.fromEntries(HABITS.map((h) => [h.id, [0, 1, 2, 3, 4, 5, 6]])));
    setDone(new Set(INITIAL_DONE));
    setSupabaseError(null);
    // STEP 7: back to static routines, fresh run steps, static report
    // history, and new suggestion states on sign-out / reset. Supabase
    // rows are NEVER deleted by this — they stay for next sign-in.
    setRoutines(ROUTINES);
    setRunSteps({});
    setCompletionHistory([]);
    setHistorySource('static');
    setSuggestions(SUGGESTIONS);
    // STEP 6: back to the static fallback week on sign-out / reset.
    setDayCompletions({});
    setWidgetSource('static');
  }, []);

  // STEP 2 auth lifecycle (configured only; unconfigured: nothing here
  // runs and the static initial state stands, exactly as before).
  // On launch: restore the persisted session, then load that user's
  // data (merge/seed on first sign-in). On SIGNED_IN: same load. On
  // SIGNED_OUT: reset to static. A load failure keeps the static list
  // and records the error for Settings — it never invents rows.
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let cancelled = false;
    let loadedUserId: string | null = null;
    const load = async (user: AuthUser | null) => {
      if (!user) {
        if (!cancelled) { setAuthUser(null); resetToStatic(); }
        return;
      }
      if (loadedUserId === user.id) return;
      loadedUserId = user.id;
      if (!cancelled) setAuthUser(user);
      try {
        await loadForUser(user.id);
        if (!cancelled) setSupabaseError(null);
      } catch (e) {
        void recordCrashError('supabase_load_failed', analyticsEnabledRef.current);
        if (!cancelled) setSupabaseError(e instanceof Error ? e.message : 'Supabase load failed.');
      }
    };
    (async () => {
      try {
        const user = await getCurrentAuthUser();
        if (!cancelled) setAuthLoading(false);
        if (cancelled) return;
        await load(user);
      } catch {
        if (!cancelled) setAuthLoading(false);
      }
    })();
    const sub = onAuthStateChange((user) => { load(user); });
    return () => { cancelled = true; sub.unsubscribe(); };
  }, [loadForUser, resetToStatic]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>(SUGGESTIONS);
  // STEP 7 (real routines): runtime routine list, static seed by default
  // (unconfigured / unsigned-in), Supabase rows when signed in.
  const [routines, setRoutines] = useState<Routine[]>(ROUTINES);
  // STEP 7 (fixes the old shared-runStep bug): run progress PER routine
  // id. No global step counter exists anymore — opening routine B
  // while routine A is mid-run cannot move or reset A's progress.
  const [runSteps, setRunSteps] = useState<Record<string, number>>({});
  // STEP 7 (real Weekly Report): full completion history from Supabase
  // (set only by applySupabaseData, i.e. a signed-in load). 'static'
  // means the report must label its numbers as a static preview.
  const [completionHistory, setCompletionHistory] = useState<DbCompletionRow[]>([]);
  const [historySource, setHistorySource] = useState<'real' | 'static'>('static');
  const [tourDismissed, setTourDismissed] = useState(false);
  const [tourActive, setTourActive] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  const [targetRect, setTargetRect] = useState<TourRect | null>(null);
  // Incremented by ui.requestTourRemeasure() (e.g. after a ScrollView
  // scroll settles) to re-run the measurement effect below.
  const [remeasureNonce, setRemeasureNonce] = useState(0);
  const [notifEnabled, setNotifEnabled] = useState(true);
  // STEP 4 (local notifications): OS permission state, checked on
  // launch (read-only, never prompts on launch) and updated whenever
  // the user acts in Settings. 'unknown' = not yet checked. Scheduling
  // happens ONLY when enabled AND permission is 'granted' — never
  // silently when denied/undetermined, never in a prompt loop.
  const [notifPermission, setNotifPermission] = useState<NotifPermission>('unknown');
  const [notifError, setNotifError] = useState<string | null>(null);
  // Launch: install handler + channel, read permission (no prompt),
  // schedule only if already granted and enabled.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try { await setupNotifications(); } catch { /* handler/channel failure: scheduling below will report it */ }
      const status = await getNotifPermission();
      if (cancelled) return;
      setNotifPermission(status);
    })();
    return () => { cancelled = true; };
  }, []);
  // Re-schedule whenever the habit list changes (load/save) while
  // notifications are on and permission is granted — so a new or edited
  // habit gets its reminder without the user re-toggling.
  useEffect(() => {
    if (!notifEnabled || notifPermission !== 'granted') return;
    let cancelled = false;
    scheduleAllNotifications(habits).then(
      () => { if (!cancelled) setNotifError(null); },
      (e) => { if (!cancelled) setNotifError(e instanceof Error ? e.message : 'Notification scheduling failed.'); },
    );
    return () => { cancelled = true; };
  }, [habits, notifEnabled, notifPermission]);

  // Tour target measurers: screens register a measureInWindow function for
  // each target key they render. Stored in a ref (not state) so registering
  // never re-renders the app; App reads it when the tour step changes.
  const tourMeasurers = useRef(new Map<TourTarget, TourMeasure>());
  const tourAutoShown = useRef(false);
  const tabRefs = useRef<Record<string, any>>({});
  const registerTourTarget = useCallback((key: TourTarget, measure: TourMeasure) => {
    tourMeasurers.current.set(key, measure);
  }, []);
  const unregisterTourTarget = useCallback((key: TourTarget) => {
    tourMeasurers.current.delete(key);
  }, []);

  const route = stack[stack.length - 1] ?? { name: 'splash' };
  // Routine events (STEP 7: ids/counts come from the runtime routine
  // list, and progress is per-routine): started once per entry into a
  // routine detail screen, completed once per run when THAT routine's
  // step reaches its step count. Restart (that routine's step back to
  // 0) re-arms the completed flag; another routine's steps never do.
  const routineStartedRef = useRef<string | null>(null);
  const routineCompletedRef = useRef(false);
  const currentRoutineRunStep =
    route.name === 'routineDetail' ? (runSteps[route.routineId] ?? 0) : 0;
  useEffect(() => {
    if (route.name !== 'routineDetail') {
      routineStartedRef.current = null;
      routineCompletedRef.current = false;
      return;
    }
    const routine = routines.find((r) => r.id === route.routineId) ?? routines[0]!;
    if (!routine) return;
    if (routineStartedRef.current !== routine.id) {
      routineStartedRef.current = routine.id;
      routineCompletedRef.current = false;
      logEvent('routine_started', { routine_id: routine.id, step_count: routine.habitIds.length });
      return;
    }
    if (currentRoutineRunStep === 0) {
      routineCompletedRef.current = false;
      return;
    }
    if (currentRoutineRunStep >= routine.habitIds.length && !routineCompletedRef.current) {
      routineCompletedRef.current = true;
      logEvent('routine_completed', { routine_id: routine.id, step_count: routine.habitIds.length });
    }
  }, [route, currentRoutineRunStep, routines, logEvent]);
  const push = useCallback((r: Route) => setStack((s) => [...s, r]), []);
  const back = useCallback(() => setStack((s) => (s.length > 1 ? s.slice(0, -1) : s)), []);
  const goTab = useCallback((t: TabName) => setStack([TAB_ROUTES[t]]), []);
  const nav: Nav = {
    route, push, back, goTab,
    openPaywall: () => { setPaywall(true); logEvent('paywall_shown'); },
    closePaywall: () => setPaywall(false),
    openSheet: () => setSheet(true),
    closeSheet: () => setSheet(false),
  };
  // STEP 6: the week the widget (and WidgetPreview) show. Real mode:
  // computed from loaded completion history and today's real local
  // date. Static mode: the fallback week from staticFallbackWeek —
  // still a fallback (statuses are not real history), but its today
  // circle/index are the REAL local date, never hardcoded Thursday
  // (STEP 8, QA fix M1).
  const widgetWeek: { status: WeekStatus[]; todayIndex: number; source: 'real' | 'static' } =
    widgetSource === 'real'
      ? { ...computeWeekStatus(dayCompletions, localToday()), source: 'real' as const }
      : { ...staticFallbackWeek(localToday()), source: 'static' as const };

  const ui: UiState = {
    done,
    // Session-only when unconfigured OR when no account is signed in
    // (exactly today's behaviour — auth is optional, never a gate).
    // When configured AND signed in: optimistic local update, Supabase
    // write, revert + error on failure so the UI never shows a
    // completion that is not saved.
    // STEP 8 (QA fix M2): toggleDone recomputes streaks IMMEDIATELY
    // from the updated completion set — never only on a later reload.
    // Session/static mode: streaks are seed display values, not
    // computed history, so a toggle adjusts by +/-1 (mark done = the
    // seed run plus today, undo = back again, floor 0; best only ever
    // rises). Configured mode: the optimistic history map is
    // recomputed with src/streak.ts for every habit, and a failed
    // write reloads the truth from Supabase (not a stale captured
    // set — that was QA minor m2) with a captured-set revert only if
    // the reload itself also fails.
    toggleDone: (id) => {
      const wasDone = done.has(id);
      const next = new Set(done);
      if (wasDone) next.delete(id); else next.add(id);
      setDone(next);
      // Real completion only (undo logs nothing). Parameters are the
      // internal habit id + slot only — never the habit name/target.
      if (!wasDone) {
        const habit = habits.find((h) => h.id === id);
        logEvent('habit_completed', { habit_id: id, slot: habit?.slot ?? '' });
      }
      if (!isSupabaseConfigured || !authUser) {
        const delta = wasDone ? -1 : 1;
        setStreaks((prev) => ({ ...prev, [id]: Math.max(0, (prev[id] ?? 0) + delta) }));
        setBestStreaks((prev) => ({
          ...prev,
          [id]: Math.max(prev[id] ?? 0, Math.max(0, (streaks[id] ?? 0) + delta)),
        }));
        return;
      }
      const today = localToday();
      const prevDone = done;
      const prevComp = completionsByHabit;
      const prevStreaks = streaks;
      const prevBest = bestStreaks;
      const prevDay = dayCompletions;
      const nextComp: Record<string, CompletionByDate> = { ...prevComp };
      const habitHistory: CompletionByDate = { ...(prevComp[id] ?? {}) };
      if (wasDone) {
        delete habitHistory[today];
      } else {
        habitHistory[today] = 'done';
      }
      nextComp[id] = habitHistory;
      setCompletionsByHabit(nextComp);
      const nextStreaks: Record<string, number> = {};
      const nextBest: Record<string, number> = {};
      for (const h of habits) {
        const history = nextComp[h.id] ?? {};
        const schedule = schedulesByHabit[h.id] ?? [0, 1, 2, 3, 4, 5, 6];
        nextStreaks[h.id] = computeStreak(history, schedule, today);
        nextBest[h.id] = Math.max(computeBestStreak(history, schedule, today), h.bestStreak);
      }
      setStreaks(nextStreaks);
      setBestStreaks(nextBest);
      // Widget day aggregation for today follows the same optimistic map.
      const dayRows: { date: string; status: 'done' | 'skip' }[] = [];
      for (const byDate of Object.values(nextComp)) {
        for (const [date, status] of Object.entries(byDate)) {
          dayRows.push({ date, status });
        }
      }
      setDayCompletions(aggregateDayCompletions(dayRows));
      const userId = authUser.id;
      setCompletion(id, today, wasDone ? null : 'done').catch((e) => {
        setSupabaseError(e instanceof Error ? e.message : 'Supabase save failed.');
        // Reload the truth; only fall back to captured state if the
        // reload itself fails (e.g. offline).
        refreshSupabase(userId).catch(() => {
          setDone(prevDone);
          setCompletionsByHabit(prevComp);
          setStreaks(prevStreaks);
          setBestStreaks(prevBest);
          setDayCompletions(prevDay);
        });
      });
    },
    habits,
    streaks,
    bestStreaks,
    widgetWeek,
    supabaseConfigured: isSupabaseConfigured,
    supabaseError,
    authUser,
    authLoading,
    signOut: async () => {
      if (!isSupabaseConfigured) return;
      await supabaseSignOut();
      setAuthUser(null);
      resetToStatic();
    },
    isPremium,
    revenueCatConfigured: isRevenueCatConfigured,
    revenueCatError,
    offerings,
    revenueCatLoading,
    refreshRevenueCat,
    purchasePackage,
    restorePurchases,
    // Configured AND signed in only (HabitForm branches on both). After
    // a successful write the whole list is reloaded so streaks recompute.
    saveHabit: async (input: HabitInput) => {
      if (!authUser) throw new Error('Sign in to save habits.');
      const isNew = !input.id;
      await upsertHabit(input, authUser.id);
      // STEP 8 (error handling): a reload failure after a successful
      // write must NOT report the save as failed — the habit IS saved,
      // it just is not reloaded yet. Surface the reload error in
      // Settings and let the form navigate; the next load picks it up.
      try {
        await refreshSupabase(authUser.id);
        setSupabaseError(null);
      } catch (e) {
        setSupabaseError(e instanceof Error ? e.message : 'Supabase reload failed — your habit was saved, reload to see it.');
      }
      // New habits only (edits log nothing); slot only, never the name.
      if (isNew) logEvent('habit_created', { slot: input.slot });
    },
    suggestions,
    // STEP 7 (real Weekly Report): Apply actually changes the habit,
    // Dismiss actually hides the suggestion — both persist when
    // configured + signed in, otherwise session-only. Apply parsing
    // is deliberately narrow and documented: "Move … to the morning/
    // afternoon/evening" changes the habit's slot; "Lower … target to
    // X" changes its target; "Keep … as it is" changes nothing (there
    // is nothing to change). Any other suggestion kind only marks
    // its state — it never claims a habit change it did not make.
    // On a configured write failure the state (and any habit change)
    // reverts and the error surfaces in Settings, never as a fake
    // "Applied".
    applySuggestion: (id) => {
      const s = suggestions.find((x) => x.id === id);
      if (!s || s.state !== 'new') return;
      const prevHabits = habits;
      let changedHabit: Habit | null = null;
      const habit = habits.find((h) => h.id === s.habitId);
      if (habit) {
        const move = s.title.match(/to the (morning|afternoon|evening)/i);
        const lower = s.title.match(/target to (.+)$/i);
        if (move) {
          changedHabit = { ...habit, slot: move[1]!.toLowerCase() as Habit['slot'] };
        } else if (/lower/i.test(s.title) && lower) {
          changedHabit = { ...habit, target: lower[1]!.trim() };
        }
      }
      if (changedHabit) {
        const next = changedHabit;
        setHabits((prev) => prev.map((h) => (h.id === next.id ? next : h)));
      }
      setSuggestions((prev) => prev.map((x) => (x.id === id ? { ...x, state: 'applied' } : x)));
      if (!isSupabaseConfigured || !authUser) return;
      const userId = authUser.id;
      const changed = changedHabit;
      (async () => {
        try {
          if (changed) {
            await upsertHabit(
              { id: changed.id, name: changed.name, icon: changed.icon, color: changed.color, slot: changed.slot, target: changed.target, reminder: changed.reminder },
              userId,
            );
            await refreshSupabase(userId);
          }
          await setSuggestionState(userId, id, 'applied');
        } catch (e) {
          setSuggestions((prev) => prev.map((x) => (x.id === id ? { ...x, state: 'new' } : x)));
          if (changed) setHabits(prevHabits);
          setSupabaseError(e instanceof Error ? e.message : 'Supabase save failed.');
        }
      })();
    },
    dismissSuggestion: (id) => {
      const s = suggestions.find((x) => x.id === id);
      if (!s || s.state !== 'new') return;
      setSuggestions((prev) => prev.map((x) => (x.id === id ? { ...x, state: 'dismissed' } : x)));
      if (!isSupabaseConfigured || !authUser) return;
      const userId = authUser.id;
      setSuggestionState(userId, id, 'dismissed').catch((e) => {
        setSuggestions((prev) => prev.map((x) => (x.id === id ? { ...x, state: 'new' } : x)));
        setSupabaseError(e instanceof Error ? e.message : 'Supabase save failed.');
      });
    },
    routines,
    // STEP 7: one save path for routines. Configured + signed in:
    // Supabase + reload (so the list, and any recomputed state, comes
    // from the DB). Otherwise: local list for this session only.
    // Editing a routine resets its run progress — its steps changed,
    // so an old step index would point at the wrong step.
    saveRoutine: async (input: RoutineInput) => {
      if (isSupabaseConfigured && authUser) {
        await upsertRoutine(input, authUser.id);
        // STEP 8: same reload-failure rule as saveHabit — a saved
        // routine is not a failed save just because the reload failed.
        try {
          await refreshRoutines(authUser.id);
        } catch (e) {
          setSupabaseError(e instanceof Error ? e.message : 'Supabase reload failed — your routine was saved, reload to see it.');
        }
      } else {
        setRoutines((prev) => {
          if (input.id) {
            return prev.map((r) => (r.id === input.id
              ? { ...r, name: input.name, startTime: input.startTime, habitIds: input.habitIds }
              : r));
          }
          return [...prev, { id: `r${Date.now()}`, name: input.name, startTime: input.startTime, percent: 0, habitIds: input.habitIds }];
        });
      }
      if (input.id) setRunSteps((prev) => ({ ...prev, [input.id!]: 0 }));
    },
    runSteps,
    setRunStepFor: (routineId: string, n: number) =>
      setRunSteps((prev) => ({ ...prev, [routineId]: Math.max(0, n) })),
    completionHistory,
    historySource,
    tourDismissed, dismissTour: () => setTourDismissed(true),
    startTour: () => { setTourStep(0); setTourActive(true); },
    tourActive, tourStep, registerTourTarget, unregisterTourTarget,
    requestTourRemeasure: () => setRemeasureNonce((n) => n + 1),
    notifEnabled,
    // The Settings toggle is the single control. Turning OFF cancels
    // everything scheduled. Turning ON asks for permission (system
    // prompt) only if not already granted, and schedules only on a
    // grant — never silently when denied. Denied is never re-prompted
    // here; Settings offers system settings instead.
    toggleNotif: (enabled: boolean) => {
      setNotifEnabled(enabled);
      if (!enabled) {
        cancelAllNotifications().catch(() => {});
        setNotifError(null);
        return;
      }
      if (notifPermission === 'granted') {
        scheduleAllNotifications(habits).then(
          () => setNotifError(null),
          (e) => setNotifError(e instanceof Error ? e.message : 'Notification scheduling failed.'),
        );
      } else if (notifPermission === 'denied') {
        // Do not re-prompt: the OS will not show the prompt again.
        return;
      } else {
        requestSystemNotifPermission().then((status) => {
          setNotifPermission(status);
          if (status !== 'granted') return;
          scheduleAllNotifications(habits).then(
            () => setNotifError(null),
            (e) => setNotifError(e instanceof Error ? e.message : 'Notification scheduling failed.'),
          );
        });
      }
    },
    notifPermission,
    notifError,
    requestNotifPermission: async () => {
      if (notifPermission === 'granted') {
        await scheduleAllNotifications(habits);
        return 'granted';
      }
      if (notifPermission === 'denied') return 'denied';
      const status = await requestSystemNotifPermission();
      setNotifPermission(status);
      if (status === 'granted') {
        try {
          await scheduleAllNotifications(habits);
          setNotifError(null);
        } catch (e) {
          setNotifError(e instanceof Error ? e.message : 'Notification scheduling failed.');
        }
      }
      return status;
    },
    openNotifSettings: async () => { await openSystemNotifSettings(); },
    // STEP 5 (Firebase): configured only after a successful native
    // probe; analyticsEnabled is the persisted opt-out toggle.
    firebaseConfigured,
    analyticsEnabled,
    toggleAnalytics,
  };

  // STEP 6: push the live snapshot to the placed home widget whenever
  // today's completion state, the habit list, or the week changes:
  // app launch (static, then real after a Supabase load), every
  // toggleDone (optimistic, then reverted if the Supabase write fails),
  // every HabitForm save (via the reload in saveHabit), sign-in load,
  // and sign-out reset. The widget file is imported lazily and the
  // call is wrapped in try/catch: in Expo Go (no native widget module,
  // no placed widget) this is a silent no-op — it never crashes the
  // app, never logs, and never pretends the widget updated. The same
  // values go to WidgetPreview via ui.widgetWeek, so the preview and
  // the placed widget can never show different weeks. Dedupe by JSON
  // so an unchanged snapshot is not re-sent on every render.
  const lastWidgetSnapshotRef = useRef<string>('');
  useEffect(() => {
    const doneCount = habits.filter((h) => done.has(h.id)).length;
    const total = habits.length;
    const percent = total > 0 ? Math.round((doneCount / total) * 100) : 0;
    const doneNames = habits.filter((h) => done.has(h.id)).map((h) => h.name).join(' · ');
    const snapshot = {
      doneCount,
      total,
      percent,
      doneNames,
      weekStatus: widgetWeek.status,
      todayIndex: widgetWeek.todayIndex,
    };
    const key = JSON.stringify(snapshot);
    if (key === lastWidgetSnapshotRef.current) return;
    lastWidgetSnapshotRef.current = key;
    (async () => {
      try {
        const mod = await import('./src/widgets/HabitWidget');
        const widget = (mod as { default?: { updateSnapshot?: (props: unknown) => void } }).default;
        widget?.updateSnapshot?.(snapshot);
      } catch {
        // No native widget module (Expo Go) or no placed widget: no-op.
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done, habits, widgetWeek.status.join(','), widgetWeek.todayIndex]);

  // STEP 4 tap handling: a notification tap opens the app to Today
  // (minimum deep link; data carries habitId/kind for a later step).
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as { route?: unknown } | undefined;
      if (data?.route === 'today') goTab('today');
    });
    return () => sub.remove();
  }, [goTab]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (sheet) { setSheet(false); return true; }
      if (paywall) { setPaywall(false); return true; }
      if (tourActive) { setTourActive(false); return true; }
      if (stack.length > 1) { back(); return true; }
      return false;
    });
    return () => sub.remove();
  }, [sheet, paywall, tourActive, stack.length, back]);

  // Register the bottom tab bar + central + button as tour targets. These
  // are rendered by App itself, so they are always measurable on tab screens.
  useEffect(() => {
    const makeMeasure = (key: string): TourMeasure => () => new Promise((resolve) => {
      const node = tabRefs.current[key];
      if (!node) return resolve(null);
      node.measureInWindow((x: number, y: number, width: number, height: number) => resolve(width > 0 ? { x, y, width, height } : null));
    });
    (['today', 'routines', 'progress', 'settings'] as const).forEach((t) => {
      registerTourTarget(`tab-${t}` as TourTarget, makeMeasure(`tab-${t}`));
    });
    registerTourTarget('tab-plus', makeMeasure('tab-plus'));
    // No cleanup: tab bar refs live as long as App does.
  }, [registerTourTarget]);

  // AUTO-SHOW FOR NEW USERS: the first time the app reaches the Today
  // screen in a session, start the tour once. Dismissing/Skipping it sets
  // tourActive false but tourAutoShown stays true, so returning to Today
  // later in the same session never restarts it. Manual replay via ?,
  // intro card, Settings, or Help still works. Reload resets the flag
  // (session-only, no persistence in this UI build).
  useEffect(() => {
    if (route.name === 'today' && !tourAutoShown.current && !tourActive) {
      tourAutoShown.current = true;
      setTourStep(0);
      setTourActive(true);
    }
  }, [route.name, tourActive]);

  // Measure the current step's target in ROOT coordinates (see the
  // AppInner comment above). Root = the <View flex:1> that wraps content
  // + tabs and also contains the tour overlay, so a rect converted as
  // (target window rect − root window rect) is exactly where the overlay
  // must draw it, on every Android device, with no assumption about
  // SafeAreaView's absolute-child origin, status-bar height, or notch.
  // Re-runs on step/route/inset/re-measure changes, tries immediately,
  // 150ms and 400ms, and keeps the LAST valid rect. A missing measurer,
  // a zero-size rect, or a rect fully outside the root yields null, and
  // TourTooltip falls back to the bottom bubble.
  useEffect(() => {
    if (!tourActive) { setTargetRect(null); return; }
    const step = TOUR_STEPS[tourStep] ?? TOUR_STEPS[0];
    if (!step.target) { setTargetRect(null); return; }
    const W = Dimensions.get('window').width;
    const H = Dimensions.get('window').height;
    const safeW = Math.max(1, W - insets.left - insets.right);
    const safeH = Math.max(1, H - insets.top - insets.bottom);
    let cancelled = false;
    const measureNode = (node: any): Promise<TourRect | null> => new Promise((resolve) => {
      if (!node) return resolve(null);
      node.measureInWindow((x: number, y: number, width: number, height: number) =>
        resolve(width > 0 ? { x, y, width, height } : null));
    });
    const attempt = async () => {
      const measure = tourMeasurers.current.get(step.target!);
      if (!measure) { if (!cancelled) setTargetRect(null); return; }
      try {
        const rect = await measure();
        if (cancelled || !rect) { if (!cancelled) setTargetRect(null); return; }
        const rootRect = await measureNode(rootRef.current);
        // Root-relative rect (preferred, exact) or inset fallback.
        const safeRect: TourRect = rootRect
          ? { x: rect.x - rootRect.x, y: rect.y - rootRect.y, width: rect.width, height: rect.height }
          : { x: rect.x - insets.left, y: rect.y - insets.top, width: rect.width, height: rect.height };
        const boundW = rootRect ? rootRect.width : safeW;
        const boundH = rootRect ? rootRect.height : safeH;
        if (safeRect.x + safeRect.width < 0 || safeRect.x > boundW ||
            safeRect.y + safeRect.height < 0 || safeRect.y > boundH) {
          setTargetRect(null); return;
        }
        setTargetRect(safeRect);
      } catch { if (!cancelled) setTargetRect(null); }
    };
    attempt();
    const t1 = setTimeout(attempt, 150);
    const t2 = setTimeout(attempt, 400);
    return () => { cancelled = true; clearTimeout(t1); clearTimeout(t2); };
  }, [tourActive, tourStep, route.name, insets.top, insets.bottom, insets.left, insets.right, remeasureNonce]);

  const goToTourDestination = useCallback((destination: TourDestination) => {
    // Guarded: never push a route that is already on top, never duplicate a tab.
    if (destination === 'today' || destination === 'routines' || destination === 'progress' || destination === 'settings') {
      if (route.name !== destination) goTab(destination);
    } else if (route.name !== destination) {
      push({ name: destination });
    }
  }, [route.name, goTab, push]);

  let content: React.ReactNode = null;
  switch (route.name) {
    case 'splash': content = <Splash nav={nav} ui={ui} />; break;
    case 'welcome': content = <Welcome nav={nav} ui={ui} />; break;
    case 'goal': content = <Goal nav={nav} ui={ui} />; break;
    case 'starter': content = <Starter nav={nav} ui={ui} />; break;
    case 'today': content = <Today nav={nav} ui={ui} />; break;
    case 'habitDetail': content = <HabitDetail nav={nav} ui={ui} />; break;
    case 'habitForm': content = <HabitForm nav={nav} ui={ui} />; break;
    case 'routines': content = <Routines nav={nav} ui={ui} />; break;
    case 'routineDetail': content = <RoutineDetail nav={nav} ui={ui} />; break;
    case 'routineForm': content = <RoutineForm nav={nav} ui={ui} />; break;
    case 'progress': content = <Progress nav={nav} ui={ui} />; break;
    case 'weeklyReport': content = <WeeklyReport nav={nav} ui={ui} />; break;
    case 'settings': content = <Settings nav={nav} ui={ui} />; break;
    case 'habitsGrid': content = <HabitsGrid nav={nav} ui={ui} />; break;
    case 'login': content = <Login nav={nav} ui={ui} />; break;
    case 'signup': content = <Signup nav={nav} ui={ui} />; break;
    case 'forgot': content = <Forgot nav={nav} ui={ui} />; break;
    case 'widgetPreview': content = <WidgetPreview nav={nav} ui={ui} />; break;
    case 'paymentSetup': content = <PaymentSetup nav={nav} ui={ui} />; break;
    case 'legal': content = <Legal nav={nav} ui={ui} />; break;
    default: content = <Today nav={nav} ui={ui} />;
  }
  const showTabs = isTabRoute(route);

  const safeWidth = Math.max(1, Dimensions.get('window').width - insets.left - insets.right);
  const safeHeight = Math.max(1, Dimensions.get('window').height - insets.top - insets.bottom);

  return (
    <>
      <StatusBar style="light" />
      <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={['top', 'left', 'right', 'bottom']}>
        <View ref={rootRef} collapsable={false} style={{ flex: 1 }}>
          {content}
          {showTabs && (
            <View style={{ flexDirection: 'row', backgroundColor: c.surface, borderTopColor: c.border, borderTopWidth: 1, paddingTop: spacing.sm, paddingBottom: spacing.sm, alignItems: 'center' }}>
              {TABS.slice(0, 2).map((t) => (
                <Pressable key={t.id} ref={(el) => { tabRefs.current[`tab-${t.id}`] = el; }} collapsable={false} onPress={() => goTab(t.id)} style={{ flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 20 }}>{t.icon}</Text>
                  <Text style={{ color: route.name === t.id ? c.primary : c.muted, fontSize: type.small, fontWeight: route.name === t.id ? '700' : '400' }}>{t.label}</Text>
                </Pressable>
              ))}
              <Pressable ref={(el) => { tabRefs.current['tab-plus'] = el; }} collapsable={false} onPress={() => setSheet(true)} style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: c.primary, alignItems: 'center', justifyContent: 'center', marginHorizontal: 4, shadowColor: c.primary, shadowOpacity: 0.4, shadowRadius: 10, elevation: 4 }}>
                <Text style={{ color: c.onPrimary, fontSize: 28, fontWeight: '800' }}>+</Text>
              </Pressable>
              {TABS.slice(2).map((t) => (
                <Pressable key={t.id} ref={(el) => { tabRefs.current[`tab-${t.id}`] = el; }} collapsable={false} onPress={() => goTab(t.id)} style={{ flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 20 }}>{t.icon}</Text>
                  <Text style={{ color: route.name === t.id ? c.primary : c.muted, fontSize: type.small, fontWeight: route.name === t.id ? '700' : '400' }}>{t.label}</Text>
                </Pressable>
              ))}
            </View>
          )}
          {/* Tour overlay INSIDE the root View (which is inside
              SafeAreaView), over content + tabs, in ROOT coordinates
              (see the AppInner comment). Its origin is therefore exactly
              the origin the target rects were converted to — this is
              what makes the frame land on the element on every device,
              instead of depending on SafeAreaView's absolute-child origin.
              It still cannot sit under a system bar, because the root
              View's bounds are the safe-area bounds. */}
          {tourActive && (
            <TourTooltip
              stepIndex={tourStep}
              targetRect={targetRect}
              safeWidth={safeWidth}
              safeHeight={safeHeight}
              onNext={() => { if (tourStep >= TOUR_STEPS.length - 1) setTourActive(false); else setTourStep((s) => s + 1); }}
              onBack={() => setTourStep((s) => Math.max(0, s - 1))}
              onSkip={() => setTourActive(false)}
              onClose={() => setTourActive(false)}
              onGoTo={goToTourDestination}
            />
          )}
        </View>
        {sheet && (
          <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
            <View style={{ backgroundColor: c.surface, padding: spacing.xl, borderTopLeftRadius: 24, borderTopRightRadius: 24 }}>
              <Text style={{ color: c.ink, fontWeight: '800', fontSize: type.subtitle, marginBottom: spacing.md }}>Add something</Text>
              <Pressable onPress={() => { setSheet(false); push({ name: 'habitForm' }); }} style={{ minHeight: 48, justifyContent: 'center' }}><Text style={{ color: c.ink }}>＋ Add habit</Text></Pressable>
              <Pressable onPress={() => { setSheet(false); push({ name: 'routineForm' }); }} style={{ minHeight: 48, justifyContent: 'center' }}><Text style={{ color: c.ink }}>＋ Create routine</Text></Pressable>
              <Pressable onPress={() => setSheet(false)} style={{ minHeight: 48, justifyContent: 'center' }}><Text style={{ color: c.primary, fontWeight: '700' }}>Cancel</Text></Pressable>
            </View>
          </View>
        )}
        {paywall && <Paywall onClose={() => setPaywall(false)} ui={ui} />}
      </SafeAreaView>
    </>
  );
}

// Root: provider must wrap the component that calls useSafeAreaInsets().
export default function App() {
  return (
    <SafeAreaProvider>
      <AppInner />
    </SafeAreaProvider>
  );
}
