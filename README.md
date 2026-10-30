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

## New in this update (2026-10-30) — widget, payment setup, free-tier days

- **Today layout change (2026-10-30, user feedback):** the
  Dashboard Widget card was REMOVED from Today — Today is now
  just greeting + compact free-tier pill + ring + week strip +
  habit rows. The real Android home widget below is untouched.
  The free-tier pill sits directly under "Keep going, you're
  doing great!" and is one compact line, not a card.
- **Widget Preview screen (`widgetPreview`, tabs hidden):** shows
  what an Android home widget would look like inside a
  home-screen-style frame — completion ring/%, habit names with
  today's check state, and the same habit grid — with a clear
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
  `android.initialLayout` pointing at the widget file. It
  shows today's completion (3 of 6 · 50%, with a progress bar)
  and a last-7-days habit grid (6 habits × 7 cells: done =
  teal, partial = amber, missed = dark surface, not done =
  darker surface). The widget data is STATIC in this UI build
  (duplicated inside the widget file, because the isolated
  widget runtime cannot read app state) — it will not update
  when you tick habits in the app until persistence +
  `updateSnapshot` are added. The app package stays
  `com.smarthabit.planner.ui` as already set in app.json.
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

## Tooltip-guided tour (2026-10-30)

A hand-rolled tooltip tour, no external tooltip library. The
reusable bubble is `src/components/Tooltip.tsx` (title, 1–2
short lines, step dots "Step X of 10", Back / Skip / Done,
close X, and a "Go to …" button where a step has a
destination), styled in Verdant Nightfall with 48dp touch
targets. The tour overlay lives in `App.tsx`, above the
content, so it works with the custom stack: Next/Back only
move the bubble (they never push a route, so there are no
dead-ends or duplicate stack entries), while "Go to …"
navigates once (guarded against pushing the current route)
and the tour stays open on top. Android back closes the tour
before popping the stack. Skip and X dismiss it at any step.

How to start / replay it (session only — reload resets it,
same as the rest of this preview):
- Today: tap the **?** button at the top right, or the
  "Start guided tour" button on the intro card (the old
  one-line "Tour: tap a row…" card was replaced by this —
  there is only one tour now; "Not now" dismisses the card
  for the session).
- Settings → **How to use this app — guided tour**
- Settings → Help → **Start guided tour**

Tour steps (each 2 short sentences max, no prices, no real
accounts or data invented):
1. Your Today ring — what "3 of 6" means (Go to Today)
2. Checking off a habit — row → detail, ✓/○ toggles (Today)
3. The + button — Add habit vs Create routine
4. Routines — list, detail, step-by-step Run Mode
   (Next/Restart) (Go to Routines)
5. Progress — week/month toggle, Habit Score, heatmaps
   (Go to Progress)
6. Weekly Report — suggestions with Apply/Dismiss
   (Go to Weekly Report)
7. Habits Grid — what the coloured cells mean
   (Go to Habits Grid)
8. Free tier and payment — 5 habits, 1 routine, 12 days left
   (static demo); Payment Setup has Skip, Paywall is under
   Settings → Upgrade (Go to Payment Setup)
9. Settings — account, notifications, Help, Home widget
   preview (Go to Settings)
10. You're ready — replay from Settings or the ? on Today

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
    Home-screen-style frame with completion, habit check states,
    and the habit grid. Tabs hidden. Real-widget limitation is
    stated on screen.
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

## Verification (2026-10-30, tooltip-guided tour)

- `npx tsc --noEmit`: 0 errors.
- `npx expo export --platform android`: passed, 642 modules,
  bundle 1.6 MB, `dist/` total 1,644,100 bytes. `dist/` was
  deleted afterwards and verified absent.
- Route walk: all 20 stack cases in `App.tsx` still present
  (splash, welcome, goal, starter, today, habitDetail,
  habitForm, routines, routineDetail, routineForm, progress,
  weeklyReport, settings, habitsGrid, login, signup, forgot,
  widgetPreview, paymentSetup, legal), plus the Paywall
  overlay and the new tour overlay (not a stack route).
  Tour entry points: Today ? button, Today intro card,
  Settings → guided tour, Help → Start guided tour.
- No device testing was done. On-device behaviour is untested.
- No code was pushed to GitHub. Not a production app.

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
