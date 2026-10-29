# Smart Habit & Routine Planner (v2)

A blank Expo app for building daily habits and routines, with streaks,
weekly reports and personalised suggestions. Dark-only theme
("Deep Teal Console"). This is a fresh v2 codebase, separate from the
earlier smart-habit-planner app.

## Setup and run

Prerequisites: Node.js, npm, and the Expo Go app (for on-device preview)
or an Android emulator.

```sh
npm install
npm start
```

Then press `a` in the terminal to open Android, or scan the QR code with
Expo Go. The npm scripts are:

- `npm start` — start the Metro bundler / Expo dev server.
- `npm run android` — start Expo and open on Android.
- `npm test` — run the Jest unit tests.
- `npm run typecheck` — run `tsc --noEmit`.

## Android build (EAS)

No EAS project is configured yet, so these steps describe the intended
route rather than a setup that has already been run:

```sh
npm install -g eas-cli
eas login
eas build:configure
eas build --platform android --profile production
```

`eas build:configure` creates the `eas.json` and links the project; until
that is done, there is no EAS project id, no build profile and no
production build artifact for this app. The Android package name in
`app.json` is `com.smarthabit.planner.v2`.

## Required environment variables

None for the first release. There is no backend, no API key and no
third-party account configured, so the app runs fully offline from local
storage (see "Data layer" below).

## Navigation

This app uses a typed custom navigation stack (`src/navigation.ts`)
instead of Expo Router. Every route is a member of the `Route` union and
the `Nav` interface (`route`, `push`, `back`, `goTab`, `openPaywall`)
is passed to screens as a prop. Reasons for this choice in a blank
project with a small, fixed screen set:

- No file-based routing machinery is needed for a handful of screens.
- The route set is checked by TypeScript at every navigation call, so a
  misspelled route or a missing parameter is a compile error, not a
  runtime blank screen.
- It keeps the EAS Android export simple and avoids router
  peer-version risk on the current Expo SDK.

## Data layer

All data lives on the device in Expo SQLite (`src/services/db.ts`,
database `smarthabit.db`): preferences, habits, completions (with a
`UNIQUE(habit_id, date)` constraint, so one habit can have at most one
record per day), routines and weekly reports. The store
(`src/store.tsx`) loads from SQLite on startup and writes through to it
on every change; if a write fails it keeps the change in memory rather
than crashing.

Note on AsyncStorage: `@react-native-async-storage/async-storage` is
installed as a dependency, but preferences in this build live in SQLite
(the `prefs` table), not in AsyncStorage. AsyncStorage is not currently
used as the store for any user data.

## What is fully implemented

- Habit creation and editing: do / avoid / measurable habits, daily,
  weekday and weekly frequencies, time slots, skip days, reminders.
- Today completion, including measurable values (a measurable habit only
  counts as done when its value reaches its target).
- Streaks, best streaks and completion rates (`src/services/streaks.ts`),
  including planned skips and unscheduled days not breaking a streak.
- Routines and routine ordering.
- Weekly reports and personalised suggestions
  (`src/services/suggestions.ts`).
- Local reminders via `expo-notifications`
  (`src/services/notifications.ts`). Exact-time delivery is best-effort
  and not guaranteed by the platform.
- Settings, including notifications, evening review time, and a
  two-step delete-all-local-data flow.
- Paywall screen UI (Free vs Premium comparison) with no prices.
- Unit tests for streaks and for the idempotent completion engine
  (`__tests__/streaks.test.ts`, `__tests__/engine.test.ts`).

## What is prepared but not connected

- **Supabase stub** (`src/services/sync.ts`): no URL, key or account is
  configured. `syncStatus()` reports that data is stored only on this
  device. Settings shows this status and a "Continue offline" note.
  Nothing is uploaded.
- **RevenueCat stub** (`src/services/subscription.ts`): no API key and
  no products are configured. `AVAILABLE_PRODUCTS` is empty,
  `isPremium()` is always `false`, and `restorePurchases` /
  `purchaseProduct` return messages explaining that nothing is
  configured. The paywall therefore shows no prices at all, never claims
  a purchase succeeded, and never unlocks Premium.
- **No real prices or purchases.** Any price or purchase shown by a
  future build must come from a real configured product; this build
  invents none.
- **No device testing yet.** The screens and flows in this build have
  not been verified on a physical device or emulator by this worker;
  treat on-device behaviour (especially notifications and the full
  navigation flow) as untested until that check is done.

## Verification status (coordinator, 29 October 2026, final for v2.1)

- Unit tests (`npx jest`): passed — 2 suites, 26 tests total
  (16 in `__tests__/streaks.test.ts`, 10 in `__tests__/engine.test.ts`).
- Typecheck (`npx tsc --noEmit`): exit 0, zero errors, repo-wide.
- Android export (`npx expo export --platform android`): passed, 3.4 MB bundle; `dist/` removed afterwards. Expo 58.0.21, expo-sqlite 16.0.10.
- No device or emulator run was done, so on-device behaviour is untested.

## Known limitations (honest, do not smooth over)

- Paywall form preservation: the app renders only the top stack screen, so a new habit/routine draft is lost if the user opens the paywall from the form and then goes back — the form remounts empty (edits to an existing item reload the saved item, draft edits are lost). This does not meet the spec's "without losing the form" for new drafts.
- Android system back button: no hardware BackHandler is wired, so the system back button exits the app instead of popping the custom stack. In-app back buttons work.
- Reminder denial message: if notification permission is denied, the scheduling service returns the reason, but the store does not surface that message on the habit form — the user sees no confirmation either way.
- Weekly Report loads once on mount; if data finishes loading after mount, revisit the screen for fresh data.
- Routine Form save shows "Routine saved." then navigates back immediately, so the message itself is barely visible; the updated list is the visible confirmation.
- EAS: `eas.json` profiles exist, but no EAS project is linked and no EAS build has been run.
