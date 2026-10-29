import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { CheckIns, Habit } from '../types';
import { colors, type } from '../theme';
import { addDays, lastNDays } from '../lib/dates';
import { dayStatus } from '../lib/streaks';

/** 7 vertical bars, one per day, height = % of habits done that day. */
export function WeekBars({ habits, checkIns, today }: { habits: Habit[]; checkIns: CheckIns; today: string }): React.JSX.Element {
  const days = lastNDays(today, 7);
  const values = days.map((d) => {
    const due = habits.filter((h) => dayStatus(h, d, checkIns, today) !== 'not-due');
    const done = due.filter((h) => dayStatus(h, d, checkIns, today) === 'done').length;
    return due.length === 0 ? 0 : Math.round((done / due.length) * 100);
  });
  const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return (
    <View style={styles.weekRow}>
      {values.map((v, i) => {
        const dow = (new Date(days[i] + 'T00:00:00').getDay() + 6) % 7;
        return (
          <View key={days[i]} style={styles.weekCol}>
            <View style={styles.barWrap}>
              <View style={[styles.bar, { height: Math.max(6, (v / 100) * 90), backgroundColor: v >= 80 ? colors.primary : v >= 40 ? colors.amber : colors.border }]} />
            </View>
            <Text style={styles.weekLabel}>{labels[dow]}</Text>
            <Text style={styles.weekValue}>{v}%</Text>
          </View>
        );
      })}
    </View>
  );
}

/** GitHub-style heatmap: 12 weeks x 7 days, colour intensity = done count that day. */
export function Heatmap({ habits, checkIns, today }: { habits: Habit[]; checkIns: CheckIns; today: string }): React.JSX.Element {
  const weeks: string[][] = [];
  let cursor = addDays(today, -(12 * 7 - 1));
  for (let w = 0; w < 12; w++) {
    const week: string[] = [];
    for (let d = 0; d < 7; d++) week.push(addDays(cursor, w * 7 + d));
    weeks.push(week);
  }
  return (
    <View style={styles.heatRow}>
      {weeks.map((week, wi) => (
        <View key={wi} style={styles.heatCol}>
          {week.map((d) => {
            const done = habits.filter((h) => dayStatus(h, d, checkIns, today) === 'done').length;
            const total = habits.filter((h) => dayStatus(h, d, checkIns, today) !== 'not-due').length;
            const ratio = total === 0 ? 0 : done / total;
            const bg = d > today ? colors.surface2 : ratio === 0 ? colors.surface2 : ratio < 0.5 ? '#99D5CF' : ratio < 1 ? '#2A9D8F' : colors.primary;
            return <View key={d} style={[styles.cell, { backgroundColor: bg }]} />;
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  weekRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 6 },
  weekCol: { flex: 1, alignItems: 'center', gap: 4 },
  barWrap: { height: 96, justifyContent: 'flex-end', width: '100%', alignItems: 'center' },
  bar: { width: '70%', borderRadius: 6 },
  weekLabel: { fontSize: type.caption, color: colors.muted },
  weekValue: { fontSize: type.caption, color: colors.ink, fontWeight: '700' },
  heatRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 3 },
  heatCol: { flex: 1, gap: 3 },
  cell: { aspectRatio: 1, borderRadius: 3, borderWidth: 1, borderColor: colors.border },
});
