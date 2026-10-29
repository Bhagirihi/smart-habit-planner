import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useStore } from '../store';
import { spacing, type, type Palette } from '../theme';
import { useTheme } from '../useTheme';
import { Card, EmptyState, GhostButton, SectionTitle } from '../components/ui';
import { Heatmap, WeekBars } from '../components/Charts';
import type { Nav } from '../navigation';
import { todayKey } from '../lib/dates';
import { completionRate, computeBestStreak, computeStreak } from '../lib/streaks';

function makeStyles(c: Palette) {
  return StyleSheet.create({
    wrap: { flexGrow: 1, padding: spacing.lg, gap: 14, backgroundColor: c.bg },
    hero: { fontSize: type.title, fontWeight: '800', color: c.ink },
    cardTitle: { fontSize: type.subtitle, fontWeight: '700', color: c.ink },
    cardBody: { fontSize: type.body, color: c.muted, lineHeight: 22, marginVertical: 6 },
    legend: { fontSize: type.small, color: c.muted, marginTop: 10 },
    medalsRow: { flexDirection: 'row', gap: 10 },
    medal: { flex: 1, alignItems: 'center', gap: 4, paddingVertical: 10 },
    medalCircle: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
    medalMark: { fontSize: 20, fontWeight: '800', color: '#fff' },
    medalLabel: { fontSize: type.caption, fontWeight: '700', color: c.ink, textAlign: 'center' },
    medalSub: { fontSize: type.caption, color: c.muted, textAlign: 'center' },
  });
}

const MEDALS = [
  { id: 'first', label: 'First Step', sub: '1-day best', needed: 1 },
  { id: 'week', label: '7-Day', sub: '7-day best', needed: 7 },
  { id: 'month', label: '30-Day', sub: '30-day best', needed: 30 },
  { id: 'century', label: '100-Day', sub: '100-day best', needed: 100 },
];

export default function Progress({ nav }: { nav: Nav }): React.JSX.Element {
  const c = useTheme();
  const styles = useMemo(() => makeStyles(c), [c]);
  const { state, isPremium } = useStore();
  const today = todayKey();

  if (state.habits.length === 0) {
    return (
      <ScrollView contentContainerStyle={styles.wrap}>
        <Text style={styles.hero}>Progress</Text>
        <EmptyState title="No progress yet" detail="Add a habit and tick it off for a few days. Your week bars and calendar grid will fill in here." actionLabel="Add a habit" onAction={() => nav.push({ name: 'habitForm' })} />
      </ScrollView>
    );
  }

  const ranked = [...state.habits]
    .map((h) => ({ habit: h, rate: completionRate(h, state.checkIns, today, 30) ?? 0, streak: computeStreak(h, state.checkIns, today), best: computeBestStreak(h, state.checkIns, today) }))
    .sort((a, b) => a.rate - b.rate);
  const maxBest = Math.max(0, ...ranked.map((r) => r.best));

  return (
    <ScrollView contentContainerStyle={styles.wrap}>
      <Text style={styles.hero}>Progress</Text>

      <SectionTitle>Achievements</SectionTitle>
      <Card>
        <View style={styles.medalsRow}>
          {MEDALS.map((m) => {
            const earned = maxBest >= m.needed;
            return (
              <View key={m.id} style={styles.medal}>
                <View style={[styles.medalCircle, { backgroundColor: earned ? c.amber : c.surface2 }]}>
                  <Text style={[styles.medalMark, { color: earned ? '#fff' : c.muted }]}>{earned ? '✓' : '·'}</Text>
                </View>
                <Text style={styles.medalLabel}>{m.label}</Text>
                <Text style={styles.medalSub}>{earned ? 'Earned' : m.sub}</Text>
              </View>
            );
          })}
        </View>
      </Card>

      <Card>
        <Text style={styles.cardTitle}>Weekly report</Text>
        <Text style={styles.cardBody}>Your Sunday summary and 1 to 3 small changes for next week.</Text>
        <GhostButton label="View weekly report" onPress={() => nav.push({ name: 'weeklyReport' })} />
      </Card>

      <SectionTitle>This week</SectionTitle>
      <Card>
        <WeekBars habits={state.habits} checkIns={state.checkIns} today={today} />
      </Card>

      <SectionTitle>Last 12 weeks</SectionTitle>
      <Card>
        <Heatmap habits={state.habits} checkIns={state.checkIns} today={today} />
        <Text style={styles.legend}>Darker teal means more habits done that day.</Text>
      </Card>

      <SectionTitle>All habits, weakest first</SectionTitle>
      {ranked.map(({ habit, rate, streak, best }) => (
        <Card key={habit.id}>
          <Text style={styles.cardTitle} onPress={() => nav.push({ name: 'habitDetail', habitId: habit.id })}>{habit.name}</Text>
          <Text style={styles.cardBody}>30-day completion: {rate}% · Current streak: {streak} · Best: {best}</Text>
          <GhostButton label="View habit" onPress={() => nav.push({ name: 'habitDetail', habitId: habit.id })} />
        </Card>
      ))}

      {!isPremium ? (
        <Card>
          <Text style={styles.cardTitle}>Advanced charts are Premium</Text>
          <Text style={styles.cardBody}>The week bars and heatmap above are free. Per-habit trends, month comparisons and weekly suggestions unlock with Premium.</Text>
          <GhostButton label="See Premium" onPress={() => nav.openPaywall()} />
        </Card>
      ) : null}
    </ScrollView>
  );
}
