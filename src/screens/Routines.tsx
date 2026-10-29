import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, EmptyState, ErrorBanner, PrimaryButton, ProgressBar } from '../components/ui';
import { todayKey } from '../lib/dates';
import type { Nav } from '../navigation';
import { completionFor, isDone, isScheduledOn } from '../services/streaks';
import { useStore } from '../store';
import { c, spacing, type } from '../theme';
import type { Routine } from '../types';

export default function Routines({ nav }: { nav: Nav }) {
  const { ready, loadError, routines, habits, completions, deleteRoutine } = useStore();
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const today = todayKey();

  function progressFor(r: Routine): { done: number; scheduled: number } {
    const ordered = r.habitIds
      .map((id) => habits.find((h) => h.id === id))
      .filter((h) => h !== undefined);
    const scheduled = ordered.filter((h) => isScheduledOn(h, today));
    const done = scheduled.filter((h) => isDone(h, completionFor(h.id, today, completions))).length;
    return { done, scheduled: scheduled.length };
  }

  function confirmDelete(r: Routine): void {
    setConfirmingId(r.id);
    Alert.alert('Delete routine', `Delete "${r.name}"? Its habits are kept.`, [
      { text: 'Cancel', style: 'cancel', onPress: () => setConfirmingId(null) },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteRoutine(r.id);
          setConfirmingId(null);
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.content}>
        <Text style={s.title}>Routines</Text>
        <ErrorBanner message={loadError} />
        {!ready ? (
          <Card>
            <Text style={s.body}>Loading routines…</Text>
          </Card>
        ) : routines.length === 0 ? (
          <Card>
            <Text style={s.body}>No routine yet. Bundle your habits into one morning or night flow.</Text>
            <View style={{ marginTop: spacing.sm }}>
              <PrimaryButton label="Create Routine" onPress={() => nav.push({ name: 'routineForm' })} />
            </View>
          </Card>
        ) : (
          <>
            <PrimaryButton label="Create Routine" onPress={() => nav.push({ name: 'routineForm' })} />
            {routines.map((r) => {
              const orderedCount = r.habitIds.filter((id) => habits.some((h) => h.id === id)).length;
              const { done, scheduled } = progressFor(r);
              const pct = scheduled > 0 ? Math.round((done / scheduled) * 100) : 0;
              return (
                <Pressable
                  key={r.id}
                  onPress={() => nav.push({ name: 'routineDetail', routineId: r.id })}
                  accessibilityRole="button"
                >
                  <Card>
                    <Text style={s.name}>{r.name}</Text>
                    <Text style={s.meta}>
                      Starts {r.startTime} · {orderedCount} {orderedCount === 1 ? 'habit' : 'habits'}
                    </Text>
                    <Text style={s.meta}>
                      Today: {done} of {scheduled} done
                    </Text>
                    <ProgressBar pct={pct} />
                    <View style={s.row}>
                      <Pressable
                        style={s.deleteBtn}
                        onPress={() => confirmDelete(r)}
                        accessibilityRole="button"
                      >
                        <Text style={s.deleteText}>
                          {confirmingId === r.id ? 'Confirming…' : 'Delete routine'}
                        </Text>
                      </Pressable>
                    </View>
                  </Card>
                </Pressable>
              );
            })}
          </>
        )}
        {routines.length > 0 && habits.length === 0 ? (
          <EmptyState
            title="No habits to bundle"
            detail="Create a habit first, then add it to a routine."
            actionLabel="Create habit"
            onAction={() => nav.push({ name: 'habitForm' })}
          />
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: c.bg },
  content: { padding: spacing.lg, gap: spacing.lg },
  title: { fontSize: type.title, fontWeight: '600', color: c.ink },
  name: { fontSize: type.subtitle, fontWeight: '600', color: c.ink },
  meta: { fontSize: type.body, color: c.muted },
  body: { fontSize: type.body, color: c.muted, lineHeight: 20 },
  row: { flexDirection: 'row', justifyContent: 'flex-end' },
  deleteBtn: { minHeight: 48, justifyContent: 'center', paddingHorizontal: spacing.sm },
  deleteText: { fontSize: type.label, fontWeight: '600', color: c.error },
});
