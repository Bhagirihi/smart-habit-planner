# Agent.md — Working rules for AI agents on this repo

Read this file before changing code, docs, or pushing anything for
Smart Habit & Routine Planner. It overrides any generic habit-tracker
advice when the two conflict.

## 1. Do not invent

- Never invent a price, purchase, subscription, sync, backup, calendar
  import, widget, or device test. If it is not configured or not run,
  say so plainly.
- Never claim a screen, feature, or push is done until it is verified
  (see §4). A tool call succeeding is not verification.
- Never copy a competitor's assets, logos, screenshots, wording, or
  preset names. Inspiration is pattern-level only (see Design.md).

## 2. Branches — do not confuse the two apps

- `main` = the original Smart Habit Planner app (light theme,
  Tasks tab, Timeline/Plan, drag reorder, partial progress).
- `v2` = the blank-from-scratch Deep Teal rebuild documented here.
  Changes for this spec go to `v2`, never to `main`, unless the user
  explicitly says otherwise.
- Never merge. Fixes go to a new branch + PR pattern only where the
  user asked for it; for this repo the user's pattern is "push all at
  once" after verification, and only when he says so.

## 3. Before you report anything done

All four must pass, in this order:

1. `npx tsc --noEmit` — 0 errors, repo-wide.
2. `npx jest` — all suites pass.
3. `npx expo export --platform android` — passes; delete `dist/`
   afterwards.
4. Pushed == local, if a push was ordered: verify file-by-file
   against the pushed branch tree (blob SHA), not by the push receipt
   and not by a PR-list field. `list_commits` ignores the branch
   parameter — verify with `get_file_contents` + `ref` instead.

If any step fails, report the failure and what is still open. Do not
smooth it over, and do not re-report the same claim in a later message
without re-verifying it.

## 4. Hard rules from past mistakes

- Every dependency change must push the regenerated
  `package-lock.json` with it, or EAS `npm ci` fails the same way it
  did for the location feature in Shubh Muhurat.
- PNG/JPEG cannot be pushed reliably via the GitHub MCP push paths
  (binary double-encoding / UTF-8 rejection). Prefer SVG or data-URI
  in code; for store images use the GitHub website upload route and
  verify by size/hash, not by the upload receipt.
- A paywall must never lose a draft: it is an overlay, not a screen
  replacement.
- Returning users go directly to Today. Test
  `resolveEffectiveRoute()` for loading → Splash, fresh → Welcome,
  returning → Today, every time navigation changes.
- Reminder ids are stored per habit and must be cancelled on
  reschedule, disable, and delete.
- Do not silently re-render, re-bundle, or add an unasked feature.
  Candidate extras that were explicitly NOT added: Tasks tab,
  Android widget, colour wheel. Offer them; do not build them unasked.

## 5. How to work with the user

- He works blunt and terse, points with one-line asks, and checks
  deliveries himself. Lead with what shipped, verified, and what
  still blocks — in that order.
- Deliver verified batches, not pieces. One push, all files, verified.
- When he corrects a claim, follow the correction through every
  affected file and message. Do not just fix the reply.
- Ask one question at a time, and only when a missing choice would
  materially change the work. Otherwise execute, verify, report.
- For Play Console work: do NOT route sign-in through this VM's
  browser (he declined Google's QR selfie check there). Use his own
  signed-in browser or `eas submit`.

## 6. Safety and privacy

- No secrets in chat, code, docs, or memory: no API keys, service
  account JSON, Google OAuth client secrets, or RevenueCat/Supabase secrets. Stubs stay
  credential-free.
- Auth rules: never store a password anywhere in the app; never
  log a password, token, or reset link; session tokens go in
  secure storage only; Google sign-in must go through Supabase
  Auth, never through a hand-rolled OAuth flow in the app.
- Deleting user data (Settings → Delete my data) is a two-step flow
  and must never be triggered by an agent without his explicit yes.
- Never describe, copy, or reuse another user's data. All example
  habits in docs are generic (drink water, read, run).
