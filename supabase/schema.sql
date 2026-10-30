-- Smart Habit — Supabase schema (STEP 1: persistence + streak engine;
-- STEP 2: Supabase Auth).
--
-- How to apply: create a Supabase project, open its SQL editor, paste
-- this whole file, and run it. It is idempotent for the objects it
-- creates (IF NOT EXISTS / ON CONFLICT DO NOTHING where it matters),
-- but it does NOT seed any demo data: seeding is app-side first-run
-- logic (see src/supabase.ts ensureUserHabits), clearly labelled
-- as demo seed, and it only runs for a signed-in user with no habits.
-- If you already ran the STEP 1 version of this file, re-running this
-- version drops the temporary pre-auth policies and replaces them with
-- the authenticated policies below (the DROP POLICY lines do that).
--
-- Auth (STEP 2): every habit row belongs to exactly one signed-in
-- user (user_id = auth.uid()). Completions have no user_id of their
-- own; they are owned via their habit. The anon role gets NO policy
-- at all, so a configured-but-unsigned-in app reads nothing from
-- Supabase by design — the app falls back to static, session-only
-- data until the user signs in. Auth is optional in the app, but
-- Supabase rows are never anonymous in production.

-- ---------------------------------------------------------------- habits
create table if not exists public.habits (
  id text primary key,
  -- Nullable ONLY for pre-auth migration rows (demo habits created
  -- before auth existed). Every new row written by the app sets
  -- user_id = auth.uid() (see src/supabase.ts upsertHabit), and the
  -- RLS policies below reject rows owned by anyone else.
  user_id uuid null,
  name text not null,
  icon text not null default '✓',
  color text not null default '#2DD4BF',
  slot text not null default 'morning'
    check (slot in ('morning', 'afternoon', 'evening')),
  target text not null default '',
  reminder text not null default '',
  -- Scheduled weekdays as a JSON array of numbers, 0 = Sunday … 6 =
  -- Saturday (JavaScript getDay convention, same as src/streak.ts).
  -- Daily habits store [0,1,2,3,4,5,6].
  schedule jsonb not null default '[0,1,2,3,4,5,6]'::jsonb,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------ completions
-- One row per habit per day at most (unique constraint enforces the
-- "one completion record per habit per day" spec rule at the DB level).
-- status 'done' = completed at 100% of target (binary toggle; partial
-- amounts are a later step). status 'skip' = skipped in advance: the
-- streak engine (src/streak.ts) neither counts nor breaks on a skip.
create table if not exists public.completions (
  habit_id text not null references public.habits (id) on delete cascade,
  date text not null check (date ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'),
  status text not null check (status in ('done', 'skip')),
  created_at timestamptz not null default now(),
  primary key (habit_id, date)
);

create index if not exists completions_habit_id_idx
  on public.completions (habit_id);
create index if not exists completions_date_idx
  on public.completions (date);

-- ------------------------------------------------- Row Level Security
-- RLS is ON for both tables. Policies are user-scoped (STEP 2):
-- a user can only ever see or change their own rows. The old
-- temporary pre-auth anon policies are dropped first, so re-running
-- this file after STEP 1 removes them — never run production with
-- them in place (anyone with the anon key could read/write every row).
alter table public.habits enable row level security;
alter table public.completions enable row level security;

drop policy if exists "temporary pre-auth: anon full access" on public.habits;
drop policy if exists "temporary pre-auth: anon full access" on public.completions;

-- Habits: one policy per operation, all scoped to auth.uid().
drop policy if exists "habits: select own" on public.habits;
create policy "habits: select own"
  on public.habits for select to authenticated using (user_id = auth.uid());
drop policy if exists "habits: insert own" on public.habits;
create policy "habits: insert own"
  on public.habits for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "habits: update own" on public.habits;
create policy "habits: update own"
  on public.habits for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "habits: delete own" on public.habits;
create policy "habits: delete own"
  on public.habits for delete to authenticated using (user_id = auth.uid());

-- Completions: owned via their habit (no user_id column of their own).
drop policy if exists "completions: select own habits" on public.completions;
create policy "completions: select own habits"
  on public.completions for select to authenticated using (
    exists (select 1 from public.habits h where h.id = completions.habit_id and h.user_id = auth.uid())
  );
drop policy if exists "completions: insert own habits" on public.completions;
create policy "completions: insert own habits"
  on public.completions for insert to authenticated with check (
    exists (select 1 from public.habits h where h.id = completions.habit_id and h.user_id = auth.uid())
  );
drop policy if exists "completions: update own habits" on public.completions;
create policy "completions: update own habits"
  on public.completions for update to authenticated using (
    exists (select 1 from public.habits h where h.id = completions.habit_id and h.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.habits h where h.id = completions.habit_id and h.user_id = auth.uid())
  );
drop policy if exists "completions: delete own habits" on public.completions;
create policy "completions: delete own habits"
  on public.completions for delete to authenticated using (
    exists (select 1 from public.habits h where h.id = completions.habit_id and h.user_id = auth.uid())
  );

-- ------------------------------------------------------------- routines
-- STEP 7 (real Routine Run Mode): routines are user-owned, like habits.
-- habit_ids is a JSON array of habit ids IN RUN ORDER (e.g.
-- ["run","meditate","water"]) — a single array column, not a join table,
-- because a routine's steps are an ordered list owned by the routine
-- itself, and the app never queries routines by habit. start_time is
-- free text ("7:00 AM") matching the app's reminder format.
-- Routines never existed in Supabase before STEP 7 (they were static
-- in the app), so there are no anonymous routine rows to migrate:
-- on first sign-in the app seeds the demo routines FOR the user if
-- the user has none (see src/supabase.ts ensureUserRoutines), and
-- it never deletes existing routines on any path.
create table if not exists public.routines (
  id text primary key,
  user_id uuid not null,
  name text not null,
  start_time text not null default '',
  habit_ids jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.routines enable row level security;

drop policy if exists "routines: select own" on public.routines;
create policy "routines: select own"
  on public.routines for select to authenticated using (user_id = auth.uid());
drop policy if exists "routines: insert own" on public.routines;
create policy "routines: insert own"
  on public.routines for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "routines: update own" on public.routines;
create policy "routines: update own"
  on public.routines for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "routines: delete own" on public.routines;
create policy "routines: delete own"
  on public.routines for delete to authenticated using (user_id = auth.uid());

-- ------------------------------------------------------ suggestion states
-- STEP 7 (real Weekly Report): suggestion DEFINITIONS stay static in
-- the app (src/data.ts SUGGESTIONS); only each user's per-suggestion
-- STATE is persisted here, so an Applied/Dismissed suggestion stays
-- applied/dismissed across reloads for a signed-in user. Unconfigured
-- or unsigned-in users keep session-only states, exactly as before.
create table if not exists public.suggestion_states (
  user_id uuid not null,
  suggestion_id text not null,
  state text not null check (state in ('applied', 'dismissed')),
  created_at timestamptz not null default now(),
  primary key (user_id, suggestion_id)
);

alter table public.suggestion_states enable row level security;

drop policy if exists "suggestion_states: select own" on public.suggestion_states;
create policy "suggestion_states: select own"
  on public.suggestion_states for select to authenticated using (user_id = auth.uid());
drop policy if exists "suggestion_states: insert own" on public.suggestion_states;
create policy "suggestion_states: insert own"
  on public.suggestion_states for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "suggestion_states: update own" on public.suggestion_states;
create policy "suggestion_states: update own"
  on public.suggestion_states for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "suggestion_states: delete own" on public.suggestion_states;
create policy "suggestion_states: delete own"
  on public.suggestion_states for delete to authenticated using (user_id = auth.uid());

-- ------------------------------------------------- Migration: anonymous
-- demo habits (NOT a production default — read this before judging it).
-- Habits created before auth existed have user_id NULL. The app's
-- sign-in merge (src/supabase.ts ensureUserHabits) reassigns those
-- rows to the signing-in user instead of deleting or duplicating them.
-- That reassignment needs exactly one narrow exception: an
-- authenticated user may UPDATE a habit whose user_id is NULL *and*
-- whose id is one of the 6 known demo-seed ids, setting user_id to
-- their own id. It deliberately does NOT allow selecting, inserting,
-- or deleting anonymous rows, and it does NOT allow claiming arbitrary
-- orphan rows: anonymous habits created before auth with ids outside
-- the demo set cannot be auto-claimed (the app cannot know their ids)
-- and stay in the database, invisible under RLS, until a manual
-- migration reassigns them. They are never deleted by app code.
-- Review this policy after the migration period; once no anonymous
-- demo rows remain, drop it.
drop policy if exists "habits: migration claim anonymous demo habits" on public.habits;
create policy "habits: migration claim anonymous demo habits"
  on public.habits for update to authenticated
  using (user_id is null and id in ('water', 'run', 'read', 'meditate', 'journal', 'walk'))
  with check (user_id = auth.uid());
