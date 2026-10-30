# Design.md — Smart Habit & Routine Planner

## Design system: Deep Teal Console Mobile (single dark theme)

This is the design system already in the v2 code (`src/theme.ts`). Do not
introduce a light theme, gradients, or a second palette without a new
decision. The system is dark-only by design: it reads well at night,
keeps habit colours legible, and matches the reference feel the user
likes (HabitKit's pure-black dark mode, TickOff's dark mode) without
copying any competitor's assets, logos, or text.

## Colour tokens (exact)

| Token | Value | Use |
|---|---|---|
| Background | `#0A1211` | App background |
| Surface | `#0D1917` | Cards |
| Surface Alt | `#0F1E1B` | Secondary surfaces, scheduled-missed cells |
| Surface Tonal | `#12312C` | IconTile background, highlighted chips |
| Ink (primary text) | `#E9F5F1` | Headings, numbers, primary text — never muted for primary text |
| Muted | `#A7C2BB` | Secondary text only |
| Border | `#1B2F2B` | Card / input borders |
| Primary | `#2DD4BF` | Teal accent, progress ring, primary buttons, selected day |
| On Primary | `#06201C` | Text on primary (e.g. today's badge, primary button label) |
| Accent | `#34D399` | Partial completion, success accents |
| Error | `#F43F5E` | Destructive actions, failed state |
| Amber (streak) | `#FBBF24` | Streak flame, streak counts |
| Chart palette | `#2DD4BF, #60A5FA, #A78BFA, #FBBF24, #FB7185` | Progress charts, in this order |

Habit colours (pickable per habit): teal `#2DD4BF`, blue `#60A5FA`,
violet `#A78BFA`, amber `#FBBF24`, coral `#FB7185`, green `#34D399`.

## Spacing, radius, type

- Spacing: xs 4, sm 8, md 12, lg 16, xl 20, xxl 24.
- Radius: sm 8, md 12, lg 16, xl 20, full 9999.
- Type sizes: title 24, subtitle 18, numeral 24, body 14, label 14,
  small 12, caption 12.
- Touch targets: minimum 48dp. Habit form pickers are 56px with a live
  IconTile preview.
- SafeArea on every screen. Layouts must work from 360px phones up;
  do not design for one phone width only.

## Rules

1. **No gradients.** Flat surfaces only.
2. **No card shadows**, except the floating central `+` button.
3. **No red failure screens.** A missed day is shown neutrally
   (surfaceAlt), not as shame. Planned skips never break a streak.
4. **One job per screen.** Today does one job: what is due today, and
   checking it off. Stats live on Habit Detail / Progress, not on Today.
5. **Contrast rule:** primary text and numbers are always ink
   `#E9F5F1`, semibold where they are a headline figure. Muted is
   secondary text only.
6. **Heatmap semantics (do not invent new colours):** done = full habit
   colour, partial = accent green, scheduled-missed = surfaceAlt,
   unscheduled / future = faint.
7. **IconTile:** tonal `#12312C` background, habit-colour border, icon
   centred. Used on Today, Habits Grid, Progress, Habit Detail header,
   and Routine Detail — one component, not per-screen copies.

## Icons

19 habit icons are in the code: ✓ 💧 🚶 📖 🧘 🥗 😴 🏋️ ✍️ 🎯 🧹 💻
👣 🏃 🍎 🎵 💰 🧠 🚰. Add new icons only through this shared list, so
the picker, Today, grid, and detail stay in sync.

## Components

- **Bottom navigation:** Today, Routines, Progress, Settings, with a
  central floating `+` button. Detail screens, forms, Weekly Report,
  and Habits Grid hide the tabs (same as detail screens).
- **Progress ring (Today):** one ring, "X of Y done" in the centre,
  plus the encouragement line "Keep going, you're doing great!".
- **Date strip (Today):** week strip, today highlighted in primary
  with dark on-primary text.
- **Habit row:** IconTile + name + streak (amber flame) + today's
  badge in full habit colour with dark text + check circle. Tap row
  → Habit Detail. Tap check → record today; tap again → undo.
- **Guided tour:** shown once on first Today visit after onboarding.
  Dismissal is persisted (`tour_seen`); Settings → Help → "Show guide
  again" resets it. InfoTips (`?`) on Today, Habits Grid, and Progress.
- **Paywall:** an overlay, not a full-screen replacement, so a new
  habit/routine draft survives opening and closing it.
- **Sheets / overlays:** action sheet first, then paywall, then stack
  pop, then exit — this is the Android BackHandler order.

## Auth screens (2026-10-30)

Login, Signup, and Forgot Password use the same Deep Teal tokens,
spacing, and type as every other screen — one exception: the
"Continue with Google" button follows Google's sign-in branding
(white background, Google "G", "Continue with Google" text), not
the teal primary button style. Email fields use the standard
surface card + border, password fields have show/hide, and errors
are shown in error `#F43F5E` text under the field, never as a
shaming full-screen error. A Skip button is always visible on the
post-onboarding auth offer, in muted text, so optional really
means optional.

## Screens and their visual job

See AppFlow.md for the full map. In short: Splash is text + leaf mark
only; onboarding is 3 steps and must feel like doing something (pick a
goal, pick a wake time, pick starter habits — every step requires an
action); Today is the ring + date strip + Morning/Afternoon/Evening
groups; Progress is week/month toggle + heatmap + Habit Score; Weekly
Report is one report per week with Apply buttons, not a dashboard.

## What was deliberately NOT copied

- Fabulous: 42-step onboarding / coaching overload — ours is 3 steps.
- Finch: busy home screen (pet / shop / feed) — ours is one ring + list.
- Habitica: RPG / XP / shop clutter — only the streak is a game mechanic.
- Any competitor's screenshots, logos, wording, or preset names — all
  copy in this app is written fresh. Inspiration is at the pattern
  level only (grid, streak view, routine run, preset library idea).
