# UI Notes — Smart Habit Planner

Short review of similar apps (web search only, 29 Oct 2026). No assets, logos,
or copy were taken from any of them. All icons in this app are colour + initial
letters, no emoji, no images.

## What to borrow

- **Habitify — clean checklist, fast check-in.** A habit list where tapping to
  complete is the whole interaction, with stats kept one tap away. Borrowed:
  Today is a single checklist grouped by time of day, and detail/stats live on
  a separate screen so the daily list stays uncluttered.
- **HabitKit — GitHub-style grid.** A coloured tile grid makes long streaks
  visible at a glance and is satisfying to fill. Borrowed: the 3-month grid on
  Habit Detail and the 12-week heatmap on Progress, in the app's own teal.
- **Streaks — big tappable buttons.** Large, thumb-friendly targets with a
  hard cap on clutter. Borrowed: 48dp minimum touch targets, one big circle
  per habit row, and a 24-habit-style discipline of keeping Today to one job.
- **Finch — gentle emotion, not punishment.** Finch's tone is forgiving:
  a missed day is a gentle check-in, not shame. Borrowed only as tone: the
  missed-yesterday banner says "start again today", skips are planned and
  shame-free, and there is no red failure screen.
- **Loop — simple, free, offline.** Proof that a tracker can be useful with
  no account and no server. Borrowed: offline-first, no account required,
  everything stored on the phone.

## What to avoid

- **Fabulous — 42-step onboarding and coaching overload.** A long quiz and
  heavy coaching content before the user ever ticks a habit. Avoided:
  onboarding here is 3 short steps and lands the user on a usable Today list
  with starter habits already in place.
- **Finch — a busy home screen.** Teardowns flag Finch's home as several
  systems (pet, adventures, goals) competing for attention. Avoided: no pet,
  no shop, no feed on Today. One progress ring, then the list.
- **Habitica — game-layer clutter.** RPG stats, gold, parties and monsters
  take a week to learn. Avoided: no XP, no shop, no social. The only game
  mechanic is the streak itself.
- **Habitify's paywall trap as a UX pattern.** Locking basic reminders and
  break/pause behind Premium frustrates free users. Avoided where it matters:
  reminders and planned skips/pauses are free here; Premium gates volume
  (habit/routine counts), advanced charts and weekly suggestions.

## Chosen premium direction

Warm, calm, editorial — not playful, not clinical.

- Light theme only in v1: warm off-white `#FAF9F6`, ink `#111827`,
  deep teal primary `#0F766E`, streak amber `#F59E0B`.
- White cards with a thin warm border, 20–24px radii, soft shadows, generous
  spacing. No card is ever edge-to-edge on a phone.
- Large readable type (30px hero, 22px titles, 15px body), colour + initial
  avatars instead of icon fonts or images, so the app works with no assets.
- Layout rules for all Android sizes: flex rows that wrap, no fixed pixel
  widths for content, `SafeAreaProvider` + `SafeAreaView` on every screen,
  scrollable forms so small 360px-wide phones and large-font settings do not
  clip content, and every interactive element at least 48dp tall.

## Redesign update (29 Oct 2026, look and feel only)

Reference apps supplied by the user (Play Store descriptions only; no
assets, logos, screenshots, or text copied from any of them):

- **HabitTick** — minimalist checklist, visual calendar and streak grid,
  yes/no habits, a clean time-based day planner, themes and colours.
  Borrowed: colourful per-habit cards, a week strip on Today, and a
  preset habit library on the Add Habit screen.
- **TickOff (Vinztech)** — two home screens, Streak View and List View,
  plus light and dark mode. Borrowed: the List / Streak view toggle on
  Today, and a real Light / Dark mode that switches every screen.
- **Tick It (Habit Diary)** — a preset library of popular habits,
  challenge journeys, detailed statistics, and achievement medals.
  Borrowed: presets, and an achievements strip (First Step, 7-Day,
  30-Day, 100-Day) computed from existing check-ins.

What changed in the theme: teal identity kept, with a distinct colour
per habit (teal, blue, violet, pink, orange, green, red, cyan), gradient
heroes (teal to violet) on Today, Onboarding, Splash, and Paywall, and
gradient primary buttons. Dark mode is a separate readable palette
(dark slate surfaces, bright teal/violet/amber accents), not an
inversion. No pet, shop, feed, social, or cloud sync was added, and no
streak, paywall-gate, or data logic was changed.
