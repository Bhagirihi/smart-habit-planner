# plan.md — 1–2 week MVP plan

Estimate from the original idea: 1–2 weeks for the MVP. This plan
assumes one developer, the v2 stack already chosen, and no backend.
Each phase ends with a gate — do not start the next phase until the
gate passes.

## Phase 0 — Docs and freeze (half day)

- Freeze the 15 routes, the Deep Teal tokens, and the streak rules
  (PRD §6). Any change after this point is a new decision, not a
  silent edit.
- Gate: this doc set is reviewed and the screen list is agreed.

## Phase 1 — Foundation (Days 1–2)

- Expo SDK 58 project, TypeScript strict, typed custom navigation,
  theme tokens, SQLite schema + migrations, store load/write-through.
- Splash + `resolveEffectiveRoute()` (loading → Splash, fresh →
  Welcome, returning → Today) + Splash Continue fallback.
- Gate: `tsc` 0, app launches to the correct first screen in both
  fresh and returning states.

## Phase 2 — Habits core (Days 3–5)

- Habit model (do / avoid / measurable), Habit Form (type, frequency,
  weekdays, weekly target, time slot, skip days, colour, icon, reminder),
  Today list (Morning/Afternoon/Evening), Habit Detail, completion
  engine with `UNIQUE(habit_id, date)`.
- Streak engine + unit tests (done +1, missed resets, skip safe,
  measurable only at 100%, midnight rollover).
- Gate: Jest streak + engine suites pass; Today tap/undo never
  creates a duplicate record.

## Phase 3 — Routines, reminders, progress (Days 6–8)

- Routines list, Routine Form (ordered habit list, drag reorder +
  up/down fallback), Routine Detail + step-by-step Run Mode.
- Local reminders via `expo-notifications`, per-habit notification
  ids, cancel on reschedule/disable/delete, denial note on the form.
- Progress (week/month toggle, heatmap, Habit Score, per-habit
  rates) + Habits Grid.
- Gate: routine run completes in order; reminder lifecycle tests pass.

## Phase 4 — Onboarding, weekly report, paywall, settings (Days 9–10)

- Onboarding: Welcome → Goal + Wake Time → Starter Habits. Every
  step requires an action; step 3 creates real habits, not demo data.
- Guided tour on first Today visit, persisted, resettable from
  Settings → Help.
- Weekly Report + suggestion rules + Apply/Dismiss, reloading on
  every showing.
- Paywall as an overlay (draft-preserving), Free gates 5 habits /
  1 routine, RevenueCat stub returning "not configured", no prices.
- Settings: notifications, evening review, Legal sub-screens,
  two-step Delete my data.
- Gate: full AppFlow.md journey walk passes; `tsc` 0; Jest all pass;
  Android export passes.

## Phase 5 — Polish and ship prep (Days 11–14, only if needed)

- 360px visual QA, contrast check (ink primary text), BackHandler
  order (sheet → paywall → pop → exit), empty states ("No habits
  yet"), error states.
- Device run in Expo Go: returning-user Splash bug, notification
  timing, and Habits Grid weight are explicitly checked, not assumed.
- Store assets: icon, feature graphic, screenshots — generated fresh,
  never copied from competitors. PNGs go via GitHub website upload
  if they must reach the repo (see Agent.md).
- EAS: link a project only when a real build is ordered
  (`eas build:configure`, then a production Android build).
- Gate: device run done, or the release is explicitly labelled
  "not device-tested".

## After MVP (explicitly out of scope above)

1. Real RevenueCat products + prices (only then does the paywall
   show prices or unlock Premium).
2. Supabase sync / backup, with a real account and privacy policy.
3. Widgets (HabitNow/HabitKit pattern), preset habit library with
   fresh wording, 30-day challenge journeys (Tick It pattern).
4. Journey notes/timeline (TickOff pattern), focus timer
   (HabitNow/Tick It pattern).
5. iOS build, web app, Wear OS — only after Android MVP is stable.

## Risks

- **Retention:** the hardest risk in the original idea. Mitigation
  is the product, not marketing: fast Today, shame-free skips, and
  one-tap weekly suggestions.
- **Notification delivery:** exact-time local notifications are
  best-effort on Android; never promise exact delivery.
- **Grid weight:** Habits Grid is ~183 cells per card; measure with
  many habits before calling it fast.
- **Price honesty:** any price shown before RevenueCat products exist
  is a bug, not a placeholder.
