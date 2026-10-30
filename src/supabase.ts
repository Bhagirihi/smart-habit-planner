import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import type { Habit, Routine } from './theme';
import { HABITS, INITIAL_DONE, ROUTINES } from './data';
import { addDays, localToday } from './streak';

// Completes any pending web-browser auth session (no-op on native, safe
// to call on every launch). Required by the expo-web-browser flow.
WebBrowser.maybeCompleteAuthSession();

// Supabase client + repository (STEP 1: persistence + streak engine;
// STEP 2: Supabase Auth).
//
// Configuration comes ONLY from environment variables — never hardcoded,
// never invented, never pasted here:
//   EXPO_PUBLIC_SUPABASE_URL
//   EXPO_PUBLIC_SUPABASE_ANON_KEY
// Set them in a local .env file for `expo start` (see .env.example), or
// as EAS secrets for builds. EXPO_PUBLIC variables are inlined at build
// time, so changing them requires restarting the dev server / rebuilding.
// If either variable is missing or empty, there is NO client:
// `supabase` is null and `isSupabaseConfigured` is false, and the app
// must fall back to its static, session-only behaviour (see App.tsx).
// Nothing here fakes a connection, writes fake rows, or claims sync works.
//
// Auth (STEP 2): sessions ARE persisted, in AsyncStorage via the client
// config below (persistSession: true, autoRefreshToken: true). No email,
// token, or password is ever logged, written to a plain file, or pasted
// into code/docs by this module — passwords go straight to Supabase Auth
// and are never stored here. Auth is OPTIONAL: the app works fully with
// no account (static, session-only), and signing in never wipes data
// (see ensureUserHabits / the merge rule below).
//
// RLS (STEP 2): supabase/schema.sql now uses user-scoped policies
// (user_id = auth.uid() for habits; completions via habit ownership).
// The old temporary pre-auth anon policies are gone. That means a
// configured-but-unsigned-in app gets NO Supabase rows — by design —
// and must use its static fallback until the user signs in.

// `process.env` in Expo holds the EXPO_PUBLIC variables at build time.
// This declaration keeps TypeScript happy without @types/node; at runtime
// the access below is guarded by typeof checks.
declare const process:
  | { env: Record<string, string | undefined> }
  | undefined;

function envVar(name: string): string {
  try {
    if (typeof process !== 'undefined' && process?.env) {
      return process.env[name] ?? '';
    }
  } catch {
    // Never crash on env access — missing config just means unconfigured.
  }
  return '';
}

const supabaseUrl = envVar('EXPO_PUBLIC_SUPABASE_URL').trim();
const supabaseAnonKey = envVar('EXPO_PUBLIC_SUPABASE_ANON_KEY').trim();

export const isSupabaseConfigured = supabaseUrl.length > 0 && supabaseAnonKey.length > 0;

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
        storage: AsyncStorage,
      },
    })
  : null;

// Redirect back into the app after an OAuth / email-link flow. The app
// scheme is 'smarthabitui' (app.json), so this is
// 'smarthabitui://auth-callback'. The same URL must be added to the
// Supabase dashboard (Authentication → URL Configuration → Redirect
// URLs) or Supabase will refuse the redirect — see README.
export function authRedirectUri(): string {
  return makeRedirectUri({ scheme: 'smarthabitui', path: 'auth-callback' });
}

export interface AuthUser {
  id: string;
  email: string | null;
}

function toAuthUser(user: User | null): AuthUser | null {
  if (!user) return null;
  return { id: user.id, email: user.email ?? null };
}

export async function getCurrentAuthUser(): Promise<AuthUser | null> {
  const client = requireClient();
  const { data, error } = await client.auth.getSession();
  if (error) throw error;
  return toAuthUser(data.session?.user ?? null);
}

export function onAuthStateChange(
  callback: (user: AuthUser | null) => void,
): { unsubscribe: () => void } {
  const client = requireClient();
  const { data } = client.auth.onAuthStateChange((_event, session) => {
    callback(toAuthUser(session?.user ?? null));
  });
  return { unsubscribe: () => data.subscription.unsubscribe() };
}

// ------------------------------------------------------------- auth flows
// All of these throw a plain Error with a human-readable message on
// failure; screens display that message and never navigate as if the
// sign-in had succeeded. Nothing here ever logs a password or token.
export async function signUpWithEmail(
  email: string,
  password: string,
): Promise<{ user: AuthUser | null; needsConfirmation: boolean }> {
  const client = requireClient();
  const { data, error } = await client.auth.signUp({
    email: email.trim(),
    password,
    options: { emailRedirectTo: authRedirectUri() },
  });
  if (error) throw error;
  // Supabase may require email confirmation: then there is a user but
  // no session yet. Callers must show "check your email" and must NOT
  // treat this as signed in.
  const needsConfirmation = !data.session && !!data.user;
  return { user: toAuthUser(data.session?.user ?? null), needsConfirmation };
}

export async function signInWithEmail(
  email: string,
  password: string,
): Promise<AuthUser> {
  const client = requireClient();
  const { data, error } = await client.auth.signInWithPassword({
    email: email.trim(),
    password,
  });
  if (error) throw error;
  const user = toAuthUser(data.session?.user ?? null);
  if (!user) throw new Error('Sign-in did not return a session. Please try again.');
  return user;
}

export async function resetPasswordForEmail(email: string): Promise<void> {
  const client = requireClient();
  const { error } = await client.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: authRedirectUri(),
  });
  if (error) throw error;
}

// Google sign-in via Supabase OAuth. If the Google provider is not
// enabled in the Supabase dashboard, Supabase returns an error about
// the provider — that is surfaced truthfully as "not configured",
// never papered over with a fake sign-in, and no client ID or secret
// is ever invented or stored here (those live only in the dashboard).
export async function signInWithGoogle(): Promise<AuthUser> {
  const client = requireClient();
  const redirectTo = authRedirectUri();
  const { data, error } = await client.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo, skipBrowserRedirect: true },
  });
  if (error) {
    const msg = error.message.toLowerCase();
    if (msg.includes('provider') && (msg.includes('not enabled') || msg.includes('unsupported') || msg.includes('disabled'))) {
      throw new Error('Google sign-in is not configured in the Supabase dashboard yet. Enable the Google provider there first, then try again.');
    }
    throw error;
  }
  if (!data?.url) throw new Error('Google sign-in did not return a sign-in URL.');
  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type !== 'success') {
    throw new Error('Google sign-in was cancelled.');
  }
  const callback = parseAuthCallbackUrl(result.url);
  if (callback.code) {
    const { data: exchanged, error: exchangeError } = await client.auth.exchangeCodeForSession(callback.code);
    if (exchangeError) throw exchangeError;
    const user = toAuthUser(exchanged.session?.user ?? null);
    if (!user) throw new Error('Google sign-in did not return a session.');
    return user;
  }
  if (callback.accessToken && callback.refreshToken) {
    const { data: setData, error: setError } = await client.auth.setSession({
      access_token: callback.accessToken,
      refresh_token: callback.refreshToken,
    });
    if (setError) throw setError;
    const user = toAuthUser(setData.session?.user ?? null);
    if (!user) throw new Error('Google sign-in did not return a session.');
    return user;
  }
  throw new Error('Google sign-in did not return a session. The provider may not be configured in the Supabase dashboard yet.');
}

export async function signOut(): Promise<void> {
  const client = requireClient();
  const { error } = await client.auth.signOut();
  if (error) throw error;
}

// Parse an OAuth callback URL without relying on the URL constructor
// (not guaranteed on every RN runtime): handles both ?code=… and
// #access_token=…&refresh_token=… forms.
function parseAuthCallbackUrl(url: string): {
  code?: string;
  accessToken?: string;
  refreshToken?: string;
} {
  const out: { code?: string; accessToken?: string; refreshToken?: string } = {};
  const query = url.split('?')[1]?.split('#')[0] ?? '';
  const fragment = url.split('#')[1] ?? '';
  for (const part of `${query}&${fragment}`.split('&')) {
    const [k, v] = part.split('=');
    if (!k || v === undefined) continue;
    const value = decodeURIComponent(v);
    if (k === 'code') out.code = value;
    if (k === 'access_token') out.accessToken = value;
    if (k === 'refresh_token') out.refreshToken = value;
  }
  return out;
}

function requireClient(): SupabaseClient {
  if (!supabase) throw new Error('Supabase is not configured (missing EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY).');
  return supabase;
}

// ------------------------------------------------------------------ rows
export interface DbHabitRow {
  id: string;
  user_id: string | null;
  name: string;
  icon: string;
  color: string;
  slot: 'morning' | 'afternoon' | 'evening';
  target: string;
  reminder: string;
  schedule: unknown;
  created_at: string;
}

export interface DbCompletionRow {
  habit_id: string;
  date: string; // YYYY-MM-DD (local date, never UTC)
  status: 'done' | 'skip';
}

const DAILY_SCHEDULE = [0, 1, 2, 3, 4, 5, 6];

// schedule is stored as jsonb in Postgres, so the client normally returns
// a real array; tolerate a JSON string or garbage by falling back to daily.
export function parseSchedule(value: unknown): number[] {
  let arr: unknown = value;
  if (typeof value === 'string') {
    try {
      arr = JSON.parse(value);
    } catch {
      return [...DAILY_SCHEDULE];
    }
  }
  if (!Array.isArray(arr)) return [...DAILY_SCHEDULE];
  const days = arr.filter((n): n is number => typeof n === 'number' && n >= 0 && n <= 6);
  return days.length > 0 ? days : [...DAILY_SCHEDULE];
}

// A DB row becomes a Habit with placeholder streak fields; App.tsx
// overwrites streak/bestStreak from src/streak.ts computations, and rate
// keeps the seeded value for seed habits (0 for user-added habits) until
// rate-from-history is built in a later step.
export function rowToHabit(row: DbHabitRow): Habit {
  const seed = HABITS.find((h) => h.id === row.id);
  return {
    id: row.id,
    name: row.name,
    icon: row.icon,
    color: row.color,
    slot: row.slot,
    streak: 0,
    bestStreak: seed?.bestStreak ?? 0,
    rate: seed?.rate ?? 0,
    target: row.target,
    reminder: row.reminder,
  };
}

// ------------------------------------------------------------------ reads
// RLS (STEP 2) already restricts every row to user_id = auth.uid()
// (habits) or to habits owned by the user (completions), so these reads
// can only ever return the signed-in user's rows. userId is still passed
// explicitly for habits so callers never rely on RLS alone.
export async function loadHabitRows(userId?: string): Promise<DbHabitRow[]> {
  const client = requireClient();
  let query = client.from('habits').select('*').order('created_at', { ascending: true });
  if (userId) query = query.eq('user_id', userId);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as DbHabitRow[];
}

export async function loadCompletionRows(): Promise<DbCompletionRow[]> {
  const client = requireClient();
  const { data, error } = await client
    .from('completions')
    .select('habit_id, date, status');
  if (error) throw error;
  return (data ?? []) as DbCompletionRow[];
}

// ----------------------------------------------------------------- writes
export interface HabitInput {
  id?: string; // absent = new habit (id generated here); present = edit
  name: string;
  icon: string;
  color: string;
  slot: 'morning' | 'afternoon' | 'evening';
  target: string;
  reminder: string;
  schedule?: number[];
}

export async function upsertHabit(input: HabitInput, userId: string): Promise<DbHabitRow> {
  if (!userId) throw new Error('Sign in to save habits.');
  const client = requireClient();
  const id = input.id ?? `h${Date.now()}`;
  const { data, error } = await client
    .from('habits')
    .upsert(
      {
        id,
        user_id: userId,
        name: input.name,
        icon: input.icon,
        color: input.color,
        slot: input.slot,
        target: input.target,
        reminder: input.reminder,
        schedule: input.schedule ?? DAILY_SCHEDULE,
      },
      { onConflict: 'id' },
    )
    .select()
    .single();
  if (error) throw error;
  return data as DbHabitRow;
}

// status null = remove today's record (undo). Otherwise upsert one row:
// the (habit_id, date) primary key enforces one completion per habit/day.
export async function setCompletion(
  habitId: string,
  date: string,
  status: 'done' | 'skip' | null,
): Promise<void> {
  const client = requireClient();
  if (status === null) {
    const { error } = await client
      .from('completions')
      .delete()
      .eq('habit_id', habitId)
      .eq('date', date);
    if (error) throw error;
    return;
  }
  const { error } = await client
    .from('completions')
    .upsert({ habit_id: habitId, date, status }, { onConflict: 'habit_id,date' });
  if (error) throw error;
}

// ------------------------------------------- sign-in merge + demo seed
// MERGE RULE (STEP 2 — auth is optional, signing in never wipes data):
//   1. If the signed-in user already has habits, keep them exactly as
//      they are — nothing is seeded, nothing is overwritten.
//   2. Otherwise, try to CLAIM the anonymous demo habits: the 6 demo
//      habit ids created before auth existed (user_id null). The schema
//      has a narrow migration policy for exactly those ids (update
//      where user_id IS NULL and id IN demo ids, with check
//      user_id = auth.uid()), so claiming reassigns them — and their
//      completions, which are owned via the habit — to this user
//      instead of deleting them or duplicating them.
//   3. Only if the user still has no habits after claiming, seed the
//      demo habits FOR THIS USER (user_id = the signed-in user), with
//      past 'done' completions matching each habit's existing streak
//      (ending yesterday) plus today's done set (INITIAL_DONE).
// After seeding, a habit done today computes to its old static streak
// + 1, because today now counts — that is the streak engine working,
// not a bug. This is demo seed data, not real user history, and it
// never runs twice for the same user: a second sign-in finds the
// user's habits and stops at step 1.
// Migration caveat, stated plainly: anonymous habits created before
// auth with ids OUTSIDE the 6 demo ids cannot be auto-claimed (the
// app cannot know their ids, and the migration policy deliberately
// does not allow claiming arbitrary orphan rows). Those rows stay in
// the database, invisible under RLS, until a manual migration reassigns
// them — they are never deleted by this code.
const DEMO_HABIT_IDS = HABITS.map((h) => h.id);

export async function countUserHabits(userId: string): Promise<number> {
  const client = requireClient();
  const { count, error } = await client
    .from('habits')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);
  if (error) throw error;
  return count ?? 0;
}

// Best-effort claim of anonymous demo habits. Errors are swallowed on
// purpose: if the migration policy is not in place (e.g. the schema
// was not re-run), claiming simply does not happen and the caller
// falls through to seeding for this user — nothing is wiped.
export async function claimAnonymousDemoHabits(userId: string): Promise<void> {
  const client = requireClient();
  try {
    await client
      .from('habits')
      .update({ user_id: userId })
      .in('id', DEMO_HABIT_IDS)
      .is('user_id', null);
  } catch {
    // Claiming is best-effort only; see the merge rule above.
  }
}

export async function seedSupabaseDemoData(userId: string): Promise<boolean> {
  if (!userId) throw new Error('Sign in to seed habits.');
  const client = requireClient();
  if ((await countUserHabits(userId)) > 0) return false;

  const today = localToday();
  const habitRows = HABITS.map((h) => ({
    id: h.id,
    user_id: userId,
    name: h.name,
    icon: h.icon,
    color: h.color,
    slot: h.slot,
    target: h.target,
    reminder: h.reminder,
    schedule: DAILY_SCHEDULE,
  }));
  const { error: habitError } = await client.from('habits').insert(habitRows);
  if (habitError) throw habitError;

  const completionRows: { habit_id: string; date: string; status: 'done' }[] = [];
  for (const h of HABITS) {
    for (let i = h.streak; i >= 1; i--) {
      completionRows.push({ habit_id: h.id, date: addDays(today, -i), status: 'done' });
    }
    if (INITIAL_DONE.has(h.id)) {
      completionRows.push({ habit_id: h.id, date: today, status: 'done' });
    }
  }
  if (completionRows.length > 0) {
    const { error: completionError } = await client.from('completions').insert(completionRows);
    if (completionError) throw completionError;
  }
  return true;
}

// Full sign-in merge: existing → claim → seed. Returns what happened,
// so callers (and logs, which must never include the user id in a
// way that leaks it — this return value stays in memory only) can tell
// claimed/seeded apart without ever deleting data.
export async function ensureUserHabits(userId: string): Promise<'existing' | 'claimed' | 'seeded'> {
  if ((await countUserHabits(userId)) > 0) return 'existing';
  await claimAnonymousDemoHabits(userId);
  if ((await countUserHabits(userId)) > 0) return 'claimed';
  await seedSupabaseDemoData(userId);
  return 'seeded';
}

// ------------------------------------------------------------- routines
// STEP 7 (real Routine Run Mode): routines persist in Supabase when
// configured + signed in, exactly like habits. habit_ids is a JSON
// array of habit ids IN RUN ORDER. Routines never existed in Supabase
// before this step, so there is nothing to claim or migrate: if the
// signed-in user has no routines, seed the demo routines FOR that
// user; existing routines are never deleted or overwritten by seeding.
export interface DbRoutineRow {
  id: string;
  user_id: string;
  name: string;
  start_time: string;
  habit_ids: unknown;
  created_at: string;
}

export function parseHabitIds(value: unknown): string[] {
  let arr: unknown = value;
  if (typeof value === 'string') {
    try {
      arr = JSON.parse(value);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(arr)) return [];
  return arr.filter((x): x is string => typeof x === 'string');
}

export function rowToRoutine(row: DbRoutineRow): Routine {
  return {
    id: row.id,
    name: row.name,
    startTime: row.start_time,
    // percent is a display value, not stored: App/screens recompute it
    // from today's done set; 0 here is only a placeholder until then.
    percent: 0,
    habitIds: parseHabitIds(row.habit_ids),
  };
}

export async function loadRoutineRows(userId?: string): Promise<DbRoutineRow[]> {
  const client = requireClient();
  let query = client.from('routines').select('*').order('created_at', { ascending: true });
  if (userId) query = query.eq('user_id', userId);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as DbRoutineRow[];
}

export interface RoutineInput {
  id?: string; // absent = new routine (id generated here); present = edit
  name: string;
  startTime: string;
  habitIds: string[];
}

export async function upsertRoutine(input: RoutineInput, userId: string): Promise<DbRoutineRow> {
  if (!userId) throw new Error('Sign in to save routines.');
  const client = requireClient();
  const id = input.id ?? `r${Date.now()}`;
  const { data, error } = await client
    .from('routines')
    .upsert(
      {
        id,
        user_id: userId,
        name: input.name,
        start_time: input.startTime,
        habit_ids: input.habitIds,
      },
      { onConflict: 'id' },
    )
    .select()
    .single();
  if (error) throw error;
  return data as DbRoutineRow;
}

export async function ensureUserRoutines(userId: string): Promise<boolean> {
  const client = requireClient();
  const { count, error } = await client
    .from('routines')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);
  if (error) throw error;
  if ((count ?? 0) > 0) return false;
  const { error: insertError } = await client.from('routines').insert(
    ROUTINES.map((r) => ({
      id: r.id,
      user_id: userId,
      name: r.name,
      start_time: r.startTime,
      habit_ids: r.habitIds,
    })),
  );
  if (insertError) throw insertError;
  return true;
}

// ------------------------------------------------------ suggestion states
// STEP 7 (real Weekly Report): only per-user suggestion STATE is
// persisted (definitions stay static in src/data.ts). 'applied' and
// 'dismissed' are the only stored states; absence of a row = 'new'.
export interface DbSuggestionStateRow {
  user_id: string;
  suggestion_id: string;
  state: 'applied' | 'dismissed';
}

export async function loadSuggestionStates(userId: string): Promise<DbSuggestionStateRow[]> {
  const client = requireClient();
  const { data, error } = await client
    .from('suggestion_states')
    .select('user_id, suggestion_id, state')
    .eq('user_id', userId);
  if (error) throw error;
  return (data ?? []) as DbSuggestionStateRow[];
}

export async function setSuggestionState(
  userId: string,
  suggestionId: string,
  state: 'applied' | 'dismissed',
): Promise<void> {
  const client = requireClient();
  const { error } = await client
    .from('suggestion_states')
    .upsert(
      { user_id: userId, suggestion_id: suggestionId, state },
      { onConflict: 'user_id,suggestion_id' },
    );
  if (error) throw error;
}
