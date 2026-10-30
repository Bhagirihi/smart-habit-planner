# Smart Habit UI — UI-only Expo preview

A UI + navigation-only version of Dhruv's Smart Habit & Routine
Planner, built from the .md docs in
`~/workspace/goals/smart-habit-planner/files/smart-habit-docs/`
(Design.md, PRD.md, features.md, AppFlow.md).

**This is NOT a production app.** It has no backend, no database,
no persistence, no sync, no notifications, and no purchases.

## What is UI-only / static

- All habits, routines, progress, and suggestions are hardcoded in
  `src/data.ts` and held in React state for the session only.
- Tapping a habit check, applying/dismissing a suggestion, or
  running a routine step only changes this session's state.
  Reloading the app resets everything to the static data in
  `src/data.ts`. Saving a habit or routine form returns to a tab
  and does not persist anything.
- Login / Signup / Google buttons are UI preview only. Every auth
  screen shows: "UI preview — no account is created or signed in."
  Continue goes to Today only to demo navigation; it does NOT
  mean sign-in succeeded, and no account, token, or password is
  stored or sent anywhere.
- The Paywall is an overlay with plan names only and no prices.
  Prices will come from real products later; tapping a plan does
  nothing and unlocks nothing. Closing it returns to the current
  screen, with no draft lost.
- Settings → Delete my data is UI only and deletes nothing.
  Legal screens (Terms / Privacy / Help) contain preview text
  only and are not legal documents for a released app.
- No Sleek DESIGN.md file, competitor assets, logos, or text were
  copied. Verdant Nightfall is interpreted in our own words from
  the style review, using the Design.md starting tokens.

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
    note on screen; Continue → Today for demo only.
17. **Signup** — same fields and Google button, UI preview note,
    Continue → Today for demo only.
18. **Forgot Password** — email field, then a "Check your email
    (preview state)" state. No email is actually sent.

Legal sub-screens (Terms / Privacy / Help) are reached from
Settings and are part of screen 14's flow.

Bottom tabs (on tab screens only): Today, Routines, Progress,
Settings, with a central + button opening an action sheet
(Add habit / Create routine). Detail, form, report, and grid
screens hide the tabs. Android back order: action sheet →
paywall overlay → stack pop → exit only at a root tab screen.

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
