import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, ErrorBanner, GhostButton, PrimaryButton, ProgressBar, SecondaryButton } from '../components/ui';
import { IconTile } from '../components/IconTile';
import { todayKey } from '../lib/dates';
import type { Nav } from '../navigation';
import { completionFor, isDone, isScheduledOn } from '../services/streaks';
import { useStore } from '../store';
import { c, spacing, type } from '../theme';
import type { Habit } from '../types';

export default function RoutineDetail({ nav }: { nav: Nav }) {
  const { ready, loadError, routines, habits, completions, toggleDone, setMeasurableValue, setStatus } =
    useStore();
  const [runMode, setRunMode] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [runComplete, setRunComplete] = useState(false);
  const today = todayKey();

  const routineId = nav.route.name === 'routineDetail' ? nav.route.routineId : undefined;
  const routine = routineId ? routines.find((r) => r.id === routineId) : undefined;
  const ordered: Habit[] = useMemo(() => {
    if (!routine) return [];
    return routine.habitIds
      .map((id) => habits.find((h) => h.id === id))
      .filter((h): h is Habit => h !== undefined);
  }, [routine, habits]);

  const scheduledToday = ordered.filter((h) => isScheduledOn(h, today));
  const doneToday = scheduledToday.filter((h) => isDone(h, completionFor(h.id, today, completions))).length;
  const pct = scheduledToday.length > 0 ? Math.round((doneToday / scheduledToday.length) * 100) : 0;

  function startRun(): void {
    setStepIndex(0);
    setRunComplete(false);
    setRunMode(true);
  }

  function exitRun(): void {
    setRunMode(false);
    setRunComplete(false);
    setStepIndex(0);
  }

  function markDone(h: Habit): void {
    if (h.type === 'measurable') {
      setMeasurableValue(h.id, today, h.target);
    } else {
      toggleDone(h.id, today);
    }
  }

  function nextStep(): void {
    if (stepIndex >= ordered.length - 1) {
      setRunComplete(true);
    } else {
      setStepIndex(stepIndex + 1);
    }
  }

  function controlFor(h: Habit): React.ReactNode {
    const comp = completionFor(h.id, today, completions);
    const done = isDone(h, comp);
    const skipped = comp?.status === 'skipped';
    if (done) {
      return (
        <View style={s.controls}>
          <Text style={s.doneLabel}>Done</Text>
          <Pressable style={s.smallBtn} onPress={() => toggleDone(h.id, today)} accessibilityRole="button">
            <Text style={s.smallBtnText}>Undo</Text>
          </Pressable>
        </View>
      );
    }
    if (h.type === 'measurable') {
      const value = comp?.value ?? 0;
      return (
        <View style={s.controls}>
          <Text style={s.meta}>
            {value} of {h.target} {h.unit}
          </Text>
          <Pressable
            style={s.smallBtn}
            onPress={() => setMeasurableValue(h.id, today, value + 1)}
            accessibilityRole="button"
          >
            <Text style={s.smallBtnText}>Add 1</Text>
          </Pressable>
          <Pressable style={s.smallBtn} onPress={() => markDone(h)} accessibilityRole="button">
            <Text style={s.smallBtnText}>Done</Text>
          </Pressable>
          {!skipped ? (
            <Pressable
              style={s.smallBtn}
              onPress={() => setStatus(h.id, today, 'skipped')}
              accessibilityRole="button"
            >
              <Text style={s.smallBtnText}>Skip</Text>
            </Pressable>
          ) : (
            <Text style={s.meta}>Skipped</Text>
          )}
        </View>
      );
    }
    return (
      <View style={s.controls}>
        {skipped ? (
          <Text style={s.meta}>Skipped</Text>
        ) : (
          <>
            <Pressable style={s.smallBtn} onPress={() => markDone(h)} accessibilityRole="button">
              <Text style={s.smallBtnText}>Done</Text>
            </Pressable>
            <Pressable
              style={s.smallBtn}
              onPress={() => setStatus(h.id, today, 'skipped')}
              accessibilityRole="button"
            >
              <Text style={s.smallBtnText}>Skip</Text>
            </Pressable>
          </>
        )}
      </View>
    );
  }

  const current = ordered[Math.min(stepIndex, Math.max(ordered.length - 1, 0))];

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.content}>
        <GhostButton label="Back" onPress={() => nav.back()} />
        <ErrorBanner message={loadError} />
        {!ready ? (
          <Card>
            <Text style={s.body}>Loading routine…</Text>
          </Card>
        ) : !routine ? (
          <Card>
            <Text style={s.name}>Routine not found</Text>
            <Text style={s.body}>This routine may have been deleted.</Text>
          </Card>
        ) : runMode ? (
          <Card>
            {runComplete ? (
              <>
                <Text style={s.name}>Routine complete</Text>
                <Text style={s.body}>{routine.name}</Text>
                <Text style={s.body}>
                  {doneToday} of {scheduledToday.length} scheduled habits done today.
                </Text>
                <PrimaryButton label="Done" onPress={exitRun} />
              </>
            ) : current ? (
              <>
                <Text style={s.meta}>
                  Step {stepIndex + 1} of {ordered.length}
                </Text>
                <View style={s.iconRow}>
                  <IconTile icon={current.icon} color={current.color} size={44} />
                  <Text style={[s.name, { flex: 1 }]}>{current.name}</Text>
                </View>
                {isDone(current, completionFor(current.id, today, completions)) ? (
                  <Text style={s.body}>Already done today. You can move on.</Text>
                ) : (
                  <Text style={s.body}>Complete this habit, skip it, or move on.</Text>
                )}
                <View style={s.actions}>
                  <SecondaryButton
                    label="Done"
                    onPress={() => {
                      if (!isDone(current, completionFor(current.id, today, completions))) {
                        markDone(current);
                      }
                    }}
                  />
                  <SecondaryButton
                    label="Skip"
                    onPress={() => setStatus(current.id, today, 'skipped')}
                  />
                  <PrimaryButton label={stepIndex >= ordered.length - 1 ? 'Finish' : 'Next'} onPress={nextStep} />
                </View>
                <GhostButton label="Exit run mode" onPress={exitRun} />
              </>
            ) : (
              <>
                <Text style={s.name}>Nothing to run</Text>
                <Text style={s.body}>This routine has no habits yet.</Text>
                <PrimaryButton label="Exit run mode" onPress={exitRun} />
              </>
            )}
          </Card>
        ) : (
          <>
            <Text style={s.title}>{routine.name}</Text>
            <Text style={s.meta}>Starts {routine.startTime}</Text>
            <Card>
              <Text style={s.meta}>
                Today: {doneToday} of {scheduledToday.length} scheduled habits done
              </Text>
              <ProgressBar pct={pct} />
            </Card>
            <SecondaryButton
              label={ordered.length > 0 ? 'Start run mode' : 'Run mode (no habits yet)'}
              onPress={() => {
                if (ordered.length > 0) startRun();
              }}
            />
            <PrimaryButton
              label="Edit routine"
              onPress={() => nav.push({ name: 'routineForm', routineId: routine.id })}
            />
            {ordered.length === 0 ? (
              <Card>
                <Text style={s.body}>No habits in this routine yet. Edit the routine to add some.</Text>
              </Card>
            ) : (
              ordered.map((h) => (
                <Card key={h.id}>
                  <Pressable
                    onPress={() => nav.push({ name: 'habitDetail', habitId: h.id })}
                    accessibilityRole="button"
                  >
                    <View style={s.iconRow}>
                      <IconTile icon={h.icon} color={h.color} size={40} />
                      <Text style={[s.name, { flex: 1 }]}>{h.name}</Text>
                    </View>
                    <Text style={s.meta}>
                      {h.type === 'measurable' ? `${h.target} ${h.unit}` : h.timeSlot}
                    </Text>
                  </Pressable>
                  {controlFor(h)}
                </Card>
              ))
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: c.bg },
  content: { padding: spacing.lg, gap: spacing.lg },
  title: { fontSize: type.title, fontWeight: '600', color: c.ink },
  iconRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  name: { fontSize: type.subtitle, fontWeight: '600', color: c.ink },
  meta: { fontSize: type.body, color: c.muted },
  body: { fontSize: type.body, color: c.muted, lineHeight: 20 },
  controls: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.sm },
  doneLabel: { fontSize: type.label, fontWeight: '600', color: c.accent },
  smallBtn: {
    minHeight: 48,
    minWidth: 64,
    borderRadius: 12,
    backgroundColor: c.surfaceTonal,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  smallBtnText: { fontSize: type.label, fontWeight: '600', color: c.ink },
  actions: { gap: spacing.sm, marginTop: spacing.sm },
});
