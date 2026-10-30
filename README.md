# Smart Habit UI — UI-only Expo preview

A UI + navigation-only version of Dhruv's Smart Habit & Routine
Planner, built from the .md docs in
`~/workspace/goals/smart-habit-planner/files/smart-habit-docs/`
(Design.md, PRD.md, features.md, AppFlow.md).

**This is NOT a production app.** It has no sync and no purchases
yet. Local notifications ARE real (see "Notifications (STEP 4)"
below) once permission is granted — they are not a preview toggle.
Persistence exists as a prepared Supabase layer
(see "Supabase — persistence + streak engine" below), but it is OFF
until a real Supabase project + keys are configured — until then the
app is still static and session-only, exactly as before.

## What is UI-only / static

- All habits, routines, progress, and suggestions are hardcoded in
  `src/data.ts` and held in React state for the session only.
- Tapping a habit check, applying/dismissing a suggestion, or
  running a routine step only changes this session's state
  WHEN Supabase is not configured or no account is signed in.
  When configured + signed in, habit checks, habit-form saves,
  routine saves, run-step completions, and suggestion
  Apply/Dismiss states are all written to Supabase and survive
  reloads (see "Supabase — persistence + streak engine" and
  "Real Routine Run Mode + Real Weekly Report (STEP 7)" below).
  Reloading resets everything to the static data in `src/data.ts`
  only in the unconfigured/unsigned-in state.
- Login / Signup / Google buttons are UI preview only WHEN Supabase
  is not configured (see "Supabase Auth" below). In that state every
  auth screen shows: "UI preview — no account is created or signed
  in." Continue goes to payment setup only to demo navigation; it
  does NOT mean sign-in succeeded, and no account, token, or password
  is stored or sent anywhere. When Supabase IS configured, the same
  screens perform real Supabase Auth (see below).
- The Paywall is an overlay with plan names only and no prices
  WHEN RevenueCat is not configured (see "RevenueCat payments"
  below) — tapping a plan then does nothing and unlocks nothing.
  When RevenueCat IS configured, the same overlay lists real
  offering packages with RevenueCat prices and performs real
  purchases/restores. Closing it returns to the current screen,
  with no draft lost, in both states.
- Settings → Delete my data button currently does nothing and
  deletes nothing — see the Privacy Policy (Settings → Privacy
  Policy) for how to request deletion until a real delete flow
  is built. Legal screens (Terms / Privacy) now contain REAL
  policy/terms text for how the app actually works (STEP 8),
  but they are NOT ready for a Play release until the owner
  replaces the contact-email placeholder with a real address
  AND hosts the policy at a real URL for the Play listing —
  both are owner-supplied, neither is invented here.
- No Sleek DESIGN.md file, competitor assets, logos, or text were
  copied. Verdant Nightfall is interpreted in our own words from
  the style review, using the Design.md starting tokens.

## Supabase — persistence + streak engine (STEP 1, prepared, not connected)

Stack decision: **DB = Supabase** (payments = RevenueCat, analytics and
other services = Firebase — those are later steps, not this one).

- **What exists in code:** `supabase/schema.sql` (tables `habits` and
  `completions`, one completion per habit per day enforced by a
  primary key, RLS enabled), `src/supabase.ts` (client + repository +
  app-side demo seed), and wiring in `App.tsx` (habits, today's
  completions, and streaks now come from Supabase when configured;
  `src/streak.ts` is unchanged and still the only streak logic).
  Streak rules, unchanged from the spec: a streak is computed from
  history, never stored; done extends it, a passed scheduled day with
  no record resets it to 0, a Skip neither counts nor breaks it,
  unscheduled days neither count nor break it, and a binary toggle
  counts as done at 100% of target (partial amounts are a later step).
- **How to connect (needs a real project + keys from the user, via the
  secure flow only — never pasted into chat, code, or docs):**
  1. Create a Supabase project.
  2. In its SQL editor, run the whole `supabase/schema.sql` file.
  3. Copy `.env.example` to `.env` and set `EXPO_PUBLIC_SUPABASE_URL`
     and `EXPO_PUBLIC_SUPABASE_ANON_KEY` from Project Settings → API
     (for builds, use EAS secrets instead of a `.env` file).
  4. Restart the dev server / rebuild — `EXPO_PUBLIC` variables are
     inlined at build time, so a running session will not pick them up.
  5. Launch the app: on first launch with an empty `habits` table it
     seeds the same 6 demo habits + past completions matching their
     existing streaks (ending yesterday) + today done for water/run/
     walk. After seeding, a habit done today shows its old static
     streak + 1, because today now counts — that is the engine
     working, not a bug. Seeding never runs twice.
- **When NOT configured (today's default):** the app behaves exactly
  as it did before this step — static seed data, session-only, and
  Settings shows a truthful "Supabase not configured" card. Nothing
  is faked: no fake rows are written, and nothing claims sync works.
  HabitForm Save also keeps its old behaviour when unconfigured
  (returns to Today, persists nothing); when configured it writes to
  Supabase. A configured load/write failure falls back to the static
  list and shows the error in Settings — it never shows fake data.
- **What still blocks a real connection:** a real Supabase project +
  keys (not yet supplied). The Supabase Auth step (STEP 2, below) has
  already replaced the schema's temporary pre-auth RLS policies with
  user-scoped policies — but those policies only take effect when the
  updated `supabase/schema.sql` is re-run in the project. Do NOT ship
  to production on the old temporary policies: anyone with the anon
  key could read/write every row.
- **Still NOT in this step:** payments, notifications, routine
  persistence, and device testing of the Supabase path. Live
  widget data is now STEP 6 (below) — the home widget still
  needs a dev build, and its live-snapshot path is not
  device-tested. Auth itself is now STEP 2 (below), but its
  configured path is typecheck/export-verified only — not
  device- or project-tested, because no real Supabase project
  exists here yet.

## Supabase Auth (STEP 2, prepared, not connected)

- **What exists in code:** `src/supabase.ts` now creates the client
  with session persistence (`persistSession: true`, `autoRefreshToken:
  true`, storage = AsyncStorage), plus `signUpWithEmail`,
  `signInWithEmail`, `resetPasswordForEmail`, `signInWithGoogle`
  (Supabase OAuth via `expo-web-browser` + `expo-auth-session`,
  redirect `smarthabitui://auth-callback` from the `smarthabitui`
  scheme in app.json), and `signOut`. `App.tsx` restores the saved
  session on launch, subscribes to auth state changes, and passes
  `authUser` / `authLoading` / `signOut` through `UiState`.
  Auth screens (`src/screens/AuthScreens.tsx`) perform real auth
  when configured and keep their exact old preview behaviour when
  not configured. Settings shows the real state: signed-in email
  + working Sign out, or "Not signed in", plus the
  configured/not-configured Database wording.
- **Auth is OPTIONAL, never a gate:** onboarding Skip, Settings,
  and the new "Continue without an account" links on Login/Signup/
  Forgot all work with no account — the app runs fully, static and
  session-only, exactly as before. Signing in never wipes data:
  on sign-in App runs `ensureUserHabits` — (1) if the user already
  has habits, keep them; (2) otherwise claim the anonymous demo
  habits (the 6 demo ids, user_id null) via the schema's narrow
  migration policy, reassigning them and their completions to this
  user; (3) only if the user still has no habits, seed the demo
  habits FOR THIS USER. Signing out resets local state to the
  static list; it never deletes Supabase rows.
- **RLS (replaces STEP 1's temporary policies):**
  `supabase/schema.sql` now drops the temporary pre-auth anon
  policies and uses authenticated, user-scoped policies:
  habits `user_id = auth.uid()` (select/insert/update/delete),
  completions via habit ownership (`exists … h.user_id =
  auth.uid()`), plus one narrow migration policy allowing an
  authenticated user to UPDATE a habit with `user_id IS NULL`
  and id in the 6 demo ids, with check `user_id = auth.uid()`.
  Migration caveat, stated in the SQL too: anonymous habits with
  ids outside the demo set cannot be auto-claimed and stay in the
  database, invisible under RLS, until a manual migration — they
  are never deleted by app code. The anon role gets no policy, so
  a configured-but-unsigned-in app reads nothing from Supabase
  by design. Re-run the updated schema file in the project for
  these policies to take effect.
- **Google sign-in, truthfully:** the button calls Supabase
  OAuth; if the Google provider is not enabled in the dashboard,
  Supabase's provider error is surfaced as "Google sign-in is not
  configured in the Supabase dashboard yet" and the app does NOT
  navigate as if signed in. No client ID or secret is invented or
  stored anywhere — those live only in the Supabase dashboard.
  Email sign-up with confirmation required shows "Check your
  email" and does NOT treat that as signed in (no session yet).
  Forgot password sends a real Supabase reset email when
  configured, and keeps its preview state when not configured.
- **To connect (needs a real project + keys from the user, via the
  secure flow only — never pasted into chat, code, or docs):**
  1. Create a Supabase project and run the updated
     `supabase/schema.sql` in its SQL editor (re-running it also
     drops the old temporary policies).
  2. Set `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY`
     (`.env` locally, EAS secrets for builds) and restart/rebuild.
  3. In the Supabase dashboard, Authentication → URL Configuration,
     add `smarthabitui://auth-callback` to Redirect URLs (needed
     for Google OAuth and email links).
  4. For Google sign-in, enable the Google provider in
     Authentication → Sign-in providers (its client ID/secret live
     only there). Until that is done, Google correctly reports
     "not configured" — email/password auth still works.
  5. Sign in once: the merge/seed above runs, then habits and
     completions save under that account and survive reloads.
- **Security:** no email, token, or password is ever logged,
  stored in a plain file, or pasted into code/docs. Passwords go
  straight to Supabase Auth; sessions live in AsyncStorage via
  the Supabase client. No secrets were added in this step.
- **Still NOT in this step:** payments, notifications, Firebase,
  routine persistence, live widget data, and device/project
  testing of the auth path (typecheck + export only, here).

## RevenueCat payments (STEP 3, prepared, not connected)

Stack decision: **payments = RevenueCat** (DB = Supabase, analytics
and other services = Firebase — those are later steps, not this one).

- **What exists in code:** `src/revenuecat.ts` (the only place the
  app talks to RevenueCat), wiring in `App.tsx` (premium state,
  offerings, purchase/restore), and real UI in `Paywall.tsx`,
  `PaymentSetup.tsx`, and `SettingsLegal.tsx` (Premium card).
  The SDK is `react-native-purchases` ^11.0.0, installed via
  `expo install` (package-lock committed). No prices, product IDs,
  or keys are hardcoded anywhere — the only prices the UI ever
  shows are `priceString` values returned by RevenueCat for the
  current offering's packages.
- **Entitlement (one constant to correct):** premium status is
  checked against `PREMIUM_ENTITLEMENT_ID = 'premium'` at the top
  of `src/revenuecat.ts`. It MUST match the entitlement identifier
  created in the RevenueCat dashboard exactly; if the dashboard
  uses a different name, change that one constant and nothing else.
  The app never claims Premium unless that entitlement is active
  in a CustomerInfo returned by RevenueCat.
- **When NOT configured (today's default — no API key set):** the
  app keeps its exact preview behaviour. Paywall and PaymentSetup
  show plan names only with no prices, tapping a plan does nothing
  and unlocks nothing, Settings shows "RevenueCat not configured",
  and Restore in Settings is a preview note. Nothing is charged,
  nothing is unlocked, and nothing claims a purchase happened.
- **When configured:** App loads the current offering's packages
  and checks the premium entitlement on launch. Paywall lists
  those packages with their RevenueCat prices; tapping one buys
  it and reports success ONLY when the resulting CustomerInfo has
  the premium entitlement active. Restore calls RevenueCat
  restore and reports Premium only when the restored entitlement
  is active, otherwise "No active premium purchase found to
  restore." Any error — including a user-cancelled purchase —
  is shown as text, never as a success, and premium stays false.
- **Free-limit enforcement (real, when Premium is false):**
  creating a NEW habit while already at/over 5 habits, or a NEW
  routine while already at/over 1 routine, opens the Paywall and
  blocks the save — the form stays open behind the overlay, so
  no draft is lost. Editing an existing habit/routine is always
  allowed, and existing habits/routines stay fully accessible.
  Seed nuance, stated plainly: the demo seed already has 6 habits
  and 2 routines, so a free user hits the gate on any new habit
  or routine until Premium is active. That is the limit working
  as specified; trimming the seed to 5 habits / 1 routine is a
  separate product decision, not something this step silently
  changed. Routines are still static in this step (routine
  persistence is later), so the routine gate counts the static
  list.
- **Expo Go limit (important):** `react-native-purchases` is a
  native module and is NOT in Expo Go, so the SDK is loaded
  lazily (dynamic import) only on the configured path — the
  unconfigured app still runs in Expo Go exactly as before.
  The configured path (real offerings / purchase / restore)
  needs a development build, like the real home widget. If a
  configured build is run in Expo Go, RevenueCat calls fail
  with a truthful "development build required" error instead of
  a fake success or a fake premium state.
- **To connect (needs a real project + key from the user, via the
  secure flow only — never pasted into chat, code, or docs):**
  1. Create a RevenueCat project and link the Google Play app.
  2. In the RevenueCat dashboard, create products (monthly,
     yearly, lifetime) in Play Console, attach them to an
     offering, and create the `premium` entitlement (or correct
     `PREMIUM_ENTITLEMENT_ID` to match the dashboard name).
  3. Copy the Google Play public SDK key (Project Settings →
     API keys) into `EXPO_PUBLIC_REVENUECAT_API_KEY` (`.env`
     locally, EAS secrets for builds) and restart/rebuild —
     `EXPO_PUBLIC` variables are inlined at build time.
  4. Install a development build, open the Paywall, and confirm
     the real prices appear; purchase once in a test track and
     confirm Premium flips on, then Restore on a fresh install
     confirms it again.
- **Still NOT in this step:** notifications, Firebase, routine
  persistence, live widget data, and device/project testing of
  the configured purchase path (typecheck + export only, here —
  no real RevenueCat project exists yet, and no purchase has
  been made or restored in this VM).

## Notifications (STEP 4 — local scheduling only)

- Stack: `expo-notifications` (~58.1.7, SDK 58-compatible, via
  `expo install`). No config plugin was added — none is required for
  local notifications. No push server, no Firebase Cloud Messaging, no
  backend. FCM/push, if wanted, is a later Firebase step.
- What is scheduled, all local and daily, in `src/notifications.ts`
  (the only file that imports expo-notifications; App.tsx owns the
  effect, Settings only displays state):
  - One reminder per habit at that habit's reminder time, parsed
    from its data ("7:30 AM", "2:00 PM", etc. — unparsable times are
    skipped, never scheduled at a guessed time). Identifier
    `habit-<id>`. Current seed times: Drink water 7:30 AM, Morning
    run 6:30 AM, Meditate 7:00 AM, Walk 2:00 PM, Read 9:00 PM,
    Evening journal 9:30 PM.
  - One evening review at 9:00 PM (the time Settings already
    advertised). Identifier `evening-review`.
  - Rescheduling always cancels everything first, so toggling,
    loading, or saving a habit can never double-schedule.
- The Settings toggle is the single control, wired to real
  scheduling: OFF cancels all scheduled app notifications; ON
  schedules them (when permission is granted). It is not UI state
  alone. Changing the habit list (load/save) re-schedules while on
  and granted, so a new/edited habit gets its reminder.
- Permission, truthfully: launch only *reads* permission (never
  prompts on launch). Turning the toggle ON, or tapping "Allow
  notifications" in Settings, shows the system prompt once. If the
  result is not granted, NOTHING is scheduled and Settings shows
  the denied/undetermined state. When denied, the OS will not show
  the prompt again, so Settings offers "Open system settings"
  instead of re-prompting into a wall.
- Android: a `habit-reminders` channel is created before scheduling,
  as Android requires.
- Taps: a notification tap opens the app to Today (minimum deep
  link; the notification data carries habitId/kind for a later step).
- Expo Go note: local notifications schedule and fire in Expo Go,
  so toggle/permission/denied paths can be checked there — but the
  final device check (system prompt, delivery at the real reminder
  time, tap opens Today) still needs a phone and a dev build, and
  has NOT been done here. This step is typecheck/export-verified
  only, not device-tested.
- **Still NOT in this step:** Firebase (including FCM), live widget
  data, routine persistence, and device testing of delivery/taps.

## Firebase Analytics + Crashlytics (STEP 5, prepared, not connected)

Stack decision: **analytics and other services = Firebase**
(DB = Supabase, payments = RevenueCat — those are earlier steps).

- **Route (verified, not guessed):** `@react-native-firebase/app` +
  `@react-native-firebase/analytics` +
  `@react-native-firebase/crashlytics` v27.1.0, installed via
  `expo install` (package-lock committed). Its peer range is
  expo >= 47 and react-native >= 0.60, so it fits Expo SDK 58 /
  RN 0.88. The old `expo-firebase-analytics` package (latest 8.0.0)
  is NOT used — it is the deprecated pre-SDK-51 route.
- **What exists in code:** `src/firebase.ts` (the ONLY place the
  app talks to Firebase), wiring in `App.tsx` (probe on launch,
  event calls at the real moments), `UiState` fields
  (`firebaseConfigured`, `analyticsEnabled`, `toggleAnalytics`),
  and a Settings → Analytics card with a real opt-out switch.
  Crashlytics is installed on the same route: collection is
  toggled with the same opt-out, and two generic non-fatal
  identifiers (`supabase_load_failed`, `revenuecat_load_failed`)
  are recorded for genuine load failures — never raw SDK
  messages, emails, tokens, or user text. Native crashes in a
  dev build are reported automatically by the SDK once
  configured; no crash is ever faked.
- **Configured vs unconfigured — the key rule:** installing the
  npm packages does NOT configure Firebase. "Configured" means
  a runtime probe (`probeFirebase`) successfully loaded the
  native modules and got an Analytics instance to answer.
  Firebase Android configuration lives ONLY in
  `google-services.json`, a file supplied by the user from
  their Firebase console. It must NEVER be committed
  (`.gitignore` now excludes `google-services.json` and
  `google-services-*.json`) and must NEVER be pasted into
  chat, code, or docs. The `@react-native-firebase/*` config
  plugins are deliberately NOT in app.json yet: `expo install`
  added them automatically, and they were removed again in
  this step, because prebuild with those plugins but without
  `google-services.json` would fail — and this app must run
  fully without Firebase. When the file exists for a dev
  build, add `@react-native-firebase/app`,
  `@react-native-firebase/analytics`, and
  `@react-native-firebase/crashlytics` back to app.json
  plugins and rebuild.
- **When NOT configured (today's default, including all of
  Expo Go):** the native modules are never touched (lazy
  dynamic import, same pattern as RevenueCat), no events are
  sent, no fake events are queued, no invented user IDs are
  set, and the app runs exactly as before. Settings says
  "Firebase not configured — no events are sent" truthfully.
- **When configured:** only these real events are logged, and
  only when the user has not opted out:
  - `app_open` — once per launch, no parameters
  - `habit_completed` — habit id + slot only (never the habit
    name or target)
  - `habit_created` — slot only (new habits only, never the name)
  - `routine_started` / `routine_completed` — routine id +
    step count only
  - `paywall_shown` — no parameters
  - `purchase_completed` — no parameters (no price, no product id)
  A failed log is dropped silently — analytics must never
  break habits, and a failure is never retried into a fake event.
- **Opt-out (real):** Settings → Analytics switch, persisted
  in AsyncStorage (`@smarthabit:analytics_opt_out`). Default
  is ON, but logging is effective ONLY when configured AND
  opted in ("default on only when configured"). Turning it
  off stops all future logging and disables Crashlytics
  collection immediately; it works even before Firebase is
  connected, so a preference set early is honoured later.
  Turning it off does not delete events already sent
  (Firebase Analytics has no per-device client-side delete).
- **To connect (needs a real Firebase project + file from the
  user, via the secure flow only — never pasted anywhere):**
  1. Create a Firebase project and an Android app with
     package `com.smarthabit.planner.ui`.
  2. Download `google-services.json` from the Firebase console
     and place it at the project root (do NOT commit it).
  3. Add the three `@react-native-firebase/*` plugins back to
     app.json plugins (see above) and install a development
     build — Firebase does not work in Expo Go.
  4. Open Settings → Analytics and confirm it reports
     configured; then complete one habit and confirm the
     event appears in the Firebase console (DebugView /
     Analytics). Until step 4 passes, treat Firebase as
     unconfigured, however the packages look.
- **Still NOT in this step:** FCM push (noted here as a
  future Firebase option only — notifications remain local
  scheduling from STEP 4), live widget data, routine
  persistence, and device/project testing of the configured
  Analytics path (typecheck + export only, here — no real
  Firebase project exists yet, and no event has been sent
  from this VM).

## Live home widget data (STEP 6, wired, not device-tested)

- **What exists in code:** `src/widgetData.ts` (pure week/snapshot
  logic, no React Native, no Supabase, no widget runtime),
  expanded snapshot props in `src/widgets/HabitWidget.tsx`,
  wiring in `App.tsx`, and `ui.widgetWeek` in
  `src/navigation.ts`. Layout, colours, and contrast are
  unchanged: week at the top (circles first, Mon–Sun labels
  below, no legend), then "Habit completed today" with count,
  % and progress bar.
- **How it updates:** App sends a snapshot to the placed widget
  via `HabitWidget.updateSnapshot(...)` (expo-widgets SDK 58)
  whenever today's completion state, the habit list, or the
  week changes — app launch, every habit toggle (optimistic,
  then reverted if a Supabase write fails), every HabitForm
  save, sign-in load, and sign-out reset. The widget file is
  imported lazily and the call is try/catch-guarded, so in
  Expo Go (no native widget module, no placed widget) it is a
  silent no-op and never crashes the app. No reinstall is
  needed for a placed widget to update — on a dev build.
- **Week status rule (from real data only, never invented):**
  the week is Monday-first in local dates. A future day is
  'future', today is always 'today' (amber, in-progress), a
  past day is 'done' if ANY habit has a 'done' completion
  that day, otherwise 'missed' (grey). A day with only 'skip'
  records renders as 'missed' in the widget — the widget has
  no skip colour, and no habit was completed that day; skip
  still neither counts nor breaks the streak (see
  `src/streak.ts`). No streak number and no steps count are
  ever invented for the widget.
- **Real vs static mode:** `widgetWeek.source` is 'real' only
  after a Supabase load for a signed-in user; otherwise it is
  'static' — the long-standing fallback week (Mon–Wed done,
  Thu today, Fri–Sun future, Thursday highlighted). In static
  mode the count/%/done-names in the snapshot still update
  with session toggles, but the week stays static until real
  history exists. WidgetPreview renders exactly
  `ui.widgetWeek` (same week, today index, count, %, done
  names) — the preview and the placed widget can never show
  different weeks — and its Done line no longer carries the
  old free-tier suffix, so it mirrors the real widget exactly.
  The widget still will NOT appear in Expo Go (dev build
  required), and that wording is kept truthfully in
  WidgetPreview and here.
- **Still NOT in this step:** routine persistence, and
  device testing of the live snapshot path (typecheck +
  export + prebuild only here — no device, and the placed
  widget updating on a phone still needs a dev-build check:
  place the widget, tick a habit in the app, and confirm the
  widget's count and week change without reinstalling).

## Real Routine Run Mode + Real Weekly Report (STEP 7, wired, not device-tested)

- **Routines persistence:** `supabase/schema.sql` gains `routines`
  (id, user_id, name, start_time, habit_ids JSON array in run
  order, RLS scoped to `auth.uid()` like habits) and
  `suggestion_states` (user_id + suggestion_id primary key,
  state applied|dismissed, same RLS). Routines never existed in
  Supabase before this step, so there is nothing to claim or
  migrate: on first sign-in the app seeds the demo routines
  for that user if the user has none, and it never deletes
  existing routines on any path. `src/supabase.ts` adds
  `loadRoutineRows` / `upsertRoutine` / `ensureUserRoutines`
  and `loadSuggestionStates` / `setSuggestionState`.
  RoutineForm Create/Edit saves to Supabase when configured +
  signed in, otherwise it updates the local list for this
  session only — and says which one it is doing. Habit
  selection in the form is real now: tap habits to add/remove
  them, in tap order, instead of a static first-3 list.
  The free-limit gate counts the real routine list
  (`ui.routines`), not the old static list.
- **Run Mode real, per routine (fixes a real bug):** run
  progress used to live in one global `runStep` in App state,
  so two routines shared a step counter. It is now
  `runSteps: Record<routineId, number>` — opening routine B
  while routine A is mid-run starts B at step 0 and returning
  to A resumes it. "Mark step done → Next" marks that habit
  done for today through the SAME `toggleDone` path as Today
  (so streaks, the live widget snapshot, and notification
  state all update consistently — it never undoes a habit
  that is already done today, it just advances), and the
  finished screen shows a real summary: steps done today /
  total, with the done habit names. Routine percents in the
  list and detail screens are computed from today's done
  set, not from a stored/static percent.
- **Weekly Report real, when history exists:** totals, best
  day, lowest habit, and best streak are computed from
  `ui.completionHistory` (the Supabase rows for a signed-in
  user) for the Mon–Sun week containing today (local dates).
  Best day is the day with the most done completions; lowest
  habit is the habit with the fewest done completions that
  week (shown as a count, never an invented %). When
  unconfigured/unsigned-in, the old hardcoded values are
  shown WITH a clear "(static preview)" label — never
  presented as measured.
- **Apply/Dismiss real:** Apply parses the suggestion title
  narrowly and actually changes the habit — "Move … to the
  morning/afternoon/evening" changes its slot, "Lower …
  target to X" changes its target, "Keep … as it is" changes
  nothing (there is nothing to change); any other kind only
  marks its state, never claims a change it did not make.
  The habit change is persisted via `upsertHabit` + reload
  when configured + signed in, otherwise it updates the
  local list for the session. Dismiss hides the suggestion
  and persists its state row when configured + signed in,
  otherwise session-only. A configured write failure reverts
  the state (and any habit change) and surfaces the error in
  Settings instead of a fake "Applied".
- **Still NOT in this step:** production hardening (now STEP 8
  below), and device/project testing of the configured
  routine/report paths (typecheck + export only here — no
  device, no real Supabase project, so the reload-persists
  check for routines and suggestion states still needs a
  phone once keys exist).

## Production hardening (STEP 8, version 1.0.2, typecheck/export/prebuild only — not device-tested)

- **QA fix M1 — hardcoded Thursday removed:** the week strip on
  Today, the WidgetPreview week, and the widget week are all
  computed from the REAL local date (Monday-first week
  containing today, today highlighted) via `src/widgetData.ts`
  helpers (`mondayOfWeek`, `todayIndexInWeek`, `computeWeekStatus`,
  `staticFallbackWeek`). The old hardcoded `WEEK_DATES`
  (Oct 27 – Nov 2) and `STATIC_TODAY_INDEX = 3` are gone from
  on-screen code: `WEEK_DATES` was removed from `src/data.ts`,
  and the widget component's own incomplete-snapshot fallback
  now computes from `new Date()` inside the widget body (the
  widget bundler serializes only the function body, so no import
  is possible there). The single remaining hardcoded Thursday
  is the `createWidget` initialProps object, which is a
  compile-time constant by API design and cannot call date
  helpers — it is shown only before the app ever sends a
  snapshot (which happens on launch) and is documented as such
  in `src/widgets/HabitWidget.tsx`. `STATIC_WEEK_STATUS` /
  `STATIC_TODAY_INDEX` in `src/widgetData.ts` survive only as
  that same documented LEGACY fallback. The static fallback
  week used when unconfigured/unsigned-in (`staticFallbackWeek`)
  is still a fallback — its statuses are not real history —
  but its today circle/index are the real local date: past
  days show 'done', today shows 'today', future days show
  'future'. There is no hardcoded Thursday anywhere on screen.
- **QA fix M2 — streak stale after toggle removed:** `toggleDone`
  in `App.tsx` recomputes streaks and best streaks from the
  updated completion set immediately. In configured mode it
  keeps the history map (`completionsByHabit`) and schedules
  (`schedulesByHabit`) behind the streak maps and recomputes
  with `src/streak.ts` for every habit on every toggle, and
  re-aggregates today's widget day totals the same way; a
  failed Supabase write reloads the truth from Supabase and
  only falls back to the captured pre-toggle state if that
  reload itself fails (this also fixes QA minor m2, the stale
  captured-set revert). In session/static mode, where streaks
  are seed display values rather than computed history, a
  toggle adjusts the streak by +/-1 (floor 0, best only rises).
  HabitForm save already reloaded; it now also tolerates a
  reload failure after a successful write (the habit IS saved,
  the error surfaces in Settings instead of reporting the
  save as failed) — same rule for routine saves.
- **QA fix M3 — empty/unknown-habit crash risk removed:**
  `habitById` and `routineById` return `undefined` when not
  found — never `habits[0]!` / `routines[0]!` on an empty list.
  HabitDetail and HabitForm (edit of a missing habit) render
  an explicit "Habit not found" state; RoutineDetail renders
  "Routine not found"; Today shows "No habits yet — add your
  first habit below." instead of "All habits done 🎉" when the
  list is empty (QA minor m1, same fix); Habits Grid shows a
  "No habits yet" card with an Add habit button. Routine Run
  Mode stays per-routine (`runSteps: Record<routineId, number>`,
  verified, not regressed); the empty-steps `finished` guard
  (`steps.length > 0 && …`) is unchanged.
- **QA fix M4 — Progress totals labelled:** the Weekly Report
  already labels its unconfigured values "(static preview)".
  The Progress screen's hardcoded Habit Score (86%) and week
  bars are now also explicitly labelled "Static preview —
  … not yet computed from real history" (they are still
  hardcoded, not computed — the label is the fix, not a new
  calculation).
- **Real privacy policy + terms:** the placeholder Legal text
  is replaced by real policy/terms in
  `src/screens/SettingsLegal.tsx` (`PRIVACY_BODY`,
  `TERMS_BODY`), written for how the app actually works:
  Supabase account data when configured + signed in; RevenueCat
  / Google Play handle payments (no card details ever seen or
  stored); Firebase Analytics only when configured AND not
  opted out, only the anonymous events listed in Settings →
  Analytics, with the opt-out's real effect stated; local
  notifications and the home widget stay on-device with no
  separate collection; no sale of data, no advertising sharing;
  in-app Delete honestly stated as currently doing nothing,
  with deletion requests going via the contact address.
  The contact address is a clearly marked placeholder —
  `[CONTACT EMAIL TO BE FILLED BY THE OWNER]` — never an
  invented email. **Still blocked for Play:** the owner must
  (1) replace that placeholder with a real contact email in
  both the in-app text and this README note, and (2) host this
  policy at a real URL (owner-supplied hosting, not invented
  here) for the Play listing. Until both are done, the app is
  not ready for a Play release, however clean the code is.
- **Version 1.0.2 everywhere:** `app.json`, `package.json`,
  Splash, and the Settings build note all say 1.0.2. The build
  notes list what 1.0.2 contains: Supabase, Auth, RevenueCat,
  Notifications, Firebase, live widget, real routines/reports,
  QA fixes.
- **Error handling pass:** every configured-path failure already
  fell back to static/session data with its error in Settings,
  except the save-then-reload gap fixed above (saveHabit /
  saveRoutine). RevenueCat and Firebase load failures already
  surface in Settings (`revenueCatError`, Analytics card) with
  the app running as if unconfigured; Supabase load failures
  already fall back to the static list with `supabaseError` in
  Settings. No screen crashes on a failed load — the only
  crash risks found (M3) are fixed above. No new features, no
  tour, widget-layout, theme, or contrast changes in this step.
- **Still blocked (unchanged by this step):** real Supabase /
  RevenueCat / Firebase projects + keys, a device test of every
  configured path, the hosted privacy policy URL + real contact
  email above, and the Play Console listing + closed test. All
  STEP 8 paths are typecheck/export/prebuild-verified only.

## Today layout (2026-10-30) — week top, no ring, next + completed card

- Order on Today: header + greeting → free-tier pill → **week strip
  (Mon–Sun, right below the free-tier pill)** → next/completed card →
  tour intro card → habit slots. The big ring is **removed** from Today
  (the shared `Ring` component in ui.tsx is still present but unused).
- New card after the week strip: **left = Next habit** (first undone
  habit in slot order morning → afternoon → evening; at session start
  that is Meditate, 10 min · 7:00 AM — water, run and walk are already
  done; checking a habit off moves "next" on, all done shows
  "All habits done 🎉"), **right = Habit completed today** ("3 of 6",
  50%), with a count/total progress bar below the row.
- Tour updated to match: step 1 retargeted from the removed ring to the
  right side of the new card (`today-completed`), and the intro card
  text now says "completed-today card" instead of "ring".

## Review fix v1.0.1 (2026-10-30) — why the previous tour/widget fixes did not replicate on device

- **Root cause found on review:** the previous tour fix converted window
  rects by subtracting live insets and rendered the overlay as a direct
  child of SafeAreaView. That is still ambiguous on Android: an absolute
  child of SafeAreaView is positioned relative to SafeAreaView's own box,
  whose origin is not guaranteed to equal the safe-area content origin on
  every device — so the frame could land shifted again, in either
  direction, even though the code looked correct. The widget side had the
  same replication problem in a different form: a GitHub push does not
  update a running Expo Go session or an installed build, and the app had
  no visible version, so there was no way to tell on-device whether the
  new code was even running.
- **Tour fix (root-relative):** the overlay now lives INSIDE the root
  `<View flex:1>` (inside SafeAreaView, so it still cannot go under a
  system bar), and every target rect is converted by subtracting the
  root view's own measured window rect at the same moment — measured,
  never assumed from insets (inset conversion kept only as a fallback).
  SafeAreaView is still used (provider + edges top/left/right/bottom);
  frames/bubbles are clamped to the root size.
- **Replication proof (new):** version bumped to **1.0.1**, shown on the
  Splash screen and in Settings ("If this line does not say v1.0.1, you
  are running an older build"). Widget picker description updated to
  "Week at the top, then Habit completed today." To verify on device:
  check v1.0.1 first, then tour steps 2/3/4, then Settings → Home widget
  preview. If v1.0.1 is not shown, reload from the new code
  (`npm start --clear` in Expo Go, or a fresh dev build for the real
  home widget) — the fix cannot replicate on a stale bundle.
- **Verified:** `tsc` 0, Android export passed, prebuild still generates
  `HabitWidgetProvider` with the new widget description, generated
  `android/` deleted. Not device-tested here.

## App icon and splash screen (2026-10-30)

- **App icon:** `assets/icon.png` (1024×1024 PNG) — glowing
  emerald leaf inside a progress ring on dark forest green,
  Verdant Nightfall style, no text so it reads at small sizes.
  Wired in app.json as `icon`, and as the Android adaptive
  icon foreground in `assets/adaptive-icon.png` (same artwork,
  centred with padding so launcher cropping keeps the ring
  intact) over background `#0A1211`.
- **Splash screen:** `assets/splash.png` (1152×2048 PNG) —
  same leaf + ring, "Smart Habit" and "Small habits, every
  day". Wired in app.json as `splash` (contain, background
  `#0A1211`) and via the `expo-splash-screen` ~58.0.12 config
  plugin with the same image/background (the plugin entry
  must be the only `expo-splash-screen` entry — a duplicate
  bare entry wins as run-once and resets the background to
  white; verified: prebuild now generates
  `splashscreen_background #0A1211` and
  `splashscreen_logo.png`).
- **Shows every launch:** the native splash shows on every
  cold launch while the JS bundle loads, then the in-app
  Splash route (the app's initial route) follows — so a
  splash is seen every time, not just on first install.
- **Verified:** prebuild generated the launcher icon
  (`ic_launcher*.webp`) and splash drawables, then the
  generated `android/` was deleted; `tsc` 0. Not
  device-tested, not pushed.
- **Push warning:** PNG files cannot be pushed reliably
  through the GitHub MCP push tools (they reject/corrupt
  binary files) — when this version is pushed, the PNGs in
  `assets/` need the GitHub website upload route or a local
  `git` push, with size/hash verification afterwards.

## New in this update (2026-10-30) — widget, payment setup, free-tier days

- **Today layout change (2026-10-30, user feedback):** the
  Dashboard Widget card was REMOVED from Today — Today is now
  just greeting + compact free-tier pill + ring + week strip +
  habit rows. The real Android home widget below is untouched.
  The free-tier pill sits directly under "Keep going, you're
  doing great!" and is one compact line, not a card.
- **Widget Preview screen (`widgetPreview`, tabs hidden):** shows
  the real widget's new layout inside a home-screen-style frame
  — week at the top (Mon–Sun circles), then "Habit completed
  today" (count, %, progress bar, done habits) — with a clear
  note: "Home widget preview — a real Android home widget needs
  a development build, it does NOT work in Expo Go." Reached
  from Settings → Home widget preview (no longer from Today).
- **Real Android home widget: SHIPPED IN CODE (needs a
  development build to appear on a phone).** `expo-widgets`
  ~58.0.25 and `@expo/ui` ~58.0.25 are installed, the widget is
  `src/widgets/HabitWidget.tsx` (registered with `createWidget`
  as `HabitWidget`, `'widget'` directive, Jetpack Compose
  components only), and app.json carries the expo-widgets
  config plugin with `enableAndroid: true`, display name
  "Smart Habit", 4×4 cells, resizable both ways, and
  `android.initialLayout` pointing at the widget file. Layout
  (redesigned 2026-10-30, reference-widget inspired, not
  copied): week at the top — Mon–Sun row with a coloured
  circle per day (green = done, amber = today, light
  grey-green = missed, mid-tonal = coming up) — then below
  it "Habit completed today": 3 of 6 · 50%, with a progress
  bar and the done habits listed. No steps counter (this app
  tracks habits, not system steps) and no streak line (dropped
  to keep week + completed-today clean in 4×4). The widget
  data is now LIVE via snapshot (STEP 6): the isolated widget
  runtime still cannot read app state directly, so App sends
  it fresh snapshot props via `updateSnapshot` on launch,
  toggle, save, sign-in, and sign-out — before the app ever
  sends one, the widget shows its initial static props
  (3 of 6, Mon–Wed done week) as a fallback. The app package
  stays `com.smarthabit.planner.ui` as already set in app.json.
- **Payment setup after auth, with Skip (`paymentSetup`):**
  Login Continue and Signup Continue (email and Google buttons)
  now go to Payment Setup FIRST, instead of directly to Today.
  It shows "Set up payment (optional)", plan cards by name only
  — Monthly, Yearly, Lifetime — with NO prices, a note
  "UI preview — no payment is taken", a prominent Skip button,
  and a Continue button that goes to Today for demo only
  (charges nothing, unlocks nothing). Settings also has a
  "Payment setup" entry that reopens it. The Paywall overlay is
  unchanged (plan names only, no prices).
- **Free-tier days on the dashboard:** Today shows a compact
  free-tier pill under the greeting: "Free tier • 12 days left
  • 5 habits, 1 routine", from `FREE_TIER_DAYS_LEFT = 12` in
  `src/data.ts` — a clearly labelled static demo value. No real
  trial start/end date, subscription, or account is implied.
  The same 12-days line appears on Payment Setup so the two
  stay consistent.

## Tooltip-guided tour (2026-10-30) — anchored + auto-show for new users

A hand-rolled tooltip tour, no external tooltip library. The
tour is now ANCHORED to the actual element it explains, not a
bottom-only bubble: `src/components/Tooltip.tsx` renders a
spotlight — four dim panels around the target (the target area
itself stays uncovered, so you can still tap the highlighted
element), an emerald frame around it, and a tooltip bubble on
the opposite half of the screen with a ▲/▼ arrow pointing at
the target's centre. Bubble controls are unchanged: title,
1–2 short lines, step dots "Step X of 14", Back / Skip /
Next / Done, close X, and a "Go to …" button where a step
has a destination. The overlay lives in `App.tsx` INSIDE
SafeAreaView (inside SafeAreaProvider) — see "Safe-area fix"
below for why the old outside-SafeAreaView placement was
wrong on real Android devices. Next/Back only
move the bubble (never push a route), "Go to …" navigates
once (guarded), Android back closes the tour before popping
the stack, and Skip/X dismiss at any step.

How targets are measured: each screen registers a measurer
for its targets via `ui.registerTourTarget(key, tourMeasure(ref))`
(ref + `measureInWindow`, `collapsable={false}` on every target
wrapper AND Pressable, so Android cannot flatten a target into
its parent and return the parent's rect). App converts every
measured window rect to safe-area coordinates (subtracting
live insets) and re-measures on step/route change, on inset
change, and on `ui.requestTourRemeasure()` — with attempts at
0/150/400ms, keeping the last valid rect — instead of a single
350ms timeout. If a target is not mounted, zero-size, or fully
outside the safe area, that step falls back to the old bottom
bubble with an amber note telling the user to use "Go to …"
and step back to see it highlighted. It never crashes and
never points at nothing.

Safe-area fix (2026-10-30, from real-device screenshots):
the old overlay lived OUTSIDE SafeAreaView while its targets
lived inside it, so every frame was shifted up by the top
inset: step 3's frame sat on the status bar instead of the ?
button, step 2's frame sat on the greeting instead of the
free-tier pill, and step 4's frame was measured mid-scroll so
it wrapped the Morning header and cut the row's subtitle.
Fix: overlay inside SafeAreaView, window rects converted
with live `useSafeAreaInsets()` (no hard-coded status-bar
height — insets differ per Android device, notch, and nav
bar), every frame/bubble clamped to the safe-area bounds,
Today's habit steps scroll to a position computed from
onLayout (slot top + row top − 80px, not a hard-coded 480px)
and re-measure only after the scroll settles
(onMomentumScrollEnd / onScrollEndDrag, with a 700ms
fallback), and the tooltip bubble is scrollable inside a
max-height box so long text cannot overflow a small screen.
No screen content was moved under a system bar by this
change: SafeAreaView edges are still top/left/right/bottom
for the whole app, and the tab bar stays inside it.

Auto-show for NEW users: the first time the app reaches the
Today screen in a session (Splash → Today directly, or
Splash → Welcome → Goal → Starter → Today), the tour
starts automatically at step 1. The flag lives in App.tsx
as `tourAutoShown` (a ref, session-only): dismissing or
skipping sets tourActive false but leaves the flag true, so
returning to Today later in the same session never restarts
it. Reload resets the flag (no AsyncStorage/SQLite in this
UI build — nothing is persisted). The final tour step says
this in-app too.

How to replay / dismiss it (manual replay always works):
- Today: tap the **?** button at the top right, or the
  "Start guided tour" button on the intro card (the old
  one-line "Tour: tap a row…" card was replaced by this —
  there is only one tour now; "Not now" dismisses the card
  for the session).
- Settings → **How to use this app — guided tour**
- Settings → Help → **Start guided tour**

Anchored target → element mapping (step → target → screen):
1. Completed-today card (right side) → `today-completed` → Today,
   right side of the next/completed card (the ring was removed
   from Today; the old `today-ring` target no longer exists)
2. Free tier pill → `today-free-tier` → Today, pill wrapper
3. Help ? button → `today-help` → Today, ? Pressable
4. First habit row → `today-first-habit` → Today, first
   (Drink water) row Pressable; Today auto-scrolls to the row's
   measured layout (slot top + row top, layout-derived, never
   a hard-coded pixel value) before measuring so the row is in view
5. First ✓ button → `today-first-check` → Today, same row's
   check Pressable
6. + button → `tab-plus` → App tab bar, central + Pressable
7. Bottom tabs → `tab-today` → App tab bar, Today tab
8. First routine → `routines-first` → Routines, first card
9. Habit Score → `progress-score` → Progress, score card
10. First suggestion → `report-first` → Weekly Report,
    first suggestion card
11. First grid card → `grid-first` → Habits Grid, first card
12. Skip button → `payment-skip` → Payment Setup, Skip
    Pressable
13. Tour row → `settings-tour` → Settings, "How to use
    this app" row wrapper
14. You're ready → no target → bottom bubble (by design)

Tour steps (each 2 short sentences max, no prices, no real
accounts or data invented) follow the mapping above in
order, each with its "Go to …" destination where one exists.
Steps whose target screen is not currently open (e.g. the
Routines step while still on Today) show the fallback bottom
bubble until the user taps "Go to …" and steps back to them
— that is the documented fallback, not a bug.

## Theme — Verdant Nightfall

Deep dark green/black forest-night background, glowing emerald
accents, softly rounded cards with a subtle glow on the progress
ring / primary button / selected day only, large calm numerals,
flat surfaces otherwise, no gradients. Starting tokens from
Design.md: bg `#0A1211`, surface `#0D1917`, surfaceAlt `#0F1E1B`,
tonal `#12312C`, ink `#E9F5F1`, muted `#A7C2BB`, border `#1B2F2B`,
primary `#2DD4BF`, onPrimary `#06201C`, accent `#34D399`,
error `#F43F5E`, amber `#FBBF24`. SafeArea everywhere, 48dp
minimum touch targets, layouts designed for 360px width and up.

## How to run

Prerequisites: Node.js (this VM: v24.22.1), npm, and Expo Go
matching SDK 58, or an Android emulator.

```sh
npm install
npm start
```

Then press `a` for Android, or scan the QR code with Expo Go.
Scripts: `npm start`, `npm run android`, `npm run typecheck`
(`tsc --noEmit`).

Navigation is a typed custom stack (`src/navigation.ts`: a Route
union + Nav prop), NOT Expo Router.

## Screens — all 18 routes, all reachable

1. **Splash** — leaf, Smart Habit, tagline, Continue fallback.
   Returning: Continue → Today. Fresh: Start onboarding → Welcome.
   Also links to Log in (UI preview).
2. **Onboarding Welcome** — intro cards → Goal.
3. **Goal + Wake Time** — Fitness / Study / Health / Productivity /
   Better Mornings + wake time → Starter.
4. **Starter Habits** — pickable starter habits → Today (or Skip).
5. **Today (tab)** — progress ring (3 of 5 at start), week date
   strip, Morning / Afternoon / Evening groups, habit rows with
   streaks. Tap row → Habit Detail, tap ✓ → toggle in session
   state. Buttons → Habits Grid and Weekly Report.
6. **Habit Detail** — streak grid/heatmap, stats, weekly totals,
   Mark done / Undo, Edit habit.
7. **Add / Edit Habit form** — name, target, reminder, time slot
   with range labels, icon preview. Save → Today (no persistence).
8. **Routines (tab)** — list with % bars → Routine Detail,
   Create routine button.
9. **Routine Detail + Run Mode** — step-by-step run, Next /
   Restart, full step list.
10. **Create / Edit Routine form** — name, start time, ordered
    habits. Save → Routines (no persistence).
11. **Progress (tab)** — This Week / This Month toggle, Habit
    Score, week bars, per-habit rates + heatmaps, → Habits Grid
    and Weekly Report.
12. **Weekly Report** — totals, best day/streak, lowest habit,
    suggestions with Apply / Dismiss (session state only, shows
    "Applied" / "Dismissed").
13. **Paywall (overlay)** — from Settings → Upgrade, and from the
    Habit Form. Plan names only, no prices, close returns to the
    current screen.
14. **Settings (tab)** — Account (Not signed in → Log in),
    notifications toggle, evening review, Help / Terms / Privacy,
    Upgrade, Delete my data (UI only).
15. **Habits Grid** — from Today and Progress. One card per habit
    with heatmap, tap card → Habit Detail. Tabs hidden.
16. **Login** — email + password (show/hide), Continue with
    Google button, Forgot password, Sign up links. UI preview
    note on screen; Continue → Payment Setup (skippable) for
    demo only.
17. **Signup** — same fields and Google button, UI preview note,
    Continue → Payment Setup (skippable) for demo only.
18. **Forgot Password** — email field, then a "Check your email
    (preview state)" state. No email is actually sent.
19. **Widget Preview** — from Settings → Home widget preview.
    Home-screen-style frame with the real widget's layout:
    week at the top, then Habit completed today. Tabs hidden.
    Real-widget limitation is stated on screen.
20. **Payment Setup** — from Login/Signup Continue, and from
    Settings → Payment setup. Optional, skippable, plan names
    only, no prices, no payment taken. Skip and Continue both
    go to Today for demo only.

Legal sub-screens (Terms / Privacy / Help) are reached from
Settings and are part of screen 14's flow.

Bottom tabs (on tab screens only): Today, Routines, Progress,
Settings, with a central + button opening an action sheet
(Add habit / Create routine). Detail, form, report, and grid
screens hide the tabs. Android back order: action sheet →
paywall overlay → stack pop → exit only at a root tab screen.

## Widget redesign (2026-10-30) — week at top, Habit completed today, contrast rule

- New real-widget layout in `src/widgets/HabitWidget.tsx`:
  week (Mon–Sun circles) at the top, then "Habit completed
  today" (3 of 6 · 50%, progress bar, done habits) below it.
  No steps counter, no streak line (dropped for a clean 4×4).
  Widget Preview (`widgetPreview`) now mirrors this exact
  layout, so it can be reviewed in Expo Go.
- CONTRAST RULE applied: nothing on a dark background may
  be the same/nearly the same colour as that background.
  Widget background changed #0D1917 → tonal #12312C;
  missed cells #1B2F2B/#0F1E1B → light grey-green #8A9E98;
  future cells → mid-tonal #334F49; progress track
  #1B2F2B → #334F49. In `src/data.ts`, `heatColor` and
  `last7Color` missed/faint changed the same way
  (#0F1E1B → #8A9E98, #1B2F2B → #334F49), which also fixes
  heatmaps and the old grid. On Today, the ? button,
  free-tier pill, unselected week-strip pills, and habit rows
  changed background #0D1917 (surface) → #12312C (tonal),
  and the unchecked ✓ button changed #0F1E1B (surfaceAlt) →
  #0D1917 (surface) so it stands out from its tonal row.
  Widget Preview's phone frame changed #04100D → tonal
  #12312C with a primary border, so the frame itself is
  visible on the dark app background.
- Verification (this redesign): `tsc` 0; Android export
  passed, 641 modules, 1.7 MB bundle, `dist/` 1,654,013
  bytes, deleted afterwards; Android prebuild passed and
  still generated `HabitWidgetProvider`, `habit_widget_info`
  (4×4), and `expo_widgets.xml`; generated `android/` and
  `dist/` deleted and verified absent. Not device-tested;
  the real widget still needs a dev build to appear in the
  home widget picker.

## Real Android home widget — how to get it on your phone

Expo Go CANNOT show this widget. You need a development build
of this exact code on your Android phone:

```sh
npm install
npx expo prebuild --platform android
# then build + install the generated Android app, e.g.:
npx expo run:android
# — or — upload to EAS:
# eas build --profile development --platform android
```

Then on the phone: long-press the home screen → Widgets →
find **Smart Habit** → drag it onto the home screen (it is a
4×4 widget, resizable). Tapping the widget opens the app.
If the widget does not appear in the picker, the installed
build is not a development build of this code (e.g. it is
Expo Go, or an older build from before the widget was added)
— rebuild from this folder and reinstall.

Prebuild proof (verified 2026-10-30, then the generated
`android/` folder was deleted so the project stays a clean
managed Expo project): `AndroidManifest.xml` contains a
`.HabitWidgetProvider` receiver with `APPWIDGET_UPDATE`,
`res/xml/habit_widget_info.xml` is 4×4 / resizable /
home_screen, `res/values/expo_widgets.xml` names it
"Smart Habit", and `HabitWidgetProvider.kt` registers
`ExpoWidgetsAppWidgetProvider("HabitWidget")`. The widget has
NOT been tested on a real device from this VM — on-device
rendering is untested until you install a dev build.

## Verification (2026-10-30, anchored tooltip tour + auto-show)

- `npx tsc --noEmit`: 0 errors (after fixing RN 0.88 / React
  19 ref typing: refs are `useRef<any>(null)` — `useRef<View>`
  resolves to the component type, not the instance, in this
  stack).
- `npx expo export --platform android`: passed, bundle
  1.7 MB, `dist/` total 1,654,546 bytes. `dist/` was deleted
  afterwards and verified absent.
- Route walk: all 20 stack cases in `App.tsx` still present
  (splash, welcome, goal, starter, today, habitDetail,
  habitForm, routines, routineDetail, routineForm, progress,
  weeklyReport, settings, habitsGrid, login, signup, forgot,
  widgetPreview, paymentSetup, legal), plus the Paywall
  overlay and the tour overlay (not a stack route, now
  rendered INSIDE SafeAreaView in safe-area coordinates —
  see Safe-area fix above; the old outside-SafeAreaView
  placement is what shifted frames on real devices).
  Tour entry points still work: Today ? button, Today intro
  card, Settings → guided tour, Help → Start guided tour.
  Auto-show is in code in App.tsx (`tourAutoShown` ref +
  effect on first `route.name === 'today'`); manual replay
  is unaffected.
- No device testing was done. On-device measurement
  (measureInWindow, scroll-to-row, bubble placement on small
  screens) is untested — the fallback bottom bubble covers
  any target that fails to measure.
- No code was pushed to GitHub. Not a production app.

## Verification (2026-10-30, Safe-area fix for the tour)

- `npx tsc --noEmit`: 0 errors.
- `npx expo export --platform android`: passed, bundle
  1.7 MB, `dist/` total 1,657,101 bytes. `dist/` was deleted
  afterwards and verified absent; no `android/` folder left.
- All 20 stack routes, the 14 tour steps, auto-show, and
  manual replay (Today ?, intro card, Settings, Help) are
  unchanged in behaviour — only the overlay coordinate
  system, measurement timing, and Today's scroll changed.
- NOT device-tested from this VM (no Android device here):
  the user must re-check steps 2, 3, and 4 on his phone,
  on any other Android device sizes, before this is called
  fixed on-device. No code was pushed to GitHub.

## Verification (2026-10-30, real Android widget)

- `npx tsc --noEmit`: 0 errors (widget file included).
- `npx expo prebuild --platform android`: passed. Evidence
  found in the generated project (see "Real Android home
  widget" above for the exact files). Generated `android/`
  was deleted afterwards and verified absent.
- `npx expo export --platform android`: passed, 641 modules,
  bundle 1.6 MB, `dist/` total 1,639,237 bytes. `dist/` was
  deleted afterwards and verified absent. (Module count is
  unchanged because the widget file is not imported by the
  main app bundle — it is bundled separately for the widget
  runtime.)
- Route walk: all 20 stack cases in `App.tsx` still present,
  including `widgetPreview` and `paymentSetup`; no routes
  broke. Widget Preview screen note updated to say the real
  widget is now in the code and needs a dev build.
- No device testing was done. On-device widget rendering is
  untested.
- No code was pushed to GitHub. Not a production app.

## Verification (2026-10-30, widget / payment / free-tier update)

- `npx tsc --noEmit`: 0 errors.
- `npx expo export --platform android`: passed, 641 modules,
  bundle 1.6 MB, `dist/` total 1,638,827 bytes. `dist/` was
  deleted afterwards and verified absent.
- Route walk: previous 18 items still present, plus
  `widgetPreview` (from Today widget card) and `paymentSetup`
  (from Login/Signup Continue and Settings). All routes in
  `src/navigation.ts` have a matching case in `App.tsx`.
- No device testing was done. On-device behaviour is untested.
- At that time the real expo-widgets widget was NOT shipped
  (see above) — this is now superseded by the real Android
  widget section above. No code was pushed to GitHub. Not a
  production app.

## Verification (2026-10-30, builder run)

- `npm install`: passed, 473 packages added, Node v24.22.1.
- `npx tsc --noEmit`: 0 errors (after fixing one import: Suggestion
  is exported from `src/theme.ts`, not `src/navigation.ts`).
- `npx expo export --platform android`: passed, 638 modules,
  bundle `AppEntry-*.hbc` 1.6 MB (1,626,364 bytes), `dist/` total
  1,626,517 bytes. `dist/` was deleted afterwards and verified
  absent.
- Route walk: all 18 routes in `src/navigation.ts` have a matching
  case in `App.tsx` (splash, welcome, goal, starter, today,
  habitDetail, habitForm, routines, routineDetail, routineForm,
  progress, weeklyReport, settings, habitsGrid, login, signup,
  forgot, legal), plus the Paywall overlay component. That covers
  all 18 doc items: the Paywall is the overlay (not a stack route)
  and Legal is the sub-screen bonus.
- No device testing was done. On-device behaviour is untested.
- Not pushed to GitHub. Not a production app.
