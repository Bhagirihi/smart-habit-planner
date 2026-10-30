# PRD.md — Smart Habit & Routine Planner

## 1. Product summary

An offline-first mobile app to build routines, track habits, set
reminders, visualise streaks, and receive personalised weekly
suggestions. One app, one job per screen, no account required to start.

Target user: an Android user who has tried habit apps before and
abandoned them because they were either too cluttered, too shaming
when a day was missed, or too much coaching and not enough doing.

## 2. Problem

Habit apps fail on retention, not on tracking. A tick is easy; coming
back on day 30 is hard. The product therefore optimises for: (a) a
Today screen that takes under 10 seconds to use, (b) a visible streak
that survives a planned skip, and (c) a weekly suggestion that can be
applied in one tap instead of read and forgotten.

## 3. Goals and non-goals

### Goals (MVP)

- A user can finish onboarding in under 2 minutes and leave with real
  habits, not demo data.
- A returning user lands directly on Today (never stuck on Splash).
- Habits, routines, reminders, streaks, progress, and weekly
  suggestions all work fully offline.
- Free vs Premium is honest: gates are visible, purchases are real
  only when RevenueCat products are configured, and demo mode never
  claims a purchase succeeded.

### Non-goals (MVP)

- No cloud sync, no social feed, no coaching chat, no AI coach.
- No Android widget, no Wear OS app, no web app (see plan.md for later).
- No calendar import (the "Import Calendar" row is a Premium
  placeholder until a real import exists — it must not pretend to work).
- No fake prices, no fake unlock, no copied competitor content.

## 4. Reference apps (user's liked set, 2026-10-30)

These four are the user's personal favourites and the pattern
reference for this product. They are inspiration only — no assets,
logos, screenshots, or text are copied from them.

| App | What to learn from it |
|---|---|
| Tick It / Habit Diary | Preset habit library, 30-day challenge journeys, focus timer, stats + achievement medals, multi-type to-do list |
| HabitNow | Habits + to-dos + calendar in one place, flexible scheduling, timers, custom reminders, themes, widgets |
| TickOff (app.vinztech.tickit) | Two home views (Streak View + List View), journey notes/timeline, light + dark mode, cloud backup |
| HabitKit | Colour tile grid per habit, yes/no + count + measured tracking, quit-a-habit mode, no account, fully offline, free up to 4 habits |

## 5. Scope: screens

15 routes in the current v2 code: the original 14-screen spec plus the
Habits Grid added 2026-10-30.

1. Splash
2. Onboarding — Welcome
3. Onboarding — Goal + Wake Time
4. Onboarding — Starter Habits
5. Today (tab)
6. Habit Detail
7. Add / Edit Habit
8. Routines (tab)
9. Routine Detail + Run Mode
10. Create / Edit Routine
11. Progress (tab)
12. Weekly Report / Suggestions
13. Paywall (overlay)
14. Settings (tab)
15. Habits Grid (from Today and Progress; tabs hidden, as on detail screens)

Only Today, Routines, Progress, and Settings are bottom tabs.
Splash + the 3 onboarding screens are launch-only; they are
revisitable only after Settings → Delete my data resets onboarding.

## 6. Core rules (do not change without a new decision)

- **Completion:** Done = streak +1. Missed (scheduled, undone at
  midnight rollover) = streak resets to 0. Skip marked in advance
  does not break the streak. Unscheduled days do not break a streak.
- **Measurable habits:** only count as done when value reaches target.
  Partial progress is shown (value/target % + bar) but the streak
  counts only at 100%.
- **One record per habit per day:** enforced by
  `UNIQUE(habit_id, date)` in SQLite.
- **Free limits (in code):** 5 habits, 1 routine. The 6th habit or 2nd
  routine opens the Paywall overlay. A draft opened before the
  paywall must survive closing it.
- **Reminders:** local notifications only. A reminder time change,
  disable, or habit delete cancels the previous notification.
  Permission denial is shown on the form; the habit is still saved.
- **Weekly Report:** generated weekly (Sunday cadence in the spec),
  with rule-based suggestions (move to morning, reduce frequency,
  pause, lower target) that have working Apply / Dismiss actions.

## 7. Monetisation

Business target from the original idea: $3–8/month or a lifetime
purchase. That is a target band, not a displayed price.

- **No price is hard-coded in the app.** Prices come only from real
  RevenueCat products when they are configured.
- Until then the paywall is clearly demo mode: it shows no prices,
  purchase/restore return "not configured", and Premium is never
  unlocked by a fake purchase.
- Premium (when configured) is intended to unlock: unlimited habits
  and routines, advanced charts, up to 3 reminders per habit, widgets,
  and backup/sync. Core tracking, streaks, routines, and the weekly
  report are not paywalled.

## 8. Success criteria (MVP acceptance)

- `tsc --noEmit`: 0 errors.
- Jest: all suites pass (streaks, completion engine, reminders,
  navigation, heatmap).
- Android export (`npx expo export --platform android`): passes.
- Every screen in §5 is real, not a placeholder, and reachable by the
  flow in AppFlow.md.
- Returning user → Today. Fresh user → Welcome. No route leaves the
  user stuck on Splash.
- No invented price, purchase, sync, or calendar import is claimed.
- Verified against the pushed branch tree before being reported done
  (see Agent.md).
