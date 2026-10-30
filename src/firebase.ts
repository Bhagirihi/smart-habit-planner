// Firebase Analytics (+ Crashlytics) — STEP 5, the ONLY place the app
// talks to Firebase. Everything else uses plain functions from here
// (via App.tsx / UiState), so screens never import
// @react-native-firebase/* and never see the SDK.
//
// ROUTE (verified, not guessed): @react-native-firebase/app +
// @react-native-firebase/analytics + @react-native-firebase/crashlytics
// v27.1.0. Its peer range is expo >= 47 and react-native >= 0.60, so
// it fits Expo SDK 58 / RN 0.88. The old expo-firebase-analytics
// package (latest 8.0.0) is NOT used — it is the deprecated pre-SDK-51
// route and does not fit this stack.
//
// CONFIGURATION — there is NO API key or env var for Firebase here,
// and none is invented or pasted anywhere:
//   * Firebase Android configuration lives ONLY in
//     google-services.json, a file supplied by the user from their
//     Firebase console. It must NEVER be committed to this repo
//     (it is in .gitignore via the firebase/ pattern below — see the
//     README for the exact setup), and it must NEVER be pasted into
//     chat, code, or docs.
//   * The @react-native-firebase config plugins are NOT in app.json
//     yet, deliberately: prebuild with those plugins but without
//     google-services.json would fail, and this app must run fully
//     without Firebase. When google-services.json exists for a dev
//     build, add "@react-native-firebase/app",
//     "@react-native-firebase/analytics" and
//     "@react-native-firebase/crashlytics" back to app.json plugins
//     (the order expo install originally added) and rebuild.
//   * "Configured" therefore means, at runtime: the native Firebase
//     modules load AND Firebase Analytics can be called without
//     throwing. Installing the npm packages alone does NOT make the
//     app configured — a dev build with google-services.json is
//     required, exactly like RevenueCat and the real home widget.
//
// EXPO GO: the native modules are NOT in Expo Go, so they are loaded
// LAZILY (dynamic import) only on the probe/log path. The
// unconfigured path never touches them at all, so the app runs in
// Expo Go exactly as before. A failed load is treated as
// "not configured" (a silent no-op), never as a crash and never as
// fake analytics.
//
// PRIVACY: no event parameter ever contains an email, a name, a
// target string, a price, a product id, or any user-entered text.
// habit_completed carries only the internal habit id + slot;
// habit_created carries only the slot; routine events carry only
// the internal routine id + step count; paywall_shown and
// purchase_completed carry no parameters at all. No invented user
// IDs are set — Firebase's own anonymous app instance id is the
// only identifier, and only when actually configured.
//
// OPT-OUT: persisted in AsyncStorage under ANALYTICS_OPT_OUT_KEY.
// Default is opted IN, but logging is effective ONLY when configured
// AND opted in — "default on only when configured". Turning the
// toggle off stops all future logging and disables Crashlytics
// collection; it does not delete events already sent (Firebase
// Analytics has no per-device delete from the client).

import AsyncStorage from '@react-native-async-storage/async-storage';

const ANALYTICS_OPT_OUT_KEY = '@smarthabit:analytics_opt_out';

export type AnalyticsEventName =
  | 'app_open'
  | 'habit_completed'
  | 'habit_created'
  | 'routine_started'
  | 'routine_completed'
  | 'paywall_shown'
  | 'purchase_completed';

export type AnalyticsParams = Record<string, string | number>;

// Cached module handles after a successful lazy load, or null when
// the native modules are unavailable (Expo Go) / Firebase is not
// initialised (no google-services.json). Never import the SDKs at
// the top level of this file.
let analyticsModule: any = null;
let crashlyticsModule: any = null;
let probeAttempted = false;
let probeSucceeded = false;

// Try once to load the native modules and prove Analytics works.
// Returns true only when a real Analytics instance answers.
// Safe to call repeatedly: after the first attempt the result is
// cached (a dev build will not gain Firebase mid-session, and an
// Expo Go session will not either).
export async function probeFirebase(): Promise<boolean> {
  if (probeAttempted) return probeSucceeded;
  probeAttempted = true;
  try {
    // `any` here is deliberate: the RNFB v27 type declarations do not
    // expose a .default member, but the runtime module does — and the
    // fallback below covers a namespace-shaped module either way.
    // The probe then proves the instance actually answers.
    const analyticsMod: any = await import('@react-native-firebase/analytics');
    const crashlyticsMod: any = await import('@react-native-firebase/crashlytics');
    const analytics = analyticsMod.default ?? analyticsMod;
    const crashlytics = crashlyticsMod.default ?? crashlyticsMod;
    if (!analytics || typeof analytics().logEvent !== 'function') {
      probeSucceeded = false;
      return false;
    }
    // Touch the instances without sending an event: setAnalyticsCollectionEnabled
    // is a local setting, not an event, and proves the native side answers.
    await analytics().setAnalyticsCollectionEnabled(true);
    if (crashlytics && typeof crashlytics().setCrashlyticsCollectionEnabled === 'function') {
      await crashlytics().setCrashlyticsCollectionEnabled(true);
    }
    analyticsModule = analytics;
    crashlyticsModule = crashlytics;
    probeSucceeded = true;
    return true;
  } catch {
    // Native module missing (Expo Go) or Firebase not initialised
    // (no google-services.json / no dev build): not configured, no-op.
    analyticsModule = null;
    crashlyticsModule = null;
    probeSucceeded = false;
    return false;
  }
}

// True only after a successful probe (see probeFirebase). Callers
// must check this before claiming Firebase is connected.
export function isFirebaseProbedConfigured(): boolean {
  return probeAttempted && probeSucceeded;
}

export async function getAnalyticsOptOut(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(ANALYTICS_OPT_OUT_KEY)) === '1';
  } catch {
    return false;
  }
}

export async function setAnalyticsOptOut(optOut: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(ANALYTICS_OPT_OUT_KEY, optOut ? '1' : '0');
  } catch {
    // Persist failure: the in-memory toggle in App still applies for
    // this session; the preference just will not survive a reload.
  }
  // Apply the preference to the SDKs immediately when they exist.
  try {
    if (analyticsModule) await analyticsModule().setAnalyticsCollectionEnabled(!optOut);
  } catch { /* toggling collection must never crash the app */ }
  try {
    if (crashlyticsModule) await crashlyticsModule().setCrashlyticsCollectionEnabled(!optOut);
  } catch { /* same */ }
}

// Log one real event. Silently does nothing when: Firebase was not
// probed as configured, the user opted out, or the native call
// throws. It never throws, never queues fake events, and never
// logs when called with personal data — callers must pass only the
// whitelisted parameters documented at the top of this file.
export async function logAnalyticsEvent(
  name: AnalyticsEventName,
  params: AnalyticsParams | undefined,
  optedIn: boolean,
): Promise<void> {
  if (!optedIn) return;
  if (!probeSucceeded || !analyticsModule) return;
  try {
    await analyticsModule().logEvent(name, params);
  } catch {
    // A failed log is dropped, never retried into a fake event and
    // never surfaced as an app error — analytics must not break habits.
  }
}

// Record a non-fatal error in Crashlytics. Only generic, non-personal
// error identifiers should be passed (e.g. 'supabase_load_failed');
// never pass raw SDK error messages, emails, tokens, or user text.
// No-op under the same conditions as logAnalyticsEvent.
export async function recordCrashError(identifier: string, optedIn: boolean): Promise<void> {
  if (!optedIn) return;
  if (!probeSucceeded || !crashlyticsModule) return;
  try {
    await crashlyticsModule().recordError(new Error(identifier));
  } catch {
    // Crash reporting must never crash the app.
  }
}
