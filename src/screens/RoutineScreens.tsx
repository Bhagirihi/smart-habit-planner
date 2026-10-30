import React, { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { c, spacing, type } from '../theme';
import { Back, Btn, Card, Field, Note, Row, Screen, Sub, Title } from '../components/ui';
import { tourMeasure } from '../components/Tooltip';
import { FREE_ROUTINE_LIMIT } from '../data';
import type { Routine } from '../theme';
import type { ScreenProps } from './props';

// STEP 8 (QA fix M3, same bug class as habitById): return undefined
// when not found — never the first routine, never routines[0]! on an
// empty list. Callers render an explicit not-found state instead.
function routineById(id: string, routines: Routine[]) {
  return routines.find((r) => r.id === id);
}

// STEP 7: a routine's percent is computed from today's real done set,
// never from a stored/static percent. A routine with no steps is 0%.
export function routinePercent(r: Routine, done: Set<string>): number {
  if (r.habitIds.length === 0) return 0;
  const doneSteps = r.habitIds.filter((id) => done.has(id)).length;
  return Math.round((doneSteps / r.habitIds.length) * 100);
}

export function Routines({ nav, ui }: ScreenProps) {
  const firstRef = useRef<any>(null);
  useEffect(() => {
    ui.registerTourTarget('routines-first', tourMeasure(firstRef));
    return () => ui.unregisterTourTarget('routines-first');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const savedNote = ui.supabaseConfigured && ui.authUser
    ? 'Routines are saved to Supabase for your account and survive reloads.'
    : 'Routines are session-only until Supabase is configured and you sign in — then they save to your account.';
  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Title>Routines</Title>
        <Sub>Named, ordered habit sequences. Tap one to run it step by step.</Sub>
        {ui.routines.map((r, i) => {
          const pct = routinePercent(r, ui.done);
          return (
            <View key={r.id} ref={i === 0 ? firstRef : undefined} collapsable={false}>
            <Pressable onPress={() => nav.push({ name: 'routineDetail', routineId: r.id })}>
              <Card>
                <Row><Text style={{ color: c.ink, fontWeight: '700', fontSize: type.subtitle }}>{r.name}</Text><Text style={{ color: c.primary, fontWeight: '700' }}>{pct}%</Text></Row>
                <Text style={{ color: c.muted, marginTop: 4 }}>Starts {r.startTime} · {r.habitIds.length} habits · {r.habitIds.filter((id) => ui.done.has(id)).length} done today</Text>
                <View style={{ height: 8, backgroundColor: c.surfaceAlt, borderRadius: 4, marginTop: spacing.md }}><View style={{ width: `${pct}%`, height: 8, backgroundColor: c.primary, borderRadius: 4 }} /></View>
              </Card>
            </Pressable>
            </View>
          );
        })}
        <Btn label="Create routine" onPress={() => nav.push({ name: 'routineForm' })} />
        <Note>Free tier allows {FREE_ROUTINE_LIMIT} routine — a new routine beyond that opens the paywall unless Premium is active. {savedNote}</Note>
      </ScrollView>
    </Screen>
  );
}

export function RoutineDetail({ nav, ui }: ScreenProps) {
  const route = nav.route;
  const routineId = route.name === 'routineDetail' ? route.routineId : 'morning';
  const r = routineById(routineId, ui.routines);
  if (!r) {
    return (
      <Screen>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Back label="‹ Back" onPress={nav.back} />
          <Title>Routine not found</Title>
          <Card>
            <Text style={{ color: c.ink, fontWeight: '700' }}>This routine does not exist ({routineId}).</Text>
            <Text style={{ color: c.muted, marginTop: 4 }}>It may have been deleted, or the list may be empty. Go back to Routines and pick one from there.</Text>
          </Card>
          <Btn label="Back to Routines" onPress={() => nav.goTab('routines')} />
        </ScrollView>
      </Screen>
    );
  }
  const steps = r.habitIds.map((id) => ui.habits.find((h) => h.id === id)!).filter(Boolean);
  // STEP 7: per-routine run step — this routine's progress only. Other
  // routines' steps are untouched, and leaving/returning resumes here.
  const runStep = ui.runSteps[r.id] ?? 0;
  const step = steps[Math.min(runStep, Math.max(0, steps.length - 1))];
  const finished = steps.length > 0 && runStep >= steps.length;
  const doneSteps = steps.filter((s) => ui.done.has(s.id)).length;
  // Mark the current step's habit done for real (via the same toggle
  // path as Today, so streaks, the widget snapshot, and notifications
  // state all update consistently), then advance ONLY this routine.
  // If the habit is already done today, just advance — never undo it.
  const onStepDone = () => {
    if (!step) return;
    if (!ui.done.has(step.id)) ui.toggleDone(step.id);
    ui.setRunStepFor(r.id, runStep + 1);
  };
  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Back label="‹ Back" onPress={nav.back} />
        <Title>{r.name}</Title>
        <Sub>Starts {r.startTime} · {routinePercent(r, ui.done)}% complete today · Run Mode, step by step.</Sub>
        <Card>
          <Text style={{ color: c.ink, fontWeight: '700' }}>{steps.length === 0 ? 'This routine has no steps yet — edit it to add habits.' : finished ? 'Run complete 🎉' : `Step ${runStep + 1} of ${steps.length}`}</Text>
          {!finished && step && (
            <View style={{ marginTop: spacing.md }}>
              <Text style={{ fontSize: 32 }}>{step.icon}</Text>
              <Text style={{ color: c.ink, fontSize: type.subtitle, fontWeight: '700', marginTop: spacing.sm }}>{step.name}</Text>
              <Text style={{ color: c.muted }}>{step.target} · {step.reminder}</Text>
              <Text style={{ color: ui.done.has(step.id) ? c.accent : c.muted, marginTop: spacing.sm, fontWeight: '700' }}>
                {ui.done.has(step.id) ? '✓ Already done today — tap Next to continue.' : 'Not done yet today.'}
              </Text>
              <Btn label={ui.done.has(step.id) ? 'Next step →' : 'Mark step done → Next'} onPress={onStepDone} />
            </View>
          )}
          {finished && (
            <View style={{ marginTop: spacing.md }}>
              <Text style={{ color: c.ink, fontSize: type.subtitle, fontWeight: '800' }}>{doneSteps} of {steps.length} steps done today</Text>
              <Text style={{ color: c.muted, marginTop: spacing.sm }}>
                {steps.filter((s) => ui.done.has(s.id)).map((s) => s.name).join(' · ') || 'No steps were marked done.'}
              </Text>
              <Text style={{ color: c.muted, marginTop: spacing.sm }}>Completing a step marks that habit done for today — it counts toward its streak and today's total, just like checking it off on Today.</Text>
              <Btn label="Restart run" onPress={() => ui.setRunStepFor(r.id, 0)} />
            </View>
          )}
        </Card>
        <Text style={{ color: c.ink, fontWeight: '700', marginBottom: spacing.sm }}>All steps</Text>
        {steps.map((s, i) => (
          <Card key={s.id}><Text style={{ color: c.ink }}>{i + 1}. {s.icon} {s.name} — {ui.done.has(s.id) ? '✓ Done today' : i < runStep ? 'Marked in this run' : 'Pending'}</Text></Card>
        ))}
        <Btn label="Edit routine" onPress={() => nav.push({ name: 'routineForm', routineId: r.id })} />
      </ScrollView>
    </Screen>
  );
}

export function RoutineForm({ nav, ui }: ScreenProps) {
  const route = nav.route;
  const existing = route.name === 'routineForm' && route.routineId
    ? ui.routines.find((r) => r.id === route.routineId)
    : undefined;
  const [name, setName] = useState(existing?.name ?? '');
  const [time, setTime] = useState(existing?.startTime ?? '7:00 AM');
  // Selected habits IN TAP ORDER: tapping a habit appends it (or
  // removes it if already selected). New routines start with the
  // first 3 habits selected, matching the old preview's list.
  const [selected, setSelected] = useState<string[]>(
    existing?.habitIds ?? ui.habits.slice(0, 3).map((h) => h.id),
  );
  const [saveError, setSaveError] = useState<string | null>(null);
  // STEP 3 free-limit gate (same rule as habits): creating a NEW
  // routine while already at/over the free limit (1) and not Premium
  // opens the Paywall and blocks the save — the form stays open
  // behind the overlay, so no draft is lost. Editing an existing
  // routine is always allowed, and existing routines stay accessible.
  // The count here is the REAL routine list (ui.routines), not the
  // old static list.
  const overRoutineLimit = !existing && ui.routines.length >= FREE_ROUTINE_LIMIT && !ui.isPremium;
  const onSaveRoutine = async () => {
    setSaveError(null);
    if (overRoutineLimit) { nav.openPaywall(); return; }
    if (selected.length === 0) {
      setSaveError('Pick at least one habit for this routine.');
      return;
    }
    if (!name.trim()) {
      setSaveError('Give this routine a name.');
      return;
    }
    try {
      await ui.saveRoutine({
        id: existing?.id,
        name: name.trim(),
        startTime: time.trim(),
        habitIds: selected,
      });
      nav.goTab('routines');
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Routine save failed.');
    }
  };
  const savedNote = ui.supabaseConfigured && ui.authUser
    ? 'Save writes this routine to Supabase for your account.'
    : 'Save keeps this routine for this session only — sign in with Supabase configured to save it to your account.';
  const toggleHabit = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };
  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Back label="‹ Back" onPress={nav.back} />
        <Title>{existing ? 'Edit routine' : 'Create routine'}</Title>
        <Sub>{savedNote}</Sub>
        {overRoutineLimit && <Note>Free tier allows {FREE_ROUTINE_LIMIT} routine — you already have {ui.routines.length}. Upgrade to Premium to create another routine.</Note>}
        {saveError && <Note>{saveError}</Note>}
        <Field label="Routine name" value={name} onChange={setName} placeholder="e.g. Morning routine" />
        <Field label="Start time" value={time} onChange={setTime} placeholder="7:00 AM" />
        <Text style={{ color: c.ink, fontWeight: '700', marginBottom: spacing.sm }}>Habits in this routine (tap to add/remove — order is tap order)</Text>
        {ui.habits.map((h) => {
          const idx = selected.indexOf(h.id);
          return (
            <Pressable key={h.id} onPress={() => toggleHabit(h.id)} style={{ minHeight: 48, backgroundColor: idx >= 0 ? c.tonal : c.surface, borderColor: idx >= 0 ? c.primary : c.border, borderWidth: 1, borderRadius: 12, padding: spacing.md, marginBottom: spacing.sm, justifyContent: 'center' }}>
              <Text style={{ color: c.ink }}>{idx >= 0 ? `${idx + 1}. ` : '○ '}{h.icon} {h.name}</Text>
            </Pressable>
          );
        })}
        <Btn label="Save routine" onPress={onSaveRoutine} />
      </ScrollView>
    </Screen>
  );
}
