# Smart Habit & Routine Planner — readme

Build routines, track habits, set reminders, visualise streaks, and
get personalised weekly suggestions. Offline-first, no account
required, single dark theme (Deep Teal Console).

## Quick start

See setup.md for the full steps. In short:

```sh
npm install
npm start
```

Then press `a` for Android, or scan the QR code with Expo Go.
Package name (v2): `com.smarthabit.planner.v2`.

## What it is

- **Today:** one progress ring, a week date strip, and habits grouped
  Morning / Afternoon / Evening. Tap to complete, tap again to undo.
- **Routines:** named, ordered habit sequences with a step-by-step
  Run Mode.
- **Progress:** week/month toggle, heatmap, Habit Score, per-habit
  rates, and a Habits Grid view (one card per habit, last-6-months
  heatmap).
- **Weekly Report:** one report per week with rule-based suggestions
  (move to morning, reduce frequency, pause, lower target) and working
  Apply / Dismiss actions.
- **Settings:** notifications, evening review time, Help (with
  "Show guide again"), Legal (Terms / Privacy / Help), and a two-step
  Delete my data flow.

## Screens (15 routes)

Splash; Onboarding Welcome, Goal + Wake Time, Starter Habits; Today,
Habit Detail, Add/Edit Habit; Routines, Routine Detail + Run Mode,
Create/Edit Routine; Progress, Weekly Report, Settings, Habits Grid;
Paywall as an overlay. Only Today, Routines, Progress, and Settings
are bottom tabs.

## Stack

Expo SDK 58 / React Native 0.88 / React 19.3 / TypeScript, typed
custom navigation (not Expo Router), Expo SQLite (`smarthabit.db`),
`expo-notifications` for local reminders, Jest for tests.

## Free vs Premium

Free: 5 habits, 1 routine. The 6th habit or 2nd routine opens the
Paywall overlay. Premium is intended for unlimited habits/routines,
advanced charts, up to 3 reminders per habit, widgets, and backup/sync.

**Honest status:** RevenueCat and Supabase are credential-free stubs
in v2. The paywall shows no prices, purchase/restore return
"not configured", and Premium is never unlocked by a fake purchase.
No price in this app may be hard-coded; prices must come from real
configured products.

## Verification (v2, last verified state)

- `tsc --noEmit`: 0 errors.
- Jest: 45/45 (streaks, completion engine, reminders, navigation,
  heatmap).
- Android export: passes, 3.4 MB bundle, `dist/` removed afterwards.
- Never device-tested: on-device behaviour, especially notification
  timing and Habits Grid weight with many habits, is untested until a
  real device run happens.

## Docs in this folder

- `Design.md` — tokens, components, and what was deliberately not copied.
- `PRD.md` — problem, scope, rules, monetisation, acceptance criteria.
- `Architecture.md` — stack, data model, flows, stubs.
- `Agent.md` — rules for AI agents working on this repo.
- `plan.md` — 1–2 week MVP plan with gates.
- `setup.md` — environment, run, test, and EAS steps.
- `features.md` — feature-by-feature spec with free/premium gates.
- `AppFlow.md` — screen map and user journeys.

## Reference apps (inspiration only)

Tick It / Habit Diary, HabitNow, TickOff, and HabitKit — the user's
liked set. No assets, logos, screenshots, or text from them are used
in this app.
