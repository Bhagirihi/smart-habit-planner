import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useStore } from '../store';
import { colors, spacing, type } from '../theme';
import { Card, EmptyState, GhostButton, PrimaryButton } from '../components/ui';
import type { Nav } from '../navigation';
import { formatDayLabel, isSundayKey, todayKey } from '../lib/dates';
import { buildSuggestions, weekSummary } from '../lib/suggestions';

export default function WeeklyReport({ nav }: { nav: Nav }): React.JSX.Element {
  const { state, updateHabit, isPremium } = useStore();
  const today = todayKey();
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [applied, setApplied] = useState<string[]>([]);

  const summary = weekSummary(state.habits, state.checkIns, today);
  const suggestions = buildSuggestions(state.habits, state.checkIns, today).filter((s) => !dismissed.includes(s.id));
  const isSunday = isSundayKey(today);

  if (state.habits.length === 0) {
    return (
      <ScrollView contentContainerStyle={styles.wrap}>
        <Text style={styles.hero}>Weekly report</Text>
        <EmptyState title="No data yet" detail="Add a habit and use the app for a few days. Your first weekly report will appear here, with suggestions based on your own data." actionLabel="Add a habit" onAction={() => nav.push({ name: 'habitForm' })} />
      </ScrollView>
    );
  }

  function apply(s: ReturnType<typeof buildSuggestions>[number]) {
    const habit = state.habits.find((h) => h.id === s.habitId);
    if (!habit) return;
    if (s.action.kind === 'move-slot') updateHabit({ ...habit, slot: s.action.slot });
    if (s.action.kind === 'change-frequency') updateHabit({ ...habit, frequency: s.action.frequency });
    if (s.action.kind === 'pause') updateHabit({ ...habit, paused: true });
    setApplied((p) => [...p, s.id]);
  }

  return (
    <ScrollView contentContainerStyle={styles.wrap}>
      <Text style={styles.hero}>Weekly report</Text>
      <Text style={styles.body}>{isSunday ? 'It is Sunday, time for your weekly check-in.' : 'This is your latest weekly summary. A fresh report is generated every Sunday.'}</Text>

      <View style={styles.stats}>
        <Card style={styles.stat}><Text style={styles.statNum}>{summary.done}</Text><Text style={styles.statLabel}>Done this week</Text></Card>
        <Card style={styles.stat}><Text style={styles.statNum}>{summary.due === 0 ? '—' : `${Math.round((summary.done / summary.due) * 100)}%`}</Text><Text style={styles.statLabel}>Completion</Text></Card>
        <Card style={styles.stat}><Text style={styles.statNum}>{summary.bestDayDone}</Text><Text style={styles.statLabel}>Best day ({formatDayLabel(summary.bestDay)})</Text></Card>
      </View>

      <Text style={styles.section}>Suggestions for next week</Text>
      {!isPremium ? (
        <Card>
          <Text style={styles.cardTitle}>Weekly suggestions are Premium</Text>
          <Text style={styles.cardBody}>You can see your summary above for free. Personalised suggestions, with one-tap Apply buttons, unlock with Premium.</Text>
          <GhostButton label="See Premium" onPress={() => nav.openPaywall()} />
        </Card>
      ) : suggestions.length === 0 ? (
        <Card>
          <Text style={styles.cardTitle}>Nothing to change</Text>
          <Text style={styles.cardBody}>Your habits are at 80% or above over the last 2 weeks. Keep doing what you are doing, and check again next Sunday.</Text>
        </Card>
      ) : (
        suggestions.map((s) => {
          const done = applied.includes(s.id);
          return (
            <Card key={s.id}>
              <Text style={styles.cardTitle}>{s.title}</Text>
              <Text style={styles.cardBody}>{s.detail}</Text>
              {done ? (
                <Text style={styles.applied}>✓ Updated. Your habit now follows this suggestion.</Text>
              ) : (
                <View style={styles.btnRow}>
                  <PrimaryButton label={s.applyLabel} onPress={() => apply(s)} />
                  <GhostButton label="Dismiss" onPress={() => setDismissed((p) => [...p, s.id])} />
                </View>
              )}
            </Card>
          );
        })
      )}
      <GhostButton label="Back" onPress={nav.pop} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { flexGrow: 1, padding: spacing.lg, gap: 14, backgroundColor: colors.bg },
  hero: { fontSize: type.title, fontWeight: '800', color: colors.ink },
  body: { fontSize: type.body, color: colors.muted, lineHeight: 22 },
  section: { fontSize: type.subtitle, fontWeight: '700', color: colors.ink },
  stats: { flexDirection: 'row', gap: 10 },
  stat: { flex: 1, alignItems: 'center', gap: 2 },
  statNum: { fontSize: 24, fontWeight: '800', color: colors.ink },
  statLabel: { fontSize: type.caption, color: colors.muted, textAlign: 'center' },
  cardTitle: { fontSize: type.subtitle, fontWeight: '700', color: colors.ink },
  cardBody: { fontSize: type.body, color: colors.muted, lineHeight: 22, marginVertical: 6 },
  applied: { fontSize: type.body, color: colors.green, fontWeight: '700', marginTop: 6 },
  btnRow: { gap: 8, marginTop: 6 },
});
