# 100-User SIMULATED QA — Smart Habit UI

**Scope — read this first: this QA is SIMULATED. 0 real humans tested
the app. No real users, no user names, no user quotes, no ratings, and
no Play reviews are reported here, because none exist.** The 100
"users" are scripted profiles run against the real streak engine and
checked by code inspection of the screens. This report proves what the
code does on those scripted cases; it does not prove how real users
will behave, and it is not a device test.

- **App under test:** `~/workspace/smart-habit-ui/` only (Expo SDK 58,
  app.json version 1.0.1). Code was READ ONLY for this QA: no
  `App.tsx` or `src/` file was edited, nothing was pushed, and
  `~/workspace/smart-habit-planner-v2/`, `assets/*.png`, and `docs/`
  were not touched. All QA artefacts are new files under `qa/`
  (`run-streak-qa.cjs`, `results.json`, this report) plus scratch in
  `/tmp/qa-streak/`.
- **Timing caveat:** an Auth implementation agent was editing the app
  concurrently. The first `tsc` run during this QA showed 2 errors
  (see §5); a recheck at the end of QA passed with 0 errors. Findings
  that touch Auth/RLS are therefore reported against the code as read
  at QA time, and the Auth step in progress may already be changing
  them — re-verify before acting on them.
- **Reproduce the streak run:** `node qa/run-streak-qa.cjs` from the
  app folder. It transpiles the real `src/streak.ts` with the
  project's TypeScript compiler and runs it in Node — the engine was
  not reimplemented for this QA.

## Headline result

| Check | Result |
|---|---|
| Simulated profiles / streak cases | 100 total |
| Streak cases passed (final run) | **100 / 100** |
| Streak cases passed (first run) | 92 / 100 — all 8 mismatches were errors in this QA script's expected values, not in the engine (see §2) |
| Local-date helper checks | 4 / 4 pass |
| Performance (50 habits × 365-day histories + one 10-year history, streak + best) | 152–274 ms across runs (two runs; variance is machine load, not a regression) |
| Routes audited | 20 / 20 present in `src/navigation.ts` and handled in `App.tsx` |
| Tour steps / targets | 14 steps; all 13 targeted steps have a registered measurer |
| TypeScript (`npx tsc --noEmit`) | 0 errors on final recheck (2 transient errors on the first run during concurrent Auth editing — see §5) |
| Device test | **None.** No Android device and no real Supabase project were available, so the configured Supabase path and the real home widget are NOT device-verified by this QA. |

## 1. Simulated profiles (100)

Profiles are scripted histories, not people. Today is fixed at
2026-10-30 (Friday, weekday 5) for reproducibility.

| Category | Count | Passed | Notes |
|---|---|---|---|
| New user onboarding | 8 | 8 | Includes empty history, first-day done, today pending, empty schedule |
| Daily checker (all habits done) | 10 | 10 | Runs of 2, 3, 5, 7, 12, 15, 21, 30, 60, 90 days |
| Partial checker | 10 | 10 | Miss on yesterday / 2 / 3 / 5 / 7 days ago, alternating days, two runs |
| Skip-heavy | 10 | 10 | Skip yesterday/today, 3 skips in a run, all-skip, alternating skip/done |
| Unscheduled-day | 10 | 10 | Mon/Wed/Fri, weekends-only, Tue/Thu-only, Sun-only, done on unscheduled days |
| Routine-only | 5 | 5 | Routine members' habit histories (engine level; routine UI itself is §4) |
| Paywall / free-limit | 5 | 5 | Engine runs on 6, 10, 50 habits and 1–2 routines; the LIMIT is not enforced (finding B3) |
| Auth-not-configured | 5 | 5 | Static seed streaks (water 12, run 7, read 9, meditate 5, walk 15) reproduce exactly |
| Tour replay | 5 | 5 | Replay entry points exist; streak engine is not involved (empty history = 0/0) |
| Widget-preview | 5 | 5 | Preview counts are UI counts (3/6 seed, 0/6, 6/6, 1/6, 25/50); engine spot-check passes |
| Large-data | 3 | 3 | 50 habits × 365 days, one 10-year (3,650-day) run, sparse 365-day history |
| Edge cases | 24 | 24 | All-done, none-done, today pending, break, skip, schedule gaps, leap day, month/year boundaries, DST-style step, future-dated completions, empty schedule, very old history |

## 2. Streak engine — what the 8 first-run mismatches actually were

The first run was 92/100. Every one of the 8 mismatches was traced
to an incorrect expected value in this QA script, not to
`src/streak.ts`:

- Partial-checker (5 cases): the script expected best = window − 1.
  Correct best = max(run after the miss, run before the miss). E.g.
  5 days with yesterday missed: best is 3 (the 3 days before the
  miss), not 4. The engine returned 3.
- Skip-heavy (1 case): the case labelled "two skips then miss"
  contained no miss at all — only skips — so the engine's streak of
  3 (skips neither count nor break) was correct; the label and
  expectation were wrong and were corrected.
- Edge (1 case): a run ending Oct 28 with Oct 29 a passed scheduled
  day with no record correctly gives current streak 0 (best 3), not 3.
- Edge (1 case): a Mon/Wed/Fri case with only Wed + Fri done
  correctly gives streak 2, not 3 (the script had overwritten a done
  day with a skip in its own builder).

The script was corrected with the arithmetic shown above and
re-run: **100/100**. The correction is visible in
`qa/run-streak-qa.cjs` (comments on the partial-checker best
formula and the three relabelled cases). No engine code was touched.

Date handling (real helpers, not assumptions): `weekdayOf`
2026-10-30 = Friday (5) ✓, `addDays` across month and year
boundaries ✓, `toDateString` uses local fields (noon parse, so a
UTC shift cannot move the day) ✓.

## 3. What passed (code inspection)

- **Routes (20/20):** every route in `src/navigation.ts` has a
  matching `case` in `App.tsx` (splash, welcome, goal, starter,
  today, habitDetail, habitForm, routines, routineDetail,
  routineForm, progress, weeklyReport, settings, habitsGrid, login,
  signup, forgot, widgetPreview, paymentSetup, legal), plus the
  Paywall overlay and tour overlay. Legal handles Terms/Privacy/
  Help; detail screens fall back to the first item on an unknown id
  (see finding M3 for why that fallback is itself a risk).
- **Tour (14/14):** steps 1–13 each have a registered measurer:
  `today-completed`, `today-free-tier`, `today-help`,
  `today-first-habit`, `today-first-check` (`src/screens/Today.tsx`),
  `tab-plus`/`tab-today`/`tab-routines`/`tab-progress`/`tab-settings`
  (`App.tsx`), `routines-first` (`RoutineScreens.tsx`),
  `progress-score`/`report-first` (`ProgressReport.tsx`),
  `grid-first` (`HabitScreens.tsx`), `payment-skip`
  (`PaymentSetup.tsx`), `settings-tour` (`SettingsLegal.tsx`).
  Step 14 has no target by design. Steps for screens not currently
  mounted fall back to the bottom bubble with an amber note, as
  documented — that is handled, not a crash.
- **Today layout:** header → greeting → free-tier pill → week strip
  → Next/Completed card → tour card → slots (`Today.tsx`). No ring
  is rendered on Today (the `Ring` component in `ui.tsx` is unused
  but still present). The Next/Completed card is left = next habit
  (first undone in morning → afternoon → evening order) and right
  = "Habit completed today" with count, % and a progress bar.
- **Widget order:** real widget (`src/widgets/HabitWidget.tsx`) and
  preview (`WidgetPreview.tsx`) both do week first (circles, then
  Mon–Sun labels below them, no legend), then "Habit completed
  today" with count, % and bar. No steps counter, no streak line.
- **Contrast rule (pass, with one low-contrast note):** no element
  was found using exactly its parent background colour. Examples
  checked: cards `surface #0D1917` on `bg #0A1211`; week pills and
  habit rows `tonal #12312C` on `bg`; widget background `#12312C`,
  future/track `#334F49`, missed `#8A9E98`, done `#34D399`,
  today `#FBBF24`; Paywall rows `surfaceAlt #0F1E1B` on `surface`.
  The only close call is border `#1B2F2B` on `surface #0D1917`,
  which is barely visible (finding m6, Minor — a border, not a
  filled element).
- **Auth/paywall truthfulness (pass for preview honesty):** Login,
  Signup and Forgot all say "UI preview — no account is created or
  signed in"; Paywall says "plan names only — no prices" and
  "tapping a plan does nothing and unlocks nothing"; PaymentSetup
  says "no payment is taken"; Settings Delete says "UI only …
  deletes nothing"; Supabase not-configured wording in Settings,
  Splash and Today is truthful. No fake sign-in, purchase, or price
  was found. (The gaps are that these features do not exist yet —
  findings B2/B3 — not that they deceive.)
- **Supabase not-configured fallback:** when the two
  `EXPO_PUBLIC_SUPABASE_*` variables are absent, `src/supabase.ts`
  exports a null client, `App.tsx` keeps the static list, and
  HabitForm Save returns to Today persisting nothing. No hardcoded
  URL/key was found in code (verified by scan during this QA).

## 4. Findings

Severity: Blocker = must fix before any production release;
Major = wrong behaviour a real user will hit; Minor = polish, copy,
or edge-case robustness.

### Blockers

| ID | Finding | Location |
|---|---|---|
| B1 | **Temporary RLS policies allow anon full access to every row.** Anyone with the anon key can read/write all habits and completions. Must be replaced with `user_id = auth.uid()` policies before production. Already flagged in the schema/README; the Auth step in progress is the fix — do not ship until it lands and is re-verified. | `supabase/schema.sql` (policies + header comment), `src/supabase.ts` (auth note) |
| B2 | **Auth does not exist yet.** Login/Signup accept any (including empty) email/password and navigate onward; Forgot "sends" nothing. Labelled as preview, so this is not deception — but no real user account can be created or signed in. Auth agent is working on this concurrently; re-verify after it lands. | `src/screens/AuthScreens.tsx` (Login/Signup/Forgot) |
| B3 | **Free limits are not enforced and payments do nothing.** A 6th habit and a 2nd routine can be created without any gate (Routines screen itself says "This UI does not enforce limits"); Paywall plan taps and "Restore purchases" only close the overlay. RevenueCat step is still pending. | `src/screens/HabitScreens.tsx` (HabitForm), `src/screens/RoutineScreens.tsx` (Note), `src/components/Paywall.tsx` |
| B4 | **No device test and no real-project test.** The configured Supabase path (seed/load/write) and the real home widget have never run on a phone or against a real project. A production claim cannot be made from typecheck/export alone. Required on-device checks: tick → reload → still ticked; widget appears in the picker on a dev build; tour steps 2/3/4 frames land on their elements. | Whole app (verification gap, not a code line) |

### Major

| ID | Finding | Location |
|---|---|---|
| M1 | **"Today" is hardcoded to Thursday.** Today highlights weekday index 3, `WEEK_DATES` is the static Oct 27 – Nov 2 week, WidgetPreview's `WEEK_STATUS` and the real widget's status array both hardcode Thu as today. On any other day the week strip, the preview, and the widget all highlight the wrong day and show stale dates. Must compute today from the local date and derive the week/dates from it. | `src/data.ts` (`WEEK_DATES`), `src/screens/Today.tsx:132-134`, `src/screens/WidgetPreview.tsx` (`WEEK_STATUS`, label row), `src/widgets/HabitWidget.tsx:48,77` |
| M2 | **Streak display goes stale after toggling in configured mode.** `toggleDone` updates only the `done` set and writes the row; it does not recompute streaks or reload. HabitForm Save does reload (so its streaks refresh), but a Today/Detail toggle does not — so the row's "🔥 N-day streak" text stays at the old value until the app reloads, while the "3 of 6" count updates immediately. Fix: recompute streaks from the updated completion set (or reload) after a successful toggle. | `App.tsx` (`toggleDone`, cf. `saveHabit` which calls `refreshSupabase`) |
| M3 | **Crash/blank-screen risk on an empty habits list.** `habitById` falls back to `habits[0]!`; if the list is empty (e.g. a configured load returns `[]` after an RLS/seed failure, which `App.tsx` then sets as the list), `HabitDetail` reads `.icon`/`.name` off `undefined` and crashes. Same shape in `RoutineDetail` (empty steps → `finished` is true, so it falsely shows "Run complete 🎉"). Fix: an explicit empty/not-found state instead of the first-item fallback. | `src/screens/HabitScreens.tsx` (`habitById`), `src/screens/RoutineScreens.tsx:47-48` |
| M4 | **Progress score and Weekly Report totals are presented as real numbers without a static/preview label.** "Habit Score 86%", "28 completions · Best day: Thursday · Best streak: 26 days" are hardcoded, while HabitDetail's weekly totals are correctly labelled "(static)". In configured mode these numbers will also disagree with real completions. Label them as preview until they are computed from history. | `src/screens/ProgressReport.tsx:29,67` |
| M5 | **Routine Run Mode does not complete habits, and run state is shared.** "Mark step done → Next" only advances a global `runStep`; it never calls `toggleDone`, so finishing a routine does not check off its habits or extend any streak. `runStep` is also shared across all routines (open routine B after routine A and it starts at A's step). Fix: per-routine run state, and a run step that writes the habit completion (persisted, in the routine-persistence step). | `App.tsx:192` (`runStep`), `src/screens/RoutineScreens.tsx:47-48,62` |
| M6 | **Legal Privacy wording becomes false when Supabase is configured.** It says "no data leaves the device, because there is no backend" — true only in the unconfigured preview. Once configured, habit data does leave the device. The whole Legal screen is placeholder text anyway; it must be replaced with a real privacy policy before production, and this sentence must not survive into it. | `src/screens/SettingsLegal.tsx` (Legal, Privacy body) |
| M7 | **Demo seed would run against a real project.** On first launch with an empty habits table, the app inserts 6 demo habits + fabricated past completions. For a real first user that is demo data presented as their history, and two concurrent first launches could collide on the habit primary keys (the second insert fails and surfaces as a load error). Gate the seed to demo mode or remove it before production. | `src/supabase.ts` (`seedSupabaseDemoData`), `App.tsx` (seed effect) |

### Minor

| ID | Finding | Location |
|---|---|---|
| m1 | Empty habits list renders "All habits done 🎉" on Today (the `nextHabit == null` branch does not distinguish "all done" from "no habits"). Add an explicit empty state. | `src/screens/Today.tsx` (Next habit card) |
| m2 | `toggleDone` revert uses the `done` set captured at render time; rapid double-toggles can revert to a stale set. Low risk (single-tap UI), but a functional set-state update would remove it. | `App.tsx` (`toggleDone` catch block) |
| m3 | Onboarding goal/wake-time and starter picks are not persisted and do not change the Today list (starter is labelled session-only; goal is not labelled). | `src/screens/Onboarding.tsx` |
| m4 | Greeting is hardcoded "Good morning, Dhruv" regardless of time of day, and the name is hardcoded. | `src/screens/Today.tsx` (header) |
| m5 | Real widget uses fixed 42px day columns (7 × 42 = 294 + 32 padding); on narrow widget cells the last day may clip. No flexible layout is used. | `src/widgets/HabitWidget.tsx` (day/circle rows) |
| m6 | Border `#1B2F2B` on `surface #0D1917` is very low contrast (border barely visible). Not a same-colour failure — see §3 — but borders should be checked on-device. | `src/theme.ts` (`border`), `src/components/ui.tsx` |
| m7 | `computeBestStreak` has no iteration bound (unlike `computeStreak`'s 3,650-day bound) and `loadCompletionRows` has no user/date filter, so both grow unboundedly with history. Measured fine at test scale (152–274 ms for 50 × 365 days), but add a bound/filter before years of real history accumulate. | `src/streak.ts` (`computeBestStreak`), `src/supabase.ts` (`loadCompletionRows`) |
| m8 | New-habit id is `h${Date.now()}` and `user_id` is always null; under auth RLS policies this insert will fail. The Auth step must set `user_id` from the session. | `src/supabase.ts` (`upsertHabit`) |
| m9 | Tour copy is stale in configured mode: step 5 and step 14 say "Reloading resets it", which is false once Supabase persists completions. Make the copy conditional on `supabaseConfigured`, as Today's Note already is. | `src/components/Tooltip.tsx` (steps 5, 14) |
| m10 | README drift: the tour-mapping section still says step 1 is "Today ring → `today-ring`" and step 4 scrolls to "~480", but the code uses `today-completed` and layout-derived scroll. Update the README to match the code. | `README.md` (tour-mapping section) |
| m11 | Splash "Continue as a returning user" is offered to first-time users too; harmless in preview, but the returning/new split should be real before production. | `src/screens/Splash.tsx` |

## 5. TypeScript check

- Command: `npx tsc --noEmit` in `~/workspace/smart-habit-ui/`.
- **First run (during concurrent Auth editing): 2 errors** —
  `App.tsx(133,15): error TS2554: Expected 1 arguments, but got 0`
  and `App.tsx(201,13): error TS2554: Expected 2 arguments, but got 1`
  (a call site and a signature changed by the concurrent edit had not
  yet been reconciled). This QA did not fix them (read-only brief).
- **Final recheck: 0 errors, exit code 0.** The transient failure is
  reported here so a future reader does not mistake it for a stable
  defect — but any CI/production gate must run `tsc` on a settled
  tree, not mid-edit.

## 6. Recommended fixes, in priority order

1. **B1** — Replace temporary RLS policies with `user_id = auth.uid()` policies (Auth step) and re-verify; do not ship or demo against a real project until done.
2. **B2 + B3** — Finish Auth, then RevenueCat (products, purchase, restore, enforced 5/1 limits). Until then the app is a preview, not a product.
3. **M1** — Compute today/week/dates from the local date everywhere (Today, WidgetPreview, real widget). This is user-visible wrongness on 6 out of 7 days.
4. **M2** — Recompute streaks after every toggle in configured mode.
5. **M3** — Empty/not-found states for HabitDetail and RoutineDetail; remove the first-item fallback.
6. **M5** — Per-routine run state; routine steps write habit completions; persist routines.
7. **M4 + M6** — Compute Progress/Weekly Report from real history (or label them preview) and replace Legal placeholder text with a real privacy policy + terms.
8. **M7** — Gate or remove demo seeding for production builds.
9. **B4** — Device + real-project verification pass (tick → reload, widget picker on a dev build, tour frames on steps 2/3/4) before any production claim.
10. **Minors m1–m11** — in the order listed; none blocks a preview, m7/m8 should land with the Auth step.

## 7. What this QA did NOT cover

- No real-device run, no Expo Go run, no dev-build install, no home-widget placement test.
- No network testing against a real Supabase project (no project/keys exist yet).
- No accessibility, performance-on-low-end-device, battery, or Play Console/store-listing review.
- No testing of code the concurrent Auth agent was mid-edit on, beyond the `tsc` recheck above.

## Artefacts

- Harness: `qa/run-streak-qa.cjs` (100 cases, real engine, fixed today 2026-10-30)
- Raw results: `qa/results.json` (per-case expected vs actual, per-category counts, date checks, timing)
- This report: `qa/100-user-qa-report.md`
