# AppFlow.md — Screen map and user journeys

## Screen map

```
Splash
  ├─ fresh user ─────────────► Onboarding Welcome
  │                              └─► Goal + Wake Time
  │                                   └─► Starter Habits ─► Today
  └─ returning user ─────────► Today (directly, never stuck on Splash)

Bottom tabs (always visible on tab screens, hidden on detail/form/report/grid):
  Today ────────┬─ tap habit row ──► Habit Detail ──► (back) Today
                ├─ tap check ──────► record / undo today
                ├─ central + ──────► action sheet ─► Add Habit / Create Routine
                ├─ Today button ───► Habits Grid ──► tap card ─► Habit Detail
                └─ Progress button ┐
  Routines ─────┬─ tap routine ────► Routine Detail ─► Run Mode (step by step)
                └─ central + ──────► Create Routine
  Progress ─────┬─ week/month toggle, heatmap, Habit Score
                └─ Habits Grid button ─► Habits Grid
  Settings ─────┬─ notifications, evening review time
                ├─ Upgrade to Premium ─► Paywall (overlay)
                ├─ Help ─► "Show guide again", Terms, Privacy, Help sub-screens
                └─ Delete my data (two-step) ─► onboarding reset ─► Welcome

Overlays (on top of the current screen, draft-preserving):
  Paywall — opened by: Settings → Upgrade, 6th habit, 2nd routine
  Action sheet — opened by: central + button

Weekly Report — reached from Progress / Today (per spec cadence, Sunday).
  Suggestion ─► Apply (changes the habit) / Dismiss (no change)
```

## Journey 1 — First launch (fresh user)

1. Splash (leaf + title, brief) → Welcome.
2. Welcome: pick nothing yet, tap Continue → Goal + Wake Time.
3. Goal + Wake Time: pick one goal (Fitness / Study / Health /
   Productivity / Better Mornings) + a wake time → Continue.
4. Starter Habits: pick starter habits → Finish. These are real
   habits in SQLite, not demo data.
5. Today appears with the guided tour. Tour explains: tap row →
   detail, check → done / undo, ring = done-of-scheduled, `+` adds
   habit/routine. Dismissal is saved; it does not reappear.

## Journey 2 — Returning user

1. App opens → Splash (brief) → Today directly.
2. No onboarding, no tour (unless reset via Settings → Help).
3. Ring shows "X of Y done"; date strip shows this week, today
   highlighted.

## Journey 3 — Add and complete a habit

1. Today → `+` → Add Habit.
2. Fill: name, icon, colour, type (do / avoid / measurable), target,
   frequency, time slot, skip days, reminder.
3. Save → back to Today, habit in its Morning/Afternoon/Evening group.
4. Tap check → done (measurable: enter value; done only at target).
   Tap again → undo. No duplicate record is ever created.
5. Tap the row → Habit Detail → grid, stats, notes, edit, pause,
   archive, delete (delete cancels its reminder).

## Journey 4 — Skip, miss, and streaks

1. Mark a future day as Skip in advance → streak is safe.
2. Leave a scheduled habit undone past midnight → it is marked
   missed, streak resets to 0, shown neutrally (no red shame screen).
3. An unscheduled day (habit not due that weekday) does not affect
   the streak.

## Journey 5 — Routine run

1. Routines → Create Routine → name, start time, ordered habits
   (drag to reorder, or up/down in the form).
2. Save → Routines list shows the routine with its %.
3. Tap routine → Routine Detail → Start Run → step-by-step through
   each habit in order → finish → back to Routines with updated %.

## Journey 6 — Progress and Habits Grid

1. Progress → week/month toggle, week bars, heatmap, Habit Score,
   per-habit rates.
2. Progress → Habits Grid (or Today → Habits Grid): one card per
   non-archived habit, last-6-months heatmap, legend.
3. Tap a card → Habit Detail. Past dates on the grid are read-only.

## Journey 7 — Weekly Report

1. Weekly Report opens (Sunday cadence) → totals, best day, best
   streak, lowest habit.
2. Each suggestion shows its reason (e.g. "lowest completion —
   try mornings").
3. Apply → the habit actually changes (time slot / frequency /
   target / pause). Dismiss → no change, suggestion marked dismissed.
4. Report reloads on every showing, so applied changes are visible
   immediately.

## Journey 8 — Hitting a free limit

1. Create a 6th habit (or 2nd routine) → Paywall overlay opens.
2. The draft behind the overlay is preserved — closing the paywall
   returns to the draft intact.
3. In demo mode: no prices are shown, purchase/restore return
   "not configured", Premium is not unlocked. This is correct
   behaviour until real RevenueCat products exist.

## Journey 9 — Settings and reset

1. Settings → toggle notifications, set evening review time.
2. Settings → Help → "Show guide again" → tour reappears on next
   Today visit.
3. Settings → Legal → Terms / Privacy / Help sub-screens.
4. Settings → Delete my data → confirm (two steps) → all local data
   deleted → next launch goes to Welcome (onboarding is reachable
   again only this way).

## Journey 10 — Login / Signup (optional, 2026-10-30)

1. After onboarding, the user is offered "Sync & backup" with two
   choices: Login/Signup, or Skip. Skip goes straight to Today;
   the app works fully offline.
2. Login: email + password → Today (signed in). Or tap
   "Continue with Google" → Google consent → back to the app →
   Today (signed in). No new account is created silently: a Google
   sign-in for a new user creates a Supabase account, and that is
   shown as "Welcome" state, not hidden.
3. Signup: email + password → confirmation state ("check your
   email" if email confirmation is on in Supabase) → Login once
   confirmed. Or "Continue with Google" as above.
4. Forgot Password (from Login): enter email → reset link sent →
   "check your email" state → set a new password via the link →
   back to Login.
5. Settings → Account: shows signed-in email (or "Not signed in"),
   Sign out, and Delete account (two-step, explicit confirm).
   Signing out never deletes local habits; it only ends the
   session and returns sync status to local-only.
6. If Auth is not configured yet: Login/Signup show
   "not configured" and do nothing else. They must not show a
   fake Google account or a fake success screen.

## Journey 11 — Android back button

Order, every time: close action sheet → close paywall overlay →
pop the stack → exit only when on a root tab screen. Never exit
from a detail, form, report, or grid screen on a single back press.

## Edge cases to test (not optional)

- Returning user never stuck on Splash (Journey 2, plus Splash
  Continue fallback).
- Draft survives paywall open/close (Journey 8).
- Reminder cancelled on reschedule, disable, and delete.
- Permission denial still saves the habit, with a note on the form.
- Measurable habit at 99% shows progress but does not count the streak.
- Habits Grid with many habits: measure, do not assume performance.
