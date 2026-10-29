import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Card,
  EmptyState,
  ErrorBanner,
  GhostButton,
  PrimaryButton,
  SecondaryButton,
} from '../components/ui';
import { formatLongDate, todayKey } from '../lib/dates';
import type { Nav } from '../navigation';
import { computeBestStreak } from '../services/streaks';
import { useStore } from '../store';
import { c, spacing, type } from '../theme';
import type { Suggestion } from '../types';

function suggestionTitle(s: Suggestion): string {
  if (s.kind === 'move-to-morning') return 'Move to morning';
  if (s.kind === 'reduce-frequency') return 'Reduce frequency';
  if (s.kind === 'lower-target') return 'Lower target';
  return 'Pause habit';
}

export default function WeeklyReport({ nav }: { nav: Nav }) {
  const {
    ready,
    loadError,
    habits,
    completions,
    weeklyReport,
    refreshWeeklyReport,
    applySuggestion,
    dismissSuggestion,
    updateHabit,
  } = useStore();
  const didRefresh = useRef(false);
  const [confirmations, setConfirmations] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!didRefresh.current) {
      didRefresh.current = true;
      refreshWeeklyReport();
    }
    // Intentionally once on mount, per spec.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const today = todayKey();
  const bestStreak = habits.reduce((best, h) => Math.max(best, computeBestStreak(h, completions, today)), 0);
  const lowestHabit = weeklyReport?.lowestHabitId
    ? habits.find((h) => h.id === weeklyReport.lowestHabitId)
    : undefined;
  const visibleSuggestions = (weeklyReport?.suggestions ?? []).filter((s) => !s.dismissed);

  function handleApply(s: Suggestion): void {
    const message = applySuggestion(s);
    setConfirmations((prev) => ({ ...prev, [s.id]: message }));
  }

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.content}>
        <GhostButton label="Back" onPress={() => nav.back()} />
        <Text style={s.title}>Weekly report</Text>
        <Text style={s.note}>
          Basic weekly summary — advanced personalised suggestions are a Premium feature when
          subscriptions are connected.
        </Text>
        <ErrorBanner message={loadError} />
        {!ready || !weeklyReport ? (
          <Card>
            <Text style={s.body}>Loading weekly report…</Text>
          </Card>
        ) : habits.length === 0 ? (
          <EmptyState
            title="No weekly report yet"
            detail="Create a habit and complete it for a week to see your first weekly report here."
            actionLabel="Create habit"
            onAction={() => nav.push({ name: 'habitForm' })}
          />
        ) : (
          <>
            <Card>
              <Text style={s.rowName}>Last week</Text>
              <Text style={s.body}>Total completions: {weeklyReport.totalCompletions}</Text>
              <Text style={s.body}>Best day: {formatLongDate(weeklyReport.bestDay)}</Text>
              <Text style={s.body}>Best streak: {bestStreak} days</Text>
              <Text style={s.body}>
                Lowest habit: {lowestHabit ? lowestHabit.name : 'No habit with data yet'}
              </Text>
            </Card>

            <Text style={s.section}>Suggestions</Text>
            {visibleSuggestions.length === 0 ? (
              <Card>
                <Text style={s.body}>No suggestions this week. Keep going.</Text>
              </Card>
            ) : (
              visibleSuggestions.map((sug) => {
                const habit = habits.find((h) => h.id === sug.habitId);
                const confirmation = confirmations[sug.id];
                const applied = sug.applied || confirmation !== undefined;
                return (
                  <Card key={sug.id}>
                    <Text style={s.rowName}>{suggestionTitle(sug)}</Text>
                    {habit ? <Text style={s.meta}>{habit.name}</Text> : null}
                    <Text style={s.body}>{sug.reason}</Text>
                    {confirmation ? <Text style={s.successText}>{confirmation}</Text> : null}
                    {applied ? (
                      <>
                        {sug.kind === 'pause' ? (
                          <Text style={s.body}>Unpause from Habit Detail</Text>
                        ) : null}
                        {sug.kind === 'pause' && habit && habit.paused ? (
                          <SecondaryButton
                            label="Undo (unpause)"
                            onPress={() => {
                              updateHabit({ ...habit, paused: false });
                              setConfirmations((prev) => ({
                                ...prev,
                                [sug.id]: 'Unpaused.',
                              }));
                            }}
                          />
                        ) : null}
                      </>
                    ) : (
                      <View style={s.actions}>
                        <PrimaryButton label="Apply" onPress={() => handleApply(sug)} />
                        <SecondaryButton label="Dismiss" onPress={() => dismissSuggestion(sug.id)} />
                      </View>
                    )}
                  </Card>
                );
              })
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
  note: { fontSize: type.body, color: c.muted, lineHeight: 20 },
  section: { fontSize: type.subtitle, fontWeight: '600', color: c.ink, marginTop: spacing.sm },
  body: { fontSize: type.body, color: c.muted, lineHeight: 20 },
  meta: { fontSize: type.body, color: c.muted },
  rowName: { fontSize: type.subtitle, fontWeight: '600', color: c.ink },
  successText: { fontSize: type.body, fontWeight: '600', color: c.accent },
  actions: { gap: spacing.sm, marginTop: spacing.sm },
});
