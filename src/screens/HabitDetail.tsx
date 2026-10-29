import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, ErrorBanner, GhostButton, Inset, PrimaryButton, ProgressBar, SecondaryButton, SectionTitle } from '../components/ui';
import { useStore } from '../store';
import type { Nav } from '../navigation';
import { addDays, formatLongDate, todayKey } from '../lib/dates';
import { completionFor, computeBestStreak, computeStreak, dayStatus, isDone, isScheduledOn } from '../services/streaks';
import { c, radius, spacing, type } from '../theme';

const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function scheduleText(habit: Parameters<typeof isScheduledOn>[0]): string {
  if (habit.frequency === 'daily') return 'Every day';
  if (habit.frequency === 'weekdays') {
    if (habit.weekdays.length === 0) return 'Specific weekdays (none selected)';
    return habit.weekdays.map((d) => WEEKDAY_NAMES[d] ?? '').join(', ');
  }
  return `${habit.weeklyTarget} times per week`;
}

export default function HabitDetail({ nav }: { nav: Nav }) {
  const { habits, completions, toggleDone, deleteHabit } = useStore();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const today = todayKey();

  const habitId = nav.route.name === 'habitDetail' ? nav.route.habitId : null;
  const habit = habitId ? habits.find((h) => h.id === habitId) : undefined;

  const currentStreak = habit ? computeStreak(habit, completions, today) : 0;
  const bestStreak = habit ? computeBestStreak(habit, completions, today) : 0;
  const todayComp = habit ? completionFor(habit.id, today, completions) : undefined;
  const todayDone = habit ? isDone(habit, todayComp) : false;

  const last7 = useMemo(() => {
    if (!habit) return { scheduled: 0, done: 0, pct: 0 };
    let scheduled = 0;
    let done = 0;
    for (let i = 6; i >= 0; i--) {
      const d = addDays(today, -i);
      if (!isScheduledOn(habit, d)) continue;
      scheduled++;
      if (isDone(habit, completionFor(habit.id, d, completions))) done++;
    }
    return { scheduled, done, pct: scheduled === 0 ? 0 : Math.round((done / scheduled) * 100) };
  }, [habit, completions, today]);

  const heatmapWeeks = useMemo(() => {
    if (!habit) return [] as string[][];
    const weeks: string[][] = [];
    const start = addDays(today, -83);
    for (let w = 0; w < 12; w++) {
      const week: string[] = [];
      for (let d = 0; d < 7; d++) week.push(addDays(start, w * 7 + d));
      weeks.push(week);
    }
    return weeks;
  }, [habit, today]);

  const history = useMemo(() => {
    if (!habit) return [] as { date: string; status: ReturnType<typeof dayStatus> }[];
    const out: { date: string; status: ReturnType<typeof dayStatus> }[] = [];
    for (let i = 0; i < 14; i++) {
      const d = addDays(today, -i);
      out.push({ date: d, status: dayStatus(habit, d, completions, today) });
    }
    return out;
  }, [habit, completions, today]);

  if (nav.route.name !== 'habitDetail') {
    return (
      <SafeAreaView style={s.root}>
        <View style={s.content}>
          <ErrorBanner message="This habit could not be opened. Please go back and try again." />
          <SecondaryButton label="Back" onPress={() => nav.back()} />
        </View>
      </SafeAreaView>
    );
  }
  if (!habit) {
    return (
      <SafeAreaView style={s.root}>
        <View style={s.content}>
          <ErrorBanner message="This habit no longer exists." />
          <SecondaryButton label="Back" onPress={() => nav.back()} />
        </View>
      </SafeAreaView>
    );
  }

  const dotColor = (date: string): string => {
    const status = dayStatus(habit, date, completions, today);
    if (status === 'done') return c.primary;
    if (status === 'missed' || status === 'failed') return c.error;
    if (status === 'not-scheduled') return c.surfaceAlt;
    if (status === 'partial') return c.accent;
    if (status === 'skipped') return c.muted;
    return c.border;
  };

  const statusLabel = (status: string): string => {
    if (status === 'done') return 'Done';
    if (status === 'missed') return 'Missed';
    if (status === 'failed') return 'Failed';
    if (status === 'partial') return 'Partial';
    if (status === 'skipped') return 'Skipped';
    if (status === 'not-scheduled') return 'Not scheduled';
    return 'Pending';
  };

  return (
    <SafeAreaView style={s.root}>
      <ScrollView contentContainerStyle={s.content}>
        <View style={s.header}>
          <View style={[s.tile, { backgroundColor: habit.color }]}>
            <Text style={s.tileText}>{habit.icon}</Text>
          </View>
          <View style={s.headerText}>
            <Text style={s.title}>{habit.name}</Text>
            <Text style={s.subtitle}>
              {habit.type === 'do' ? 'Do it' : habit.type === 'avoid' ? 'Avoid it' : `Measurable · ${habit.target} ${habit.unit}`} · {habit.timeSlot}
            </Text>
          </View>
        </View>

        <Card>
          <View style={s.streakRow}>
            <View>
              <Text style={s.big}>{currentStreak}</Text>
              <Text style={s.small}>Current streak (days)</Text>
            </View>
            <View>
              <Text style={s.big}>{bestStreak}</Text>
              <Text style={s.small}>Best streak (days)</Text>
            </View>
          </View>
        </Card>

        <SectionTitle>Last 7 days</SectionTitle>
        <Card>
          <Text style={s.body}>
            {last7.done} of {last7.scheduled} scheduled days done ({last7.pct}%).
          </Text>
          <ProgressBar pct={last7.pct} />
        </Card>

        <SectionTitle>Last 12 weeks</SectionTitle>
        <Card>
          {heatmapWeeks.map((week, wi) => (
            <View key={`week-${wi}`} style={s.weekRow}>
              {week.map((d) => (
                <View key={d} style={[s.dot, { backgroundColor: dotColor(d) }]} />
              ))}
            </View>
          ))}
          <Text style={s.legend}>Teal dot = done · Red dot = missed or failed · Grey dot = not scheduled</Text>
        </Card>

        <SectionTitle>Schedule</SectionTitle>
        <Inset>
          <Text style={s.body}>{scheduleText(habit)}</Text>
          <Text style={s.body}>Start date: {habit.startDate}</Text>
          <Text style={s.body}>
            Skip days: {habit.skipDays.length > 0 ? habit.skipDays.join(', ') : 'None'}
          </Text>
          {habit.reminderEnabled && habit.reminderTime ? (
            <Text style={s.body}>Reminder: {habit.reminderTime}</Text>
          ) : (
            <Text style={s.body}>Reminder: off</Text>
          )}
          {habit.paused ? <Text style={s.body}>Paused</Text> : null}
        </Inset>

        <SectionTitle>History · Last 14 days</SectionTitle>
        <View style={s.history}>
          {history.map(({ date, status }) => (
            <View key={date} style={s.historyRow}>
              <Text style={s.body}>{formatLongDate(date)}</Text>
              <Text style={[s.body, status === 'done' && { color: c.primary }, (status === 'missed' || status === 'failed') && { color: c.error }]}>
                {statusLabel(status)}
              </Text>
            </View>
          ))}
        </View>

        <View style={s.actions}>
          <PrimaryButton
            label={todayDone ? 'Undo today' : 'Mark today complete'}
            onPress={() => toggleDone(habit.id, today)}
          />
          <SecondaryButton label="Edit" onPress={() => nav.push({ name: 'habitForm', habitId: habit.id })} />
          {!confirmingDelete ? (
            <GhostButton label="Delete habit" danger onPress={() => setConfirmingDelete(true)} />
          ) : (
            <Card>
              <Text style={s.warning}>Deleting removes this habit and all its history.</Text>
              <View style={s.deleteRow}>
                <Pressable
                  style={s.deleteBtn}
                  onPress={() => {
                    deleteHabit(habit.id);
                    nav.back();
                  }}
                  accessibilityRole="button"
                >
                  <Text style={s.deleteBtnText}>Confirm delete</Text>
                </Pressable>
                <SecondaryButton label="Cancel" onPress={() => setConfirmingDelete(false)} />
              </View>
            </Card>
          )}
          <SecondaryButton label="Back" onPress={() => nav.back()} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: c.bg },
  content: { padding: spacing.lg, gap: spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  tile: { width: 56, height: 56, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  tileText: { fontSize: 28 },
  headerText: { flex: 1, gap: 2 },
  title: { fontSize: type.title, fontWeight: '600', color: c.ink },
  subtitle: { fontSize: type.body, color: c.muted },
  streakRow: { flexDirection: 'row', gap: spacing.xxl },
  big: { fontSize: type.numeral, fontWeight: '600', color: c.ink },
  small: { fontSize: type.small, color: c.muted },
  body: { fontSize: type.body, color: c.muted, lineHeight: 20 },
  weekRow: { flexDirection: 'row', gap: 6 },
  dot: { width: 12, height: 12, borderRadius: 6 },
  legend: { fontSize: type.small, color: c.muted, lineHeight: 18 },
  history: { gap: spacing.sm },
  historyRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: c.surface, borderRadius: radius.md, padding: spacing.md },
  actions: { gap: spacing.sm, marginTop: spacing.sm },
  warning: { fontSize: type.body, fontWeight: '600', color: c.error, lineHeight: 20 },
  deleteRow: { flexDirection: 'row', gap: spacing.sm },
  deleteBtn: { flex: 1, minHeight: 48, borderRadius: radius.md, backgroundColor: c.error, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.md },
  deleteBtnText: { fontSize: type.label, fontWeight: '600', color: '#FFFFFF' },
});
