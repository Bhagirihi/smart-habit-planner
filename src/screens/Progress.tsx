import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useStore } from '../store';
import { colors, spacing, type } from '../theme';
import { Card, EmptyState, GhostButton, SectionTitle } from '../components/ui';
import { Heatmap, WeekBars } from '../components/Charts';
import type { Nav } from '../navigation';
import { todayKey } from '../lib/dates';
import { completionRate, computeBestStreak, computeStreak } from '../lib/streaks';

export default function Progress({ nav }: { nav: Nav }): React.JSX.Element {
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

  return (
    <ScrollView contentContainerStyle={styles.wrap}>
      <Text style={styles.hero}>Progress</Text>
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

const styles = StyleSheet.create({
  wrap: { flexGrow: 1, padding: spacing.lg, gap: 14, backgroundColor: colors.bg },
  hero: { fontSize: type.title, fontWeight: '800', color: colors.ink },
  cardTitle: { fontSize: type.subtitle, fontWeight: '700', color: colors.ink },
  cardBody: { fontSize: type.body, color: colors.muted, lineHeight: 22, marginVertical: 6 },
  legend: { fontSize: type.small, color: colors.muted, marginTop: 10 },
});
