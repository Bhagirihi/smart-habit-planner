import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, EmptyState, ErrorBanner, PrimaryButton, ProgressRing, SectionTitle } from '../components/ui';
import { useStore } from '../store';
import type { Nav } from '../navigation';
import { addDays, dayOfWeek, formatLongDate, todayKey } from '../lib/dates';
import { completionFor, computeStreak, isDone, isScheduledOn, missedYesterday } from '../services/streaks';
import { c, radius, spacing, type } from '../theme';
import type { Habit, TimeSlot } from '../types';

const SLOTS: { key: TimeSlot; label: string }[] = [
  { key: 'morning', label: 'Morning' },
  { key: 'afternoon', label: 'Afternoon' },
  { key: 'evening', label: 'Evening' },
];
const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function HabitRow({ habit, selectedDate, isToday, nav }: { habit: Habit; selectedDate: string; isToday: boolean; nav: Nav }) {
  const { completions, toggleDone, setMeasurableValue, setStatus } = useStore();
  const today = todayKey();
  const comp = completionFor(habit.id, selectedDate, completions);
  const done = isDone(habit, comp);
  const streak = computeStreak(habit, completions, today);
  const value = comp?.value ?? 0;

  return (
    <View style={s.row}>
      <Pressable
        style={s.rowMain}
        onPress={() => nav.push({ name: 'habitDetail', habitId: habit.id })}
        accessibilityRole="button"
      >
        <View style={[s.tile, { backgroundColor: habit.color }]}>
          <Text style={s.tileText}>{habit.icon}</Text>
        </View>
        <View style={s.rowText}>
          <Text style={s.rowName}>{habit.name}</Text>
          <Text style={s.rowDetail}>
            {streak === 1 ? '1 day streak' : `${streak} day streak`}
            {habit.type === 'measurable' ? ` · ${value}/${habit.target} ${habit.unit}` : ''}
            {habit.type === 'avoid' && comp?.status === 'failed' ? ' · Failed today' : ''}
            {habit.type === 'avoid' && comp?.status === 'done' ? ' · Success today' : ''}
          </Text>
        </View>
      </Pressable>
      {!isToday ? null : habit.type === 'measurable' ? (
        <View style={s.controls}>
          <Pressable style={s.stepper} onPress={() => setMeasurableValue(habit.id, selectedDate, Math.max(0, value - 1))} accessibilityRole="button">
            <Text style={s.stepperText}>−</Text>
          </Pressable>
          <Text style={s.valueText}>{value}/{habit.target}</Text>
          <Pressable style={s.stepper} onPress={() => setMeasurableValue(habit.id, selectedDate, value + 1)} accessibilityRole="button">
            <Text style={s.stepperText}>+</Text>
          </Pressable>
        </View>
      ) : habit.type === 'avoid' ? (
        <View style={s.controls}>
          <Pressable
            style={[s.mini, comp?.status === 'done' && s.miniActive]}
            onPress={() => setStatus(habit.id, selectedDate, 'done')}
            accessibilityRole="button"
          >
            <Text style={[s.miniText, comp?.status === 'done' && s.miniTextActive]}>Success</Text>
          </Pressable>
          <Pressable
            style={[s.mini, comp?.status === 'failed' && s.miniFailed]}
            onPress={() => setStatus(habit.id, selectedDate, 'failed')}
            accessibilityRole="button"
          >
            <Text style={[s.miniText, comp?.status === 'failed' && s.miniTextFailed]}>Failure</Text>
          </Pressable>
        </View>
      ) : (
        <Pressable
          style={[s.toggle, done && s.toggleDone]}
          onPress={() => toggleDone(habit.id, selectedDate)}
          accessibilityRole="button"
        >
          <Text style={[s.toggleText, done && s.toggleTextDone]}>{done ? '✓ Done · Undo' : 'Mark done'}</Text>
        </Pressable>
      )}
    </View>
  );
}

export default function Today({ nav }: { nav: Nav }) {
  const { ready, loadError, habits, completions, prefs } = useStore();
  const today = todayKey();
  const [selectedDate, setSelectedDate] = useState<string>(today);
  const isToday = selectedDate === today;

  const dateStrip = useMemo(() => {
    const out: string[] = [];
    for (let i = -3; i <= 3; i++) out.push(addDays(today, i));
    return out;
  }, [today]);

  const scheduled = useMemo(
    () => habits.filter((h) => isScheduledOn(h, selectedDate)),
    [habits, selectedDate],
  );
  const doneCount = useMemo(
    () => scheduled.filter((h) => isDone(h, completionFor(h.id, selectedDate, completions))).length,
    [scheduled, completions, selectedDate],
  );
  const pct = scheduled.length === 0 ? 0 : Math.round((doneCount / scheduled.length) * 100);
  const missed = useMemo(() => (isToday ? missedYesterday(habits, completions, today) : []), [isToday, habits, completions, today]);
  const hasAnyHabit = habits.filter((h) => !h.archived).length > 0;

  if (!ready) {
    return (
      <SafeAreaView style={s.root}>
        <View style={s.center}>
          <ActivityIndicator size="large" color={c.primary} />
          <Text style={s.loadingText}>Loading your day…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.root}>
      <ScrollView contentContainerStyle={s.content}>
        <Text style={s.greeting}>{greeting()}{prefs.goal ? ` · ${prefs.goal}` : ''}</Text>
        <Text style={s.date}>{formatLongDate(selectedDate)}</Text>
        <ErrorBanner message={loadError} />
        {!isToday ? (
          <Card>
            <Text style={s.note}>Viewing past day — this day is read-only. Switch back to today to check habits off.</Text>
          </Card>
        ) : null}
        {isToday && missed.length > 0 ? (
          <Card>
            <Text style={s.note}>
              You missed {missed.length === 1 ? '1 habit' : `${missed.length} habits`} yesterday: {missed.map((h) => h.name).join(', ')}.
            </Text>
          </Card>
        ) : null}

        <View style={s.strip}>
          {dateStrip.map((d) => {
            const active = d === selectedDate;
            const day = new Date(`${d}T12:00:00`);
            return (
              <Pressable
                key={d}
                style={[s.day, active && s.dayActive]}
                onPress={() => setSelectedDate(d)}
                accessibilityRole="button"
              >
                <Text style={[s.dayLabel, active && s.dayLabelActive]}>{WEEKDAY_SHORT[dayOfWeek(d)] ?? ''}</Text>
                <Text style={[s.dayNum, active && s.dayLabelActive]}>{day.getDate()}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={s.ringWrap}>
          <ProgressRing pct={pct} label={`${doneCount} of ${scheduled.length} done`} />
        </View>
        <Text style={s.progressTitle}>Today&apos;s progress</Text>

        {!hasAnyHabit ? (
          <EmptyState
            title="No habits yet"
            detail="Add your first habit and start building your streak."
            actionLabel="Add habit"
            onAction={() => nav.push({ name: 'habitForm' })}
          />
        ) : scheduled.length === 0 ? (
          <EmptyState
            title="Nothing scheduled"
            detail={isToday ? 'No habits are scheduled for today. Add a habit or check another day.' : 'No habits were scheduled for this day.'}
            actionLabel={isToday ? 'Add habit' : undefined}
            onAction={isToday ? () => nav.push({ name: 'habitForm' }) : undefined}
          />
        ) : (
          SLOTS.map((slot) => {
            const group = scheduled.filter((h) => h.timeSlot === slot.key);
            if (group.length === 0) return null;
            return (
              <View key={slot.key} style={s.group}>
                <SectionTitle>{slot.label}</SectionTitle>
                {group.map((h) => (
                  <HabitRow key={h.id} habit={h} selectedDate={selectedDate} isToday={isToday} nav={nav} />
                ))}
              </View>
            );
          })
        )}

        <View style={s.actions}>
          <PrimaryButton label="Add habit" onPress={() => nav.push({ name: 'habitForm' })} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: c.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  loadingText: { fontSize: type.body, color: c.muted },
  content: { padding: spacing.lg, gap: spacing.md },
  greeting: { fontSize: type.title, fontWeight: '600', color: c.ink },
  date: { fontSize: type.body, color: c.muted },
  note: { fontSize: type.body, color: c.muted, lineHeight: 20 },
  strip: { flexDirection: 'row', gap: spacing.sm, justifyContent: 'space-between' },
  day: { flex: 1, minHeight: 48, backgroundColor: c.surfaceAlt, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', gap: 2 },
  dayActive: { backgroundColor: c.surfaceTonal },
  dayLabel: { fontSize: type.small, color: c.muted },
  dayNum: { fontSize: type.label, fontWeight: '600', color: c.ink },
  dayLabelActive: { color: c.ink },
  ringWrap: { alignItems: 'center', marginVertical: spacing.sm },
  progressTitle: { fontSize: type.subtitle, fontWeight: '600', color: c.ink },
  group: { gap: spacing.sm },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: c.surface, borderRadius: radius.lg, padding: spacing.lg, minHeight: 48,
  },
  rowMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: 48 },
  tile: { width: 40, height: 40, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  tileText: { fontSize: 18 },
  rowText: { flex: 1, gap: 2 },
  rowName: { fontSize: type.label, fontWeight: '600', color: c.ink },
  rowDetail: { fontSize: type.small, color: c.muted },
  toggle: { minHeight: 48, minWidth: 88, borderRadius: radius.md, backgroundColor: c.surfaceTonal, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.sm },
  toggleDone: { backgroundColor: c.primary },
  toggleText: { fontSize: type.small, fontWeight: '600', color: c.ink },
  toggleTextDone: { color: c.onPrimary },
  controls: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  stepper: { width: 48, height: 48, borderRadius: radius.md, backgroundColor: c.surfaceTonal, alignItems: 'center', justifyContent: 'center' },
  stepperText: { fontSize: 20, color: c.ink },
  valueText: { fontSize: type.small, fontWeight: '600', color: c.ink, minWidth: 44, textAlign: 'center' },
  mini: { minHeight: 48, borderRadius: radius.md, backgroundColor: c.surfaceTonal, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.sm },
  miniActive: { backgroundColor: c.primary },
  miniFailed: { backgroundColor: c.error },
  miniText: { fontSize: type.small, fontWeight: '600', color: c.ink },
  miniTextActive: { color: c.onPrimary },
  miniTextFailed: { color: '#FFFFFF' },
  actions: { marginTop: spacing.sm },
});
