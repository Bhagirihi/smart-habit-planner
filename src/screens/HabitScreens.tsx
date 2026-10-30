import React, { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { c, spacing, type } from '../theme';
import { Back, Btn, Card, Field, Heatmap, IconTile, Note, Row, Screen, Sub, Title } from '../components/ui';
import { tourMeasure } from '../components/Tooltip';
import { FREE_HABIT_LIMIT } from '../data';
import type { Habit } from '../theme';
import type { ScreenProps } from './props';

// STEP 8 (QA fix M3): habitById returns undefined when not found —
// NEVER the first habit, and never habits[0]! on an empty list (that
// crashed HabitDetail by reading properties off undefined). Callers
// must render an explicit not-found state instead.
function habitById(habits: Habit[], id: string) {
  return habits.find((h) => h.id === id);
}

function HabitNotFound({ nav, habitId }: { nav: ScreenProps['nav']; habitId: string }) {
  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Back label="‹ Back" onPress={nav.back} />
        <Title>Habit not found</Title>
        <Card>
          <Text style={{ color: c.ink, fontWeight: '700' }}>This habit does not exist{habitId ? ` (${habitId})` : ''}.</Text>
          <Text style={{ color: c.muted, marginTop: 4 }}>It may have been deleted, or the list may be empty. Go back to Today and pick a habit from there.</Text>
        </Card>
        <Btn label="Back to Today" onPress={() => nav.goTab('today')} />
      </ScrollView>
    </Screen>
  );
}

export function HabitDetail({ nav, ui }: ScreenProps) {
  const route = nav.route;
  const habitId = route.name === 'habitDetail' ? route.habitId : 'water';
  const h = habitById(ui.habits, habitId);
  if (!h) return <HabitNotFound nav={nav} habitId={habitId} />;
  const done = ui.done.has(h.id);
  const streak = ui.streaks[h.id] ?? h.streak;
  const bestStreak = ui.bestStreaks[h.id] ?? h.bestStreak;
  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Back label="‹ Back" onPress={nav.back} />
        <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: spacing.md }}>
          <IconTile icon={h.icon} color={h.color} />
          <View style={{ marginLeft: spacing.md }}>
            <Title>{h.name}</Title>
            <Text style={{ color: c.muted }}>🔥 {streak}-day streak · Best {bestStreak} days · {h.rate}% this month</Text>
          </View>
        </View>
        <Card><Text style={{ color: c.ink, fontWeight: '700', marginBottom: spacing.sm }}>Today: {done ? 'Done ✓' : 'Not done yet'}</Text><Text style={{ color: c.muted }}>Target: {h.target} · Reminder: {h.reminder}</Text><Btn label={done ? 'Undo today' : 'Mark done today'} onPress={() => ui.toggleDone(h.id)} /></Card>
        <Card><Text style={{ color: c.ink, fontWeight: '700', marginBottom: spacing.sm }}>Last 6 weeks — heatmap</Text><Heatmap color={h.color} habitId={h.id} /><Text style={{ color: c.muted, fontSize: type.small, marginTop: spacing.sm }}>Legend: full colour = done, green = partial, dark = scheduled-missed, faint = unscheduled/future.</Text></Card>
        <Card><Text style={{ color: c.ink, fontWeight: '700' }}>Weekly totals (static)</Text><Text style={{ color: c.muted, marginTop: 4 }}>Week 1: 5/7 · Week 2: 6/7 · Week 3: 4/7 · Week 4: 6/7</Text></Card>
        <Btn label="Edit habit" onPress={() => nav.push({ name: 'habitForm', habitId: h.id })} />
        <Note>Past dates are read-only in this UI preview.</Note>
      </ScrollView>
    </Screen>
  );
}

export function HabitForm({ nav, ui }: ScreenProps) {
  const route = nav.route;
  const existing = route.name === 'habitForm' && route.habitId ? habitById(ui.habits, route.habitId) : undefined;
  const [name, setName] = useState(existing?.name ?? '');
  const [target, setTarget] = useState(existing?.target ?? '');
  const [reminder, setReminder] = useState(existing?.reminder ?? '7:30 AM');
  const [slot, setSlot] = useState<string>(existing?.slot ?? 'morning');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  // STEP 8 (QA fix M3): editing a habit that does not exist is NOT a
  // new habit — show the not-found state instead of a blank Add form.
  // (Hooks above already ran, so this early return is safe.)
  if (route.name === 'habitForm' && route.habitId && !existing) {
    return <HabitNotFound nav={nav} habitId={route.habitId} />;
  }
  // Configured AND signed in: Save writes to Supabase, then returns to
  // Today. Otherwise today's behaviour is kept exactly — Save returns
  // to Today and persists nothing (session-only preview, or signed-out
  // session when Supabase is configured but no account is signed in).
  // STEP 3 free-limit gate (applies in preview AND configured modes):
  // creating a NEW habit while already at/over the free limit (5) and
  // not Premium opens the Paywall and blocks the save — the form stays
  // open behind the overlay, so no draft is lost. Editing an existing
  // habit is always allowed, and existing habits stay fully accessible.
  // Note: the demo seed already has 6 habits, so a free user hits this
  // gate on any new habit until Premium is active — that is the limit
  // working as specified, not a bug; trimming the seed to 5 is a
  // separate product decision.
  const overHabitLimit = !existing && ui.habits.length >= FREE_HABIT_LIMIT && !ui.isPremium;
  const onSave = async () => {
    if (overHabitLimit) { nav.openPaywall(); return; }
    if (!ui.supabaseConfigured || !ui.authUser) { nav.goTab('today'); return; }
    setSaving(true);
    setSaveError(null);
    try {
      await ui.saveHabit({
        id: existing?.id,
        name: name.trim() || 'Untitled habit',
        icon: existing?.icon ?? '✓',
        color: existing?.color ?? c.primary,
        slot: (slot === 'afternoon' || slot === 'evening' ? slot : 'morning') as 'morning' | 'afternoon' | 'evening',
        target,
        reminder,
      });
      nav.goTab('today');
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Save failed.');
    } finally {
      setSaving(false);
    }
  };
  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Back label="‹ Back" onPress={nav.back} />
        <Title>{existing ? 'Edit habit' : 'Add habit'}</Title>
        <Sub>{ui.supabaseConfigured && ui.authUser ? 'Save writes this habit to Supabase.' : ui.supabaseConfigured ? 'Sign in to save this habit — otherwise Save returns to Today and persists nothing.' : 'UI preview only — Save returns to Today and does not persist anything.'}</Sub>
        {overHabitLimit && <Note>Free tier allows {FREE_HABIT_LIMIT} habits — you already have {ui.habits.length}. Upgrade to Premium to add another habit.</Note>}
        {saveError && <Note>{saveError} — your change was not saved. Check the Supabase setup in README, then try again.</Note>}
        <Field label="Habit name" value={name} onChange={setName} placeholder="e.g. Drink water" />
        <Field label="Target" value={target} onChange={setTarget} placeholder="e.g. 8 glasses" />
        <Field label="Reminder time" value={reminder} onChange={setReminder} placeholder="7:30 AM" />
        <Text style={{ color: c.ink, fontWeight: '700', marginBottom: spacing.sm }}>Time slot</Text>
        {(['morning', 'afternoon', 'evening'] as const).map((s) => (
          <Pressable key={s} onPress={() => setSlot(s)} style={{ minHeight: 48, backgroundColor: slot === s ? c.tonal : c.surface, borderColor: slot === s ? c.primary : c.border, borderWidth: 1, borderRadius: 12, padding: spacing.md, marginBottom: spacing.sm, justifyContent: 'center' }}>
            <Text style={{ color: c.ink }}>{slot === s ? '● ' : '○ '}{s === 'morning' ? 'Morning (6:00 - 9:00 AM)' : s === 'afternoon' ? 'Afternoon (12:00 - 3:00 PM)' : 'Evening (6:00 - 9:00 PM)'}</Text>
          </Pressable>
        ))}
        <Row><Text style={{ color: c.ink }}>Icon preview</Text><IconTile icon={existing?.icon ?? '✓'} color={existing?.color ?? c.primary} /></Row>
        <Btn label={saving ? 'Saving…' : ui.supabaseConfigured && ui.authUser ? 'Save' : 'Save (UI preview)'} onPress={onSave} />
        <Btn label="Upgrade to Premium — see paywall" ghost onPress={nav.openPaywall} />
      </ScrollView>
    </Screen>
  );
}

export function HabitsGrid({ nav, ui }: ScreenProps) {
  const firstRef = useRef<any>(null);
  useEffect(() => {
    ui.registerTourTarget('grid-first', tourMeasure(firstRef));
    return () => ui.unregisterTourTarget('grid-first');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Back label="‹ Back" onPress={nav.back} />
        <Title>Habits Grid</Title>
        <Sub>One card per habit, with a last-6-months heatmap. Tap a card for detail.</Sub>
        {ui.habits.length === 0 && (
          <Card>
            <Text style={{ color: c.ink, fontWeight: '700' }}>No habits yet.</Text>
            <Text style={{ color: c.muted, marginTop: 4 }}>Add your first habit from Today or the + button, then it will appear here.</Text>
            <Btn label="Add habit" onPress={() => nav.push({ name: 'habitForm' })} />
          </Card>
        )}
        {ui.habits.map((h, i) => (
          <View key={h.id} ref={i === 0 ? firstRef : undefined} collapsable={false}>
          <Pressable onPress={() => nav.push({ name: 'habitDetail', habitId: h.id })}>
            <Card>
              <Row><View style={{ flexDirection: 'row', alignItems: 'center' }}><IconTile icon={h.icon} color={h.color} /><Text style={{ color: c.ink, fontWeight: '700', marginLeft: spacing.md }}>{h.name}</Text></View><Text style={{ color: c.amber, fontWeight: '700' }}>🔥 {ui.streaks[h.id] ?? h.streak}</Text></Row>
              <View style={{ marginTop: spacing.md }}><Heatmap color={h.color} habitId={h.id} cells={42} /></View>
              <Text style={{ color: c.muted, fontSize: type.small, marginTop: spacing.sm }}>{h.rate}% this month · Best {ui.bestStreaks[h.id] ?? h.bestStreak} days</Text>
            </Card>
          </Pressable>
          </View>
        ))}
      </ScrollView>
    </Screen>
  );
}
