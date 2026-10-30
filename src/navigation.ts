import type { Habit, Routine, Suggestion } from './theme';
import type { AuthUser } from './supabase';
import type { RcPackage } from './revenuecat';

export type TabName = 'today' | 'routines' | 'progress' | 'settings';
export type Route =
  | { name: 'splash' }
  | { name: 'welcome' }
  | { name: 'goal' }
  | { name: 'starter' }
  | { name: 'today' }
  | { name: 'habitDetail'; habitId: string }
  | { name: 'habitForm'; habitId?: string }
  | { name: 'routines' }
  | { name: 'routineDetail'; routineId: string }
  | { name: 'routineForm'; routineId?: string }
  | { name: 'progress' }
  | { name: 'weeklyReport' }
  | { name: 'settings' }
  | { name: 'habitsGrid' }
  | { name: 'login' }
  | { name: 'signup' }
  | { name: 'forgot' }
  | { name: 'widgetPreview' }
  | { name: 'paymentSetup' }
  | { name: 'legal'; page: 'Terms' | 'Privacy' | 'Help' };

export interface Nav {
  route: Route;
  push: (r: Route) => void;
  back: () => void;
  goTab: (t: TabName) => void;
  openPaywall: () => void;
  closePaywall: () => void;
  openSheet: () => void;
  closeSheet: () => void;
}

export type TourTarget =
  | 'today-completed'
  | 'today-free-tier'
  | 'today-help'
  | 'today-first-habit'
  | 'today-first-check'
  | 'tab-plus'
  | 'tab-today'
  | 'tab-routines'
  | 'tab-progress'
  | 'tab-settings'
  | 'routines-first'
  | 'progress-score'
  | 'report-first'
  | 'grid-first'
  | 'payment-skip'
  | 'settings-tour';

export interface TourRect { x: number; y: number; width: number; height: number; }
export type TourMeasure = () => Promise<TourRect | null>;

export interface UiState {
  done: Set<string>;
  toggleDone: (id: string) => void;
  // STEP 1 (Supabase persistence): the runtime habit list. When Supabase
  // is NOT configured this is exactly the static seed list (data.ts);
  // when configured it is the list loaded from Supabase. Screens must
  // read habits from here, never from the static list directly.
  habits: Habit[];
  // Current streak per habit id, computed by src/streak.ts from history
  // when configured, or the static seeded streak when not configured.
  streaks: Record<string, number>;
  bestStreaks: Record<string, number>;
  // True only when both EXPO_PUBLIC_SUPABASE_* variables are set (see
  // src/supabase.ts). False means: session-only, nothing is saved, and
  // Settings must say so truthfully — never claim sync works.
  supabaseConfigured: boolean;
  // Last Supabase error, if a configured load/write failed (null when
  // unconfigured or when the last operation succeeded). Shown in
  // Settings only; a failure falls back to the static list, never to
  // fake rows.
  supabaseError: string | null;
  // STEP 2 (Supabase Auth): the signed-in user, or null. Null means
  // either Supabase is not configured or no account is signed in — in
  // both cases the app works fully without an account (static,
  // session-only). Screens must never treat null as an error.
  authUser: AuthUser | null;
  // True while the saved session is being restored on launch
  // (configured only; false immediately when unconfigured).
  authLoading: boolean;
  // Sign out (configured only). App resets local state to the static
  // list on sign-out; Supabase rows are never deleted by signing out.
  signOut: () => Promise<void>;
  // Persist a habit to Supabase (configured AND signed in only).
  // HabitForm calls this only in that case; otherwise it keeps today's
  // behaviour (Save returns to Today and persists nothing).
  saveHabit: (input: {
    id?: string; name: string; icon: string; color: string;
    slot: 'morning' | 'afternoon' | 'evening'; target: string; reminder: string;
  }) => Promise<void>;
  // STEP 3 (RevenueCat payments): premium state, checked against the
  // premium entitlement in RevenueCat only. False by default and false
  // whenever RevenueCat is not configured — the app never claims a user
  // is Premium without an active entitlement. Free-limit enforcement
  // (HabitForm / RoutineForm) reads this field, nothing else.
  isPremium: boolean;
  // True only when EXPO_PUBLIC_REVENUECAT_API_KEY is set (see
  // src/revenuecat.ts). False means: plan names only, no prices, no
  // purchase, no unlock — Settings and the Paywall must say so.
  revenueCatConfigured: boolean;
  // Last RevenueCat error, if a configured offerings / purchase /
  // restore call failed (null when unconfigured or last call succeeded).
  // Shown in Settings / Paywall / PaymentSetup; never swallowed.
  revenueCatError: string | null;
  // Current offering's packages, with prices from RevenueCat only
  // (empty when unconfigured or when no offering is available).
  offerings: RcPackage[];
  // True while offerings / premium state are being loaded.
  revenueCatLoading: boolean;
  // Re-fetch offerings + premium state (configured only; a no-op with
  // no error when unconfigured, so Retry buttons are safe to render).
  refreshRevenueCat: () => Promise<void>;
  // Purchase one package by identifier. Resolves true only when the
  // resulting CustomerInfo has the premium entitlement active; throws
  // on cancellation / error so the UI can surface it truthfully.
  purchasePackage: (identifier: string) => Promise<boolean>;
  // Restore previous purchases. Resolves true only when the restored
  // CustomerInfo has the premium entitlement active.
  restorePurchases: () => Promise<boolean>;
  suggestions: Suggestion[];
  applySuggestion: (id: string) => void;
  dismissSuggestion: (id: string) => void;
  // STEP 7 (real routines): the runtime routine list. When Supabase is
  // NOT configured (or no account is signed in) this is exactly the
  // static seed list (data.ts); when configured + signed in it is the
  // list loaded from Supabase. Screens must read routines from here,
  // never from the static list directly.
  routines: Routine[];
  // Persist a routine to Supabase (configured AND signed in only).
  // Otherwise it updates the local list for this session only.
  // RoutineForm calls this in both cases; the form must not claim a
  // save happened when it did not.
  saveRoutine: (input: {
    id?: string; name: string; startTime: string; habitIds: string[];
  }) => Promise<void>;
  // STEP 7 (real runs — fixes the old shared-runStep bug): run progress
  // is scoped PER routine id. Two routines never share a step counter:
  // starting routine A, leaving it at step 2, then opening routine B
  // starts B at step 0, and returning to A resumes at step 2.
  runSteps: Record<string, number>;
  setRunStepFor: (routineId: string, n: number) => void;
  // STEP 7 (real Weekly Report): full completion history, exactly the
  // rows loaded from Supabase (habit_id, date, status). Empty when
  // unconfigured/unsigned-in. historySource is 'real' only after a
  // Supabase load for a signed-in user; otherwise 'static', and the
  // Weekly Report must label its numbers as a static preview.
  completionHistory: { habit_id: string; date: string; status: 'done' | 'skip' }[];
  historySource: 'real' | 'static';
  tourDismissed: boolean;
  dismissTour: () => void;
  startTour: () => void;
  tourActive: boolean;
  tourStep: number;
  registerTourTarget: (key: TourTarget, measure: TourMeasure) => void;
  unregisterTourTarget: (key: TourTarget) => void;
  // Ask App to re-measure the current tour target (e.g. after a ScrollView
  // scroll settles). Incrementing this nonce re-runs App's measurement
  // effect; it is NOT a navigation action and never changes the step.
  requestTourRemeasure: () => void;
  // STEP 4 (local notifications): the Settings toggle is the single
  // control, wired to real scheduling/cancelling in App.tsx — it is not
  // UI state alone. notifPermission is the OS permission state
  // ('unknown' until first checked); notifError is the last scheduling
  // error, if any. requestNotifPermission asks via the system prompt
  // (user action only); openNotifSettings opens OS app settings (the
  // only route once permission is denied).
  notifEnabled: boolean;
  toggleNotif: (enabled: boolean) => void;
  notifPermission: 'granted' | 'denied' | 'undetermined' | 'unknown';
  notifError: string | null;
  requestNotifPermission: () => Promise<'granted' | 'denied' | 'undetermined' | 'unknown'>;
  openNotifSettings: () => Promise<void>;
  // STEP 6 (live home widget): the week the widget shows, Monday first.
  // status comes from real completion history when Supabase is
  // configured + signed in (source 'real'), otherwise from the static
  // fallback week (source 'static'). todayIndex is today's index in
  // that week (0 = Monday); in static mode it is the fictional
  // Thursday (3) the app has always shown. WidgetPreview renders
  // exactly this, and App sends the same values to the placed widget
  // via updateSnapshot — never a different week in the two places.
  widgetWeek: {
    status: ('done' | 'today' | 'missed' | 'future')[];
    todayIndex: number;
    source: 'real' | 'static';
  };
  // STEP 5 (Firebase Analytics + Crashlytics): true only after a
  // successful native probe (see src/firebase.ts) — installing the
  // npm packages alone does NOT make this true. False means: no
  // events are sent, and Settings must say so truthfully.
  firebaseConfigured: boolean;
  // True when the user has analytics enabled (default true). Logging
  // is effective only when firebaseConfigured AND analyticsEnabled
  // are both true; the toggle below flips this and persists it.
  analyticsEnabled: boolean;
  // Flip the analytics opt-out. Works even when unconfigured, so a
  // preference set before Firebase is connected is honoured later.
  toggleAnalytics: (enabled: boolean) => void;
}

export const TAB_ROUTES: Record<TabName, Route> = {
  today: { name: 'today' },
  routines: { name: 'routines' },
  progress: { name: 'progress' },
  settings: { name: 'settings' },
};

export function routeTab(r: Route): TabName | null {
  if (r.name === 'today') return 'today';
  if (r.name === 'routines') return 'routines';
  if (r.name === 'progress') return 'progress';
  if (r.name === 'settings') return 'settings';
  return null;
}

export function isTabRoute(r: Route): boolean {
  return routeTab(r) !== null;
}
