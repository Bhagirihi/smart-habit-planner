import React, { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useStore } from '../store';
import { spacing, type, type Palette } from '../theme';
import { useTheme } from '../useTheme';
import { Card, Chip, EmptyState, GhostButton, PrimaryButton } from '../components/ui';
import { HabitRow } from '../components/HabitRow';
import type { Nav } from '../navigation';
import { FREE_ROUTINE_LIMIT } from '../types';
import { formatTime12h, todayKey } from '../lib/dates';
import { newId } from '../lib/seed';

/** Routines list. Detail and form are separate routes handled below in the same file. */
export function RoutinesList({ nav }: { nav: Nav }): React.JSX.Element {
  const c = useTheme();
  const styles = useMemo(() => makeStyles(c), [c]);
  const { state } = useStore();
  const today = todayKey();
  return (
    <ScrollView contentContainerStyle={styles.wrap}>
      <Text style={styles.hero}>Routines</Text>
      <Text style={styles.body}>Bundle habits into one flow, for example a morning routine, and run it step by step.</Text>
      {state.routines.length === 0 ? (
        <EmptyState
          title="No routine yet"
          detail="A routine is just your habits in order. Create one, then tap Start to run it one habit at a time."
          actionLabel="Create your first routine"
          onAction={() => nav.push({ name: 'routineForm' })}
        />
      ) : (
        state.routines.map((r) => {
          const habits = r.habitIds.map((id) => state.habits.find((h) => h.id === id)).filter((h) => h !== undefined);
          const done = habits.filter((h) => state.checkIns[`${h.id}|${today}`] !== undefined).length;
          return (
            <Card key={r.id}>
              <View style={styles.titleRow}>
                <View style={[styles.accentDot, { backgroundColor: habits[0]?.color ?? c.primary }]} />
                <Text style={[styles.cardTitle, { flex: 1 }]}>{r.name}</Text>
              </View>
              <Text style={styles.cardBody}>{formatTime12h(r.startTime)} · {habits.length} habits · {done} done today</Text>
              <View style={styles.btnRow}>
                <PrimaryButton label="Open routine" onPress={() => nav.push({ name: 'routineDetail', routineId: r.id })} />
                <GhostButton label="Edit" onPress={() => nav.push({ name: 'routineForm', routineId: r.id })} />
              </View>
            </Card>
          );
        })
      )}
      <PrimaryButton label="Create routine" onPress={() => nav.push({ name: 'routineForm' })} />
      <Text style={styles.note}>Free plan allows {FREE_ROUTINE_LIMIT} routine. Premium unlocks unlimited routines.</Text>
    </ScrollView>
  );
}

export function RoutineDetail({ nav, routineId }: { nav: Nav; routineId: string }): React.JSX.Element {
  const c = useTheme();
  const styles = useMemo(() => makeStyles(c), [c]);
  const { state, toggleDone, deleteRoutine } = useStore();
  const routine = state.routines.find((r) => r.id === routineId);
  const [runIndex, setRunIndex] = useState<number | null>(null);
  const [finished, setFinished] = useState(false);
  const today = todayKey();

  if (!routine) {
    return (
      <View style={styles.wrap}>
        <Text style={styles.hero}>Routine not found</Text>
        <GhostButton label="Back" onPress={nav.pop} />
      </View>
    );
  }
  const habits = routine.habitIds.map((id) => state.habits.find((h) => h.id === id)).filter((h) => h !== undefined);

  if (finished) {
    return (
      <View style={styles.wrap}>
        <Card>
          <Text style={styles.hero}>Routine complete</Text>
          <Text style={styles.body}>{routine.name} is done. Every habit in it is now marked done on Today, so there is no double counting.</Text>
        </Card>
        <PrimaryButton label="Back to Today" onPress={() => nav.goTab('today')} />
        <GhostButton label="Back to routines" onPress={nav.pop} />
      </View>
    );
  }

  if (runIndex !== null) {
    const habit = habits[runIndex];
    if (!habit) {
      return (
        <View style={styles.wrap}>
          <Text style={styles.body}>This routine has no habits yet. Add some from Edit.</Text>
          <GhostButton label="Back" onPress={() => setRunIndex(null)} />
        </View>
      );
    }
    const isLast = runIndex === habits.length - 1;
    return (
      <View style={styles.wrap}>
        <Text style={styles.meta}>Step {runIndex + 1} of {habits.length} · {routine.name}</Text>
        <HabitRow habit={habit} date={today} checkIns={state.checkIns} onToggle={() => toggleDone(habit, today)} onOpen={() => nav.push({ name: 'habitDetail', habitId: habit.id })} />
        <Text style={styles.body}>Do this habit, tap its circle to mark it done, then move on.</Text>
        <PrimaryButton
          label={isLast ? 'Finish routine' : 'Next habit'}
          onPress={() => {
            if (isLast) {
              setFinished(true);
              setRunIndex(null);
            } else setRunIndex(runIndex + 1);
          }}
        />
        <GhostButton label="Exit run mode" onPress={() => setRunIndex(null)} />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.wrap}>
      <Text style={styles.hero}>{routine.name}</Text>
      <Text style={styles.body}>Starts at {formatTime12h(routine.startTime)} · {habits.length} habits</Text>
      {habits.length === 0 ? (
        <EmptyState title="No habits in this routine" detail="Edit the routine and pick the habits that belong in this flow, in order." actionLabel="Edit routine" onAction={() => nav.push({ name: 'routineForm', routineId: routine.id })} />
      ) : (
        <View style={styles.list}>
          {habits.map((h) => (
            <HabitRow key={h.id} habit={h} date={today} checkIns={state.checkIns} onToggle={() => toggleDone(h, today)} onOpen={() => nav.push({ name: 'habitDetail', habitId: h.id })} />
          ))}
        </View>
      )}
      <PrimaryButton label="Start routine" onPress={() => setRunIndex(0)} />
      <GhostButton label="Edit routine" onPress={() => nav.push({ name: 'routineForm', routineId: routine.id })} />
      <GhostButton
        label="Delete routine"
        onPress={() =>
          Alert.alert('Delete routine?', 'The routine will be deleted, but its habits stay.', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: () => { deleteRoutine(routine.id); nav.pop(); } },
          ])
        }
      />
    </ScrollView>
  );
}

export function RoutineForm({ nav, routineId }: { nav: Nav; routineId?: string }): React.JSX.Element {
  const c = useTheme();
  const styles = useMemo(() => makeStyles(c), [c]);
  const { state, addRoutine, updateRoutine, isPremium } = useStore();
  const existing = routineId ? state.routines.find((r) => r.id === routineId) : undefined;
  const [name, setName] = useState(existing?.name ?? '');
  const [startTime, setStartTime] = useState(existing?.startTime ?? '07:00');
  const [picked, setPicked] = useState<string[]>(existing?.habitIds ?? []);
  const [error, setError] = useState('');

  function move(id: string, dir: -1 | 1) {
    setPicked((prev) => {
      const idx = prev.indexOf(id);
      const next = [...prev];
      const swap = idx + dir;
      if (idx < 0 || swap < 0 || swap >= next.length) return prev;
      [next[idx], next[swap]] = [next[swap], next[idx]];
      return next;
    });
  }

  function save() {
    if (!name.trim()) {
      setError('Please enter a routine name.');
      return;
    }
    if (!existing && !isPremium && state.routines.length >= FREE_ROUTINE_LIMIT) {
      nav.openPaywall();
      return;
    }
    const routine = { id: existing?.id ?? newId('routine'), name: name.trim(), startTime, habitIds: picked, createdAt: existing?.createdAt ?? todayKey() };
    if (existing) updateRoutine(routine);
    else addRoutine(routine);
    nav.pop();
  }

  return (
    <ScrollView contentContainerStyle={styles.wrap}>
      <Text style={styles.hero}>{existing ? 'Edit routine' : 'New routine'}</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Text style={styles.label}>Routine name</Text>
      <TextInput style={styles.input} placeholder="e.g. Morning Routine" placeholderTextColor={c.muted} value={name} onChangeText={setName} maxLength={60} />
      <Text style={styles.label}>Start time</Text>
      <View style={styles.chips}>
        {['06:00', '06:30', '07:00', '07:30', '08:00', '21:00'].map((t) => (
          <Chip key={t} label={t} selected={startTime === t} onPress={() => setStartTime(t)} />
        ))}
      </View>
      <Text style={styles.label}>Habits, in order (tap to add, use up/down to reorder)</Text>
      {state.habits.length === 0 ? (
        <EmptyState title="No habits yet" detail="Create a habit first, then come back here to add it to a routine." actionLabel="Add a habit" onAction={() => nav.push({ name: 'habitForm' })} />
      ) : (
        state.habits.map((h) => {
          const on = picked.includes(h.id);
          const pos = picked.indexOf(h.id);
          return (
            <Card key={h.id}>
              <View style={styles.pickRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{on ? `${pos + 1}. ${h.name}` : h.name}</Text>
                  <Text style={styles.cardBody}>{h.slot}</Text>
                </View>
                {on ? (
                  <View style={styles.btnRow}>
                    <GhostButton label="↑" onPress={() => move(h.id, -1)} />
                    <GhostButton label="↓" onPress={() => move(h.id, 1)} />
                    <GhostButton label="Remove" onPress={() => setPicked((p) => p.filter((x) => x !== h.id))} />
                  </View>
                ) : (
                  <GhostButton label="Add" onPress={() => setPicked((p) => [...p, h.id])} />
                )}
              </View>
            </Card>
          );
        })
      )}
      <PrimaryButton label={existing ? 'Save changes' : 'Create routine'} onPress={save} />
      <GhostButton label="Cancel" onPress={nav.pop} />
    </ScrollView>
  );
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
    wrap: { flexGrow: 1, padding: spacing.lg, gap: 14, backgroundColor: c.bg },
    hero: { fontSize: type.title, fontWeight: '800', color: c.ink },
    body: { fontSize: type.body, color: c.muted, lineHeight: 22 },
    meta: { fontSize: type.small, color: c.muted, fontWeight: '700' },
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    accentDot: { width: 14, height: 14, borderRadius: 7 },
    cardTitle: { fontSize: type.subtitle, fontWeight: '700', color: c.ink },
    cardBody: { fontSize: type.body, color: c.muted, marginTop: 4 },
    btnRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
    list: { gap: 10 },
    note: { fontSize: type.small, color: c.muted, lineHeight: 19 },
    label: { fontSize: type.body, fontWeight: '700', color: c.ink, marginTop: 8 },
    input: { borderWidth: 1, borderColor: c.border, borderRadius: 12, minHeight: 52, paddingHorizontal: 12, fontSize: type.body, backgroundColor: c.surface, color: c.ink },
    chips: { flexDirection: 'row', flexWrap: 'wrap' },
    pickRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    error: { fontSize: type.body, color: c.red, fontWeight: '700' },
  });
}
