# Architecture.md — Smart Habit & Routine Planner

## Stack

- Expo SDK 58, React Native 0.88, React 19.3, TypeScript (strict).
- Navigation: typed custom navigation stack (`src/navigation.ts`),
  NOT Expo Router. Every route is a member of the `Route` union and
  the `Nav` interface (`route`, `push`, `back`, `goTab`, `openPaywall`)
  is passed to screens as a prop. A misspelled route or missing
  parameter is a compile error, not a runtime blank screen.
- Data: Expo SQLite (`src/services/db.ts`), database `smarthabit.db`.
- Notifications: `expo-notifications` (local only).
- Tests: Jest. Build check: `tsc --noEmit` + Android export.
- Package name (v2): `com.smarthabit.planner.v2`. No EAS project is
  linked yet (see setup.md).

## Why custom navigation

Small, fixed screen set; no file-based routing machinery is needed;
it keeps the Android export simple and avoids router peer-version
risk on this Expo SDK. Revisit only if the screen count grows
substantially or deep linking becomes a requirement.

## Folder layout

```
src/
  theme.ts            # Deep Teal tokens, spacing, radius, type, icons, goals
  types.ts            # Habit, Completion, Routine, Suggestion, WeeklyReport, limits
  navigation.ts       # Route union, Nav interface, resolveEffectiveRoute, back handling
  store.tsx           # Loads from SQLite on startup, writes through on every change
  screens/            # Splash, OnboardingWelcome/Goal/Starter, Today, HabitDetail,
                      # HabitForm, HabitsGrid, Routines, RoutineDetail, RoutineForm,
                      # Progress, WeeklyReport, Paywall, Settings, Legal
  components/         # IconTile, Tooltip, ui (shared primitives)
  lib/                # dates, heatmap
  services/
    db.ts             # SQLite schema + migrations (incl. notification_id, tour_seen)
    streaks.ts        # Streaks, best streaks, completion rates
    suggestions.ts    # Weekly-report suggestion rules
    notifications.ts  # Local reminders, per-habit notification ids
    subscription.ts   # RevenueCat STUB — no key, no products, isPremium() always false
    sync.ts           # Supabase STUB — no URL/key, syncStatus() reports local-only
```

## Data model

### prefs
Onboarding state, goal, wake time, evening review time, theme
(always `dark`), notifications flag, `tour_seen`. Preferences live in
SQLite, not AsyncStorage (AsyncStorage is installed but unused for
user data in v2).

### habits
`id, name, icon, color, type (do | avoid | measurable), target, unit,
frequency (daily | weekdays | weekly), weekdays[], weeklyTarget,
timeSlot (morning | afternoon | evening), startDate, skipDays[],
reminderEnabled, reminderTime, notificationId, createdAt, updatedAt,
paused, archived`.

### completions
`id, habitId, date, status (done | skipped | failed), value, createdAt,
updatedAt`. Constraint: `UNIQUE(habit_id, date)` — one record per habit
per day. The completion engine is idempotent: re-tapping undoes, it
never creates a duplicate record.

### routines
`id, name, startTime, habitIds[] (ordered), createdAt, updatedAt`.
Routine order is stored; drag reorder persists via the store.

### weekly_reports + suggestions
`WeeklyReport: id, weekId, totalCompletions, bestDay, bestStreak,
lowestHabitId, suggestions[], status (new | applied | dismissed)`.
`Suggestion: id, kind (move-to-morning | reduce-frequency | pause |
lower-target), habitId, reason, applied, dismissed`.

## Key flows in code

- **Startup:** store loads from SQLite → `resolveEffectiveRoute()`:
  loading → Splash, fresh → Welcome, returning (onboarding complete)
  → Today. Splash also has a Continue fallback (→ Today if complete,
  else Welcome) so no user can be stuck on Splash.
- **Today tap:** row → Habit Detail; check → completion engine
  (done / undo); `+` → action sheet → Habit Form / Routine Form.
- **Back button (Android):** action sheet → paywall overlay → stack
  pop → exit only at a root tab screen.
- **Reminder lifecycle:** habit save stores `notificationId`; time
  change, disable, or delete cancels the old notification first.
- **Weekly Report:** reloads when the store becomes ready and on
  every showing (the screen remounts on each push).
- **Paywall:** overlay on top of the current screen; draft state is
  preserved, not remounted away.

## Streak engine (rules, see PRD §6)

Implemented in `src/services/streaks.ts` and unit-tested: done +1,
scheduled-missed resets to 0, planned skip and unscheduled days do
not break a streak, measurable counts only at 100% of target, midnight
rollover marks undone scheduled habits missed.

## Auth (2026-10-30 decision, not yet built)

- **Provider: Supabase Auth.** Email + password and Google sign-in
  both go through Supabase Auth — one provider, not two separate
  auth systems.
- **Google sign-in path:** app → Supabase Auth (Google provider) →
  Google OAuth consent → back to the app via the configured
  redirect URL → Supabase session. The Google Cloud OAuth client
  (client ID, redirect URIs) is configured by the user in Google
  Cloud + Supabase dashboard; the client secret, if any, lives in
  Supabase only and is never pasted into chat, code, or docs.
- **New service (when built):** `src/services/auth.ts` — sign up,
  sign in, sign in with Google, sign out, password reset, session
  restore on launch. It wraps Supabase Auth only; it must not
  invent its own password storage.
- **Session storage:** Supabase session token in secure storage
  (`expo-secure-store` or equivalent), NOT in SQLite with habit
  data and NOT in plain AsyncStorage. On launch, restore session
  silently; if restore fails, the user stays logged out and the
  app still works offline.
- **Local data on login:** habits/completions stay local-first.
  A future sync layer merges by habit id and by
  `UNIQUE(habit_id, date)`; it must never delete local rows on
  first login. Sync itself is still a later phase (see plan.md).
- **Until configured:** `auth.ts` is a stub like `subscription.ts`
  and `sync.ts`: it reports "not configured", Login/Signup show
  that state, and no sign-in is faked.

## Prepared but NOT connected

- **Supabase (`sync.ts` + Auth):** stub only. No URL, key, or account. Nothing
  is uploaded. Settings shows local-only status + "Continue offline".
- **RevenueCat (`subscription.ts`):** stub only. `AVAILABLE_PRODUCTS`
  is empty, `isPremium()` is always false, purchase/restore return
  "not configured". No price in the app may come from anywhere else.
- **EAS:** `eas.json` profiles exist, but no project is linked and no
  production build has been run from this codebase.

## Non-functional requirements

- Offline-first: every MVP feature works with no network.
- Privacy: no account required; data stays on device in MVP.
- Performance: Habits Grid renders ~183 heatmap cells per card — this
  is unmeasured with many habits and is a known watch item, not a
  claimed optimisation.
- Accessibility: 48dp minimum targets, ink primary text, no
  colour-only meaning (streak flame + count, not flame alone).
