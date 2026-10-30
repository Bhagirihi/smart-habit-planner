// Habits grid: one card per habit, all habits, not only today-due ones.
// Pattern only from the reference image (icon tile, name, streak, today's
// badge, per-habit heatmap) — all numbers come from real stored records.
import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, EmptyState, SecondaryButton } from '../components/ui';
import { IconTile } from '../components/IconTile';
import { InfoTip } from '../components/Tooltip';
import { useStore } from '../store';
import type { Nav } from '../navigation';
import { todayKey } from '../lib/dates';
import { cellColor, cellState, monthsForWindow } from '../lib/heatmap';
import { completionFor, computeStreak, isDone } from '../services/streaks';
import { c, radius, spacing, type } from '../theme';
import type { Habit } from '../types';

function totalDone(habit: Habit, completions: ReturnType<typeof useStore>['completions']): number {
  return completions.filter((x) => x.habitId === habit.id && isDone(habit, x)).length;
}

function HabitCard({ habit, nav }: { habit: Habit; nav: Nav }) {
  const { completions, toggleDone, setMeasurableValue, setStatus } = useStore();
  const today = todayKey();
  const comp = completionFor(habit.id, today, completions);
  const done = isDone(habit, comp);
  const value = comp?.value ?? 0;
  const streak = computeStreak(habit, completions, today);
  const total = totalDone(habit, completions);
  const months = useMemo(() => monthsForWindow(today), [today]);

  const badgeLabel = habit.paused
    ? 'Paused'
    : habit.type === 'measurable'
      ? `${value}/${habit.target} ${habit.unit}`
      : habit.type === 'avoid'
        ? comp?.status === 'done' ? 'Success' : comp?.status === 'failed' ? 'Failed' : 'Not yet'
        : done ? '✓ Done' : 'Not yet';

  return (
    <Card>
      <Pressable onPress={() => nav.push({ name: 'habitDetail', habitId: habit.id })} accessibilityRole="button">
        <View style={s.head}>
          <IconTile icon={habit.icon} color={habit.color} size={44} />
          <View style={s.headText}>
            <Text style={s.name}>{habit.name}</Text>
            <Text style={s.streak}>
              <Text style={s.flame}>🔥 </Text>
              <Text style={s.streakNum}>{streak} day streak · {total} done in total</Text>
            </Text>
          </View>
          <View style={[s.badge, { backgroundColor: habit.color }]}>
            <Text style={s.badgeText}>{badgeLabel}</Text>
          </View>
        </View>
      </Pressable>

      {habit.paused ? null : habit.type === 'do' ? (
        <Pressable style={s.toggle} onPress={() => toggleDone(habit.id, today)} accessibilityRole="button">
          <Text style={s.toggleText}>{done ? '✓ Done · Tap to undo' : 'Mark done for today'}</Text>
        </Pressable>
      ) : habit.type === 'measurable' ? (
        <View style={s.stepRow}>
          <Pressable style={s.step} onPress={() => setMeasurableValue(habit.id, today, Math.max(0, value - 1))} accessibilityRole="button">
            <Text style={s.stepText}>−</Text>
          </Pressable>
          <Text style={s.valueText}>{value}/{habit.target} {habit.unit}</Text>
          <Pressable style={s.step} onPress={() => setMeasurableValue(habit.id, today, value + 1)} accessibilityRole="button">
            <Text style={s.stepText}>+</Text>
          </Pressable>
        </View>
      ) : (
        <View style={s.stepRow}>
          <Pressable style={[s.mini, comp?.status === 'done' && s.miniActive]} onPress={() => setStatus(habit.id, today, 'done')} accessibilityRole="button">
            <Text style={[s.miniText, comp?.status === 'done' && s.miniTextActive]}>Success</Text>
          </Pressable>
          <Pressable style={[s.mini, comp?.status === 'failed' && s.miniFailed]} onPress={() => setStatus(habit.id, today, 'failed')} accessibilityRole="button">
            <Text style={[s.miniText, comp?.status === 'failed' && s.miniTextFailed]}>Failure</Text>
          </Pressable>
        </View>
      )}

      {months.map((m) => (
        <View key={m.key} style={s.month}>
          <Text style={s.monthLabel}>{m.label}</Text>
          <View style={s.cells}>
            {m.days.map((d) => {
              const state = cellState(habit, d, completions, today);
              const faint = state === 'unscheduled' || state === 'future';
              return (
                <View
                  key={d}
                  style={[s.cell, { backgroundColor: cellColor(state, habit.color), opacity: faint ? 0.35 : 1 }]}
                />
              );
            })}
          </View>
        </View>
      ))}
      <Text style={s.legend}>Square in the habit colour = done · Green = partial · Dark square = missed · Faint square = not scheduled or future</Text>
    </Card>
  );
}

export default function HabitsGrid({ nav }: { nav: Nav }) {
  const { habits } = useStore();
  const visible = habits.filter((h) => !h.archived);
  return (
    <SafeAreaView style={s.root}>
      <ScrollView contentContainerStyle={s.content}>
        <View style={s.titleRow}>
          <Text style={s.title}>Habits</Text>
          <InfoTip
            label="About the Habits grid"
            text="Every habit gets one card, with its streak, today's result, and the last 6 months as small squares. A square in the habit's colour means that day was done. Tap a card to open its detail, or use the controls on the card to record today."
          />
        </View>
        <Text style={s.sub}>All habits, with the last 6 months of real completions.</Text>
        {visible.length === 0 ? (
          <EmptyState
            title="No habits yet"
            detail="Add your first habit and start building your streak."
            actionLabel="Add habit"
            onAction={() => nav.push({ name: 'habitForm' })}
          />
        ) : (
          visible.map((h) => <HabitCard key={h.id} habit={h} nav={nav} />)
        )}
        <SecondaryButton label="Add habit" onPress={() => nav.push({ name: 'habitForm' })} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: c.bg },
  content: { padding: spacing.lg, gap: spacing.md },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: type.title, fontWeight: '600', color: c.ink },
  sub: { fontSize: type.body, color: c.muted, lineHeight: 20 },
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  headText: { flex: 1, gap: 2 },
  name: { fontSize: type.label, fontWeight: '600', color: c.ink },
  streak: { fontSize: type.small, color: c.muted },
  flame: { color: c.amber },
  streakNum: { color: c.ink, fontWeight: '600' },
  badge: { minHeight: 32, borderRadius: radius.full, paddingHorizontal: spacing.md, alignItems: 'center', justifyContent: 'center' },
  badgeText: { fontSize: type.small, fontWeight: '600', color: c.onPrimary },
  toggle: { minHeight: 48, borderRadius: radius.md, backgroundColor: c.surfaceTonal, alignItems: 'center', justifyContent: 'center' },
  toggleText: { fontSize: type.label, fontWeight: '600', color: c.ink },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  step: { width: 48, height: 48, borderRadius: radius.md, backgroundColor: c.surfaceTonal, alignItems: 'center', justifyContent: 'center' },
  stepText: { fontSize: 20, color: c.ink },
  valueText: { fontSize: type.label, fontWeight: '600', color: c.ink },
  mini: { minHeight: 48, borderRadius: radius.md, backgroundColor: c.surfaceTonal, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.md },
  miniActive: { backgroundColor: c.primary },
  miniFailed: { backgroundColor: c.error },
  miniText: { fontSize: type.small, fontWeight: '600', color: c.ink },
  miniTextActive: { color: c.onPrimary },
  miniTextFailed: { color: '#FFFFFF' },
  month: { gap: 4 },
  monthLabel: { fontSize: type.small, fontWeight: '600', color: c.ink },
  cells: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  cell: { width: 12, height: 12, borderRadius: 4 },
  legend: { fontSize: type.small, color: c.muted, lineHeight: 18 },
});
