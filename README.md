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
has a destination. The overlay lives in `App.tsx` OUTSIDE
SafeAreaView (inside the provider) so its absolute window
coordinates match `measureInWindow` exactly. Next/Back only
move the bubble (never push a route), "Go to …" navigates
once (guarded), Android back closes the tour before popping
the stack, and Skip/X dismiss at any step.

How targets are measured: each screen registers a measurer
for its targets via `ui.registerTourTarget(key, tourMeasure(ref))`
(ref + `measureInWindow`, `collapsable={false}` on wrappers);
App re-measures the current step's target 350ms after the
step/route changes (so a screen can mount and Today can
finish scrolling to the first habit row). If a target is not
mounted, zero-size, or fully off-screen, that step falls back
to the old bottom bubble with an amber note telling the user
to use "Go to …" and step back to see it highlighted. It
never crashes and never points at nothing. Scrolling while
the tour is open can leave a frame stale until the next
step change re-measures it.

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
1. Today ring → `today-ring` → Today, Ring wrapper
2. Free tier pill → `today-free-tier` → Today, pill wrapper
3. Help ? button → `today-help` → Today, ? Pressable
4. First habit row → `today-first-habit` → Today, first
   (Drink water) row Pressable; Today auto-scrolls to ~480
   before measuring so the row is in view
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
  rendered outside SafeAreaView so window coordinates match).
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
