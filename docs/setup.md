# setup.md — Setup and run

## Prerequisites

- Node.js (SDK 58 needs Node >= 22.13 — check with `node -v`).
- npm.
- For on-device preview: the Expo Go app (matching SDK 58) or an
  Android emulator.
- No backend, no API key, and no third-party account is needed for
  the MVP. The app runs fully offline from local SQLite.

## Install and run

```sh
npm install
npm start
```

Then press `a` in the terminal to open Android, or scan the QR code
with Expo Go.

## Scripts

| Command | What it does |
|---|---|
| `npm start` | Start Metro / Expo dev server |
| `npm run android` | Start Expo and open on Android |
| `npm test` | Run Jest unit tests |
| `npm run typecheck` | Run `tsc --noEmit` |

## Verify before reporting done

```sh
npm run typecheck   # must be 0 errors
npm test            # all suites must pass
npx expo export --platform android   # must pass; delete dist/ afterwards
```

## Android build (EAS) — intended route, not yet run

No EAS project is linked for v2 yet, so these steps describe the
route to take when a real build is ordered:

```sh
npm install -g eas-cli
eas login
eas build:configure
eas build --platform android --profile production
```

`eas build:configure` creates/links the project and `eas.json`
profiles. Until that is done there is no EAS project id, no build
profile, and no production artifact. Package name: 
`com.smarthabit.planner.v2`.

## Environment variables

None for the MVP. Do not invent any.

Future (only when the corresponding service is really configured):

- RevenueCat: API key + product ids, configured in the RevenueCat
  dashboard and wired into `src/services/subscription.ts`. Until
  then the stub stays: empty products, `isPremium()` false.
- Supabase: project URL + key, wired into `src/services/sync.ts`.
  Until then the stub stays: local-only, nothing uploaded.
- Supabase Auth + Google sign-in (2026-10-30 decision):
  1. Create a Supabase project, enable Auth, enable the Email
     provider, and set the email templates + redirect URLs.
  2. In Google Cloud, create an OAuth client (Android + Web as
     Supabase requires), add the Supabase callback URL as an
     authorised redirect URI, and copy the client ID/secret into
     the Supabase Google provider settings only — never into
     chat, code, or docs.
  3. In the app, configure the Supabase URL + anon key (public,
     not secret) and the app's redirect scheme, then test:
     email signup → login, Google sign-in → return to app,
     forgot password → reset link.
  Until all three steps are done, Login/Signup show
  "not configured" and must not be demoed as working.

Never paste a secret, service-account JSON, or API key into chat,
code, docs, or memory. Stubs stay credential-free.

## Troubleshooting

- **Stuck on Splash:** this was a real v2 bug (returning users kept
  route Splash). It is fixed by `resolveEffectiveRoute()` + the
  Splash Continue fallback. If it recurs, check navigation first,
  not the theme.
- **EAS `npm ci` fails after a dependency change:** the regenerated
  `package-lock.json` was not pushed with `package.json`. Push them
  together, always.
- **Reminder not firing at the exact minute:** expected — local
  notification delivery is best-effort on Android. Check the
  permission state on Habit Form before assuming a code bug.
- **Expo Go version mismatch:** use Expo Go matching SDK 58. An
  older Expo Go will not run this build.
- **PNG push failures via GitHub tools:** known limit — use SVG /
  data-URI in code, or GitHub website upload for store images, and
  verify by size/hash.
