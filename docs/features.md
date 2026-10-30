# features.md — Feature spec with free / premium gates

Legend: ✅ MVP (in v2 code) · 🔜 Later (planned, not built) · 🚫 Never
in MVP (explicit non-goal).

## Habits

- ✅ Create / edit habit: name, icon (19 shared icons), colour (6),
  type do / avoid / measurable, target + unit, frequency daily /
  weekdays / weekly, weekly target, time slot Morning / Afternoon /
  Evening, start date, skip days, reminder on/off + time.
- ✅ Today completion: tap check → done, tap again → undo. One
  record per habit per day (`UNIQUE(habit_id, date)`).
- ✅ Measurable progress: value/target % + bar on Today, Habit
  Detail, and Progress. Streak counts only at 100%.
- ✅ Partial progress display: no fake 0% bars; a habit with no value
  yet shows no bar.
- ✅ Skip in advance: does not break the streak. Missed (scheduled,
  undone at midnight) resets the streak to 0. Unscheduled days do
  not break it.
- ✅ Pause / archive a habit. Archived habits do not appear on
  Today or in the Habits Grid.
- ✅ Free gate: 5 habits. 6th habit opens the Paywall overlay.
- 🔜 Preset habit library (Tick It pattern, fresh wording only).
- 🔜 Quit-a-habit mode (HabitKit pattern: clean days count until a
  slip is logged).

## Routines

- ✅ Create / edit routine: name, start time, ordered habit list.
- ✅ Reorder: drag reorder on the full-screen list; up/down buttons
  in Routine Form as a fallback. Order persists.
- ✅ Routine Detail + step-by-step Run Mode: run habits in order,
  one step at a time.
- ✅ Routines list shows completion % per routine.
- ✅ Free gate: 1 routine. 2nd routine opens the Paywall overlay.
- 🔜 Timed routine run with per-step timers (HabitNow pattern).

## Reminders and focus

- ✅ Local reminders per habit, with per-habit notification id.
  Change / disable / delete cancels the old notification.
- ✅ Permission denial surfaced on Habit Form; the habit is still saved.
- ✅ Evening review time setting.
- 🔜 Up to 3 reminders per habit (Premium, HabitKit pattern).
- 🔜 Focus / Pomodoro timer (HabitNow / Tick It pattern).
- 🚫 Exact-time delivery is not guaranteed — never promise it.

## Streaks, progress, and stats

- ✅ Streak flame (amber) + streak count on every habit row.
- ✅ Best streak, completion rate, Habit Score (Progress).
- ✅ Progress: week/month toggle, week bars, heatmap, "X/7 days"
  headline, per-habit rate in ink semibold.
- ✅ Habits Grid: one card per non-archived habit — IconTile, name,
  streak, today's badge, last-6-months heatmap (done = full colour,
  partial = accent green, scheduled-missed = surfaceAlt,
  unscheduled/future = faint), legend, tap → Detail. Past dates
  read-only. Empty state: "No habits yet".
- ✅ Habit Detail: stats on a separate screen (not on Today),
  GitHub-style grid + 12-week heatmap pattern, measurable value grid
  (last 4 weeks + weekly totals).
- ✅ Achievement-style motivation via streaks and best streaks only
  in MVP. Medals (Tick It pattern) are 🔜, with fresh designs.

## Weekly Report and suggestions

- ✅ One report per week, reloading on every showing.
- ✅ Totals, best day, best streak, lowest habit.
- ✅ Rule-based suggestions with reasons: move to morning, reduce
  frequency, pause, lower target. Each has working Apply / Dismiss.
  Applying changes the habit; dismissing does not.
- 🚫 No AI coach, no generated advice text beyond these rules in MVP.

## Onboarding and tour

- ✅ 3 steps, every step requires an action: Welcome → Goal +
  Wake Time (goals: Fitness, Study, Health, Productivity, Better
  Mornings) → Starter Habits (creates real habits).
- ✅ Guided tour on first Today visit after onboarding; dismissal
  persisted; Settings → Help → "Show guide again" resets it.
- ✅ InfoTips on Today, Habits Grid, and Progress.
- 🚫 No 42-step coaching onboarding (Fabulous pattern, deliberately
  avoided).

## Tasks and to-dos

- Status: Tasks / Timeline / Plan exist in the original `main` app
  but are NOT in the v2 spec. They are not in this MVP.
- 🔜 Revisit as a separate decision: multi-type to-do list
  (HabitNow / Tick It pattern) only if the user orders it for v2.

## Personalisation

- ✅ Per-habit colour + icon, drag reorder, time slots.
- ✅ Single dark theme (Deep Teal). No light theme in MVP.
- 🔜 Themes / colour wheel, widgets (HabitNow / HabitKit pattern).

## Paywall and account

- ✅ Paywall overlay (draft-preserving), Free vs Premium comparison,
  Legal links (Terms / Privacy / Help sub-screens).
- ✅ No account required. Data stays on device. Settings shows
  local-only sync status + "Continue offline".
- ✅ Two-step Delete my data (resets onboarding, so onboarding
  screens become reachable again).
- 🔜 Real RevenueCat products, real prices, restore purchases.
- 🔜 Supabase backup/sync, only with a real account + privacy policy.
- 🚫 No fake purchase, no fake unlock, no hard-coded price — ever.
