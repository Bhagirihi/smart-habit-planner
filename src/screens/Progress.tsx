import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, EmptyState, ErrorBanner, ProgressBar, ProgressRing, SecondaryButton, SectionTitle } from '../components/ui';
import { addDays, todayKey, weekStartKey } from '../lib/dates';
import type { Nav } from '../navigation';
import {
  completionFor,
  completionRate,
  computeBestStreak,
  computeStreak,
  isDone,
  isScheduledOn,
} from '../services/streaks';
import { useStore } from '../store';
import { c, radius, spacing, type } from '../theme';

function shortDay(key: string): string {
  return new Date(`${key}T12:00:00`).toLocaleDateString('en-GB', { weekday: 'short' });
}

export default function Progress({ nav }: { nav: Nav }) {
  const { ready, loadError, habits, completions } = useStore();
  const today = todayKey();
  const [window, setWindow] = useState<'week' | 'month'>('week');
  const windowDays = window === 'week' ? 7 : 30;

  // Selected window, oldest first, from real stored records.
  const windowDates = Array.from({ length: windowDays }, (_, i) => addDays(today, -(windowDays - 1 - i)));
  const perDay = windowDates.map((d) => ({
    date: d,
    count: habits.filter((h) => isScheduledOn(h, d) && isDone(h, completionFor(h.id, d, completions))).length,
  }));
  const maxDay = Math.max(1, ...perDay.map((d) => d.count));
  const daysWithAny = perDay.filter((d) => d.count > 0).length;

  // 3-month heatmap: 84 days ending today, grouped into 12 Monday-start weeks.
  // Days before the first Monday are shown as blank cells so columns stay aligned.
  const heatStart = weekStartKey(addDays(today, -83));
  const heatDays: Array<{ date: string; count: number }> = Array.from({ length: 84 }, (_, i) => {
    const d = addDays(heatStart, i);
    return {
      date: d,
      count:
        d > today
          ? 0
          : habits.filter((h) => isScheduledOn(h, d) && isDone(h, completionFor(h.id, d, completions))).length,
    };
  });
  const heatWeeks: Array<typeof heatDays> = [];
  for (let w = 0; w < 12; w++) heatWeeks.push(heatDays.slice(w * 7, w * 7 + 7));

  function dotColor(count: number, date: string): string {
    if (date > today) return c.surfaceAlt;
    if (count === 0) return c.surfaceAlt;
    if (count <= 2) return c.primary;
    return c.accent;
  }

  const totalCompletions = completions.filter((comp) => {
    if (comp.status !== 'done') return false;
    const h = habits.find((x) => x.id === comp.habitId);
    return h !== undefined && isDone(h, comp);
  }).length;

  let scheduled30 = 0;
  let done30 = 0;
  for (const h of habits) {
    for (let i = 29; i >= 0; i--) {
      const d = addDays(today, -i);
      if (!isScheduledOn(h, d)) continue;
      scheduled30++;
      if (isDone(h, completionFor(h.id, d, completions))) done30++;
    }
  }
  const rate30 = scheduled30 > 0 ? Math.round((done30 / scheduled30) * 100) : null;
  const bestStreak = habits.reduce((best, h) => Math.max(best, computeBestStreak(h, completions, today)), 0);

  const ranked = [...habits]
    .map((h) => ({
      habit: h,
      rate: completionRate(h, completions, today, 30),
      streak: computeStreak(h, completions, today),
    }))
    .sort((a, b) => {
      if (a.rate === null && b.rate === null) return 0;
      if (a.rate === null) return 1;
      if (b.rate === null) return -1;
      return a.rate - b.rate;
    });

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.content}>
        <Text style={s.title}>Progress</Text>
        <ErrorBanner message={loadError} />
        {!ready ? (
          <Card>
            <Text style={s.body}>Loading progress…</Text>
          </Card>
        ) : habits.length === 0 ? (
          <EmptyState
            title="No progress yet"
            detail="Create your first habit and complete it to see your progress here."
            actionLabel="Create habit"
            onAction={() => nav.push({ name: 'habitForm' })}
          />
        ) : (
          <>
            <Card>
              <View style={s.ringRow}>
                <ProgressRing pct={rate30 ?? 0} label="30-day rate" />
                <View style={s.totals}>
                  <Text style={s.numeral}>{totalCompletions}</Text>
                  <Text style={s.meta}>Total completions</Text>
                  <Text style={s.numeral}>{bestStreak}</Text>
                  <Text style={s.meta}>Best streak (days)</Text>
                  <Text style={s.meta}>
                    {rate30 === null
                      ? 'No scheduled days in the last 30 days'
                      : `${done30} of ${scheduled30} scheduled days done in the last 30 days`}
                  </Text>
                </View>
              </View>
            </Card>

            <SectionTitle>{window === 'week' ? 'This week' : 'This month'}</SectionTitle>
            <View style={s.toggleRow}>
              <Pressable
                style={[s.toggleBtn, window === 'week' && s.toggleBtnActive]}
                onPress={() => setWindow('week')}
                accessibilityRole="button"
              >
                <Text style={[s.toggleText, window === 'week' && s.toggleTextActive]}>This Week</Text>
              </Pressable>
              <Pressable
                style={[s.toggleBtn, window === 'month' && s.toggleBtnActive]}
                onPress={() => setWindow('month')}
                accessibilityRole="button"
              >
                <Text style={[s.toggleText, window === 'month' && s.toggleTextActive]}>This Month</Text>
              </Pressable>
            </View>
            <Card>
              <Text style={s.headline}>
                {daysWithAny}/{windowDays} days
              </Text>
              {perDay.map((d) => (
                <View key={d.date} style={s.barRow}>
                  <Text style={s.dayLabel}>{shortDay(d.date)}</Text>
                  <View style={s.barWrap}>
                    <ProgressBar pct={(d.count / maxDay) * 100} />
                  </View>
                  <Text style={s.countLabel}>{d.count}</Text>
                </View>
              ))}
            </Card>

            <SectionTitle>Last 12 weeks</SectionTitle>
            <Card>
              <View style={s.heatRow}>
                {heatWeeks.map((week, wi) => {
                  const first = week[0]?.date;
                  const label = first ? new Date(`${first}T12:00:00`).toLocaleDateString('en-GB', { month: 'short' }) : '';
                  const prevFirst = wi > 0 ? heatWeeks[wi - 1]?.[0]?.date : null;
                  const prevLabel = prevFirst ? new Date(`${prevFirst}T12:00:00`).toLocaleDateString('en-GB', { month: 'short' }) : '';
                  return (
                    <View key={`month-${wi}`} style={s.heatCol}>
                      <Text style={s.monthLabel}>{wi === 0 || label !== prevLabel ? label : ''}</Text>
                    </View>
                  );
                })}
              </View>
              <View style={s.heatRow}>
                {heatWeeks.map((week, wi) => (
                  <View key={week[0]?.date ?? `week-${wi}`} style={s.heatCol}>
                    {week.map((day) => (
                      <View
                        key={day.date}
                        style={[s.dot, { backgroundColor: dotColor(day.count, day.date) }]}
                      />
                    ))}
                  </View>
                ))}
              </View>
              <Text style={s.meta}>Each dot is one day. Filled dots are days with completions.</Text>
            </Card>

            <SectionTitle>Habits, lowest first</SectionTitle>
            {ranked.map(({ habit, rate, streak }) => (
              <Pressable
                key={habit.id}
                onPress={() => nav.push({ name: 'habitDetail', habitId: habit.id })}
                accessibilityRole="button"
              >
                <Card>
                  <View style={s.habitRow}>
                    <Text style={s.rowName}>
                      {habit.icon} {habit.name}
                    </Text>
                    <Text style={s.meta}>{rate === null ? 'No data' : `${rate}%`}</Text>
                  </View>
                  <Text style={s.meta}>Current streak: {streak} days</Text>
                  {rate !== null ? <ProgressBar pct={rate} color={habit.color} /> : null}
                </Card>
              </Pressable>
            ))}

            <SecondaryButton label="View weekly report" onPress={() => nav.push({ name: 'weeklyReport' })} />
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
  body: { fontSize: type.body, color: c.muted, lineHeight: 20 },
  meta: { fontSize: type.body, color: c.muted, lineHeight: 20 },
  numeral: { fontSize: type.numeral, fontWeight: '600', color: c.ink },
  headline: { fontSize: type.subtitle, fontWeight: '600', color: c.ink },
  toggleRow: { flexDirection: 'row', gap: spacing.sm },
  toggleBtn: { flex: 1, minHeight: 48, borderRadius: radius.md, backgroundColor: c.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  toggleBtnActive: { backgroundColor: c.surfaceTonal },
  toggleText: { fontSize: type.label, fontWeight: '600', color: c.muted },
  toggleTextActive: { color: c.primary },
  ringRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  totals: { flex: 1, gap: 2 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dayLabel: { width: 36, fontSize: type.body, color: c.muted },
  barWrap: { flex: 1 },
  countLabel: { width: 24, textAlign: 'right', fontSize: type.body, color: c.ink },
  heatRow: { flexDirection: 'row', gap: 4 },
  heatCol: { flex: 1, gap: 4 },
  monthLabel: { fontSize: type.small, color: c.muted, minHeight: 16 },
  dot: { height: 12, borderRadius: radius.sm, backgroundColor: c.surfaceAlt },
  habitRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  rowName: { fontSize: type.label, fontWeight: '600', color: c.ink, flex: 1 },
});
