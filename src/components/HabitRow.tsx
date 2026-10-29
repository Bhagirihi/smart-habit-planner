import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { CheckIns, Habit } from '../types';
import { colors, radii, type } from '../theme';
import { computeStreak, isDone, isSkipped } from '../lib/streaks';
import { formatTime12h } from '../lib/dates';

export function HabitAvatar({ habit, size = 44 }: { habit: Habit; size?: number }): React.JSX.Element {
  const initial = habit.name.trim().charAt(0).toUpperCase() || 'H';
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2, backgroundColor: habit.color }]}>
      <Text style={[styles.avatarText, { fontSize: size * 0.42 }]}>{initial}</Text>
    </View>
  );
}

/**
 * One tappable habit row for Today / routine lists.
 * Checkbox toggles done/undo; tapping the row itself opens detail.
 * Emoji-free: colour + initial, never an emoji icon.
 */
export function HabitRow({
  habit,
  date,
  checkIns,
  onToggle,
  onOpen,
  showStreak = true,
}: {
  habit: Habit;
  date: string;
  checkIns: CheckIns;
  onToggle: () => void;
  onOpen: () => void;
  showStreak?: boolean;
}): React.JSX.Element {
  const done = isDone(habit, date, checkIns);
  const skipped = isSkipped(habit, date);
  const streak = computeStreak(habit, checkIns, date);
  const current = checkIns[`${habit.id}|${date}`];
  const progressText =
    habit.type === 'measurable' && current !== undefined ? `${current} / ${habit.target} ${habit.unit}` : habit.type === 'avoid' ? 'Avoided today' : null;

  return (
    <Pressable onPress={onOpen} style={[styles.row, done && styles.rowDone]} accessibilityRole="button">
      <HabitAvatar habit={habit} />
      <View style={styles.main}>
        <Text style={[styles.name, done && styles.nameDone]} numberOfLines={1}>
          {habit.name}
        </Text>
        <Text style={styles.meta}>
          {habit.reminderTime ? `${formatTime12h(habit.reminderTime)}  ·  ` : ''}
          {skipped ? 'Skipped today' : progressText ?? (habit.paused ? 'Paused' : 'Not done yet')}
        </Text>
        {showStreak && streak > 0 ? <Text style={styles.streak}>▲ {streak}-day streak</Text> : null}
      </View>
      <Pressable
        onPress={onToggle}
        disabled={skipped || habit.paused}
        style={[styles.check, done && styles.checkDone, (skipped || habit.paused) && styles.checkMuted]}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: done, disabled: skipped || habit.paused }}
        hitSlop={8}
      >
        <Text style={[styles.checkText, done && styles.checkTextDone]}>{done ? '✓' : ''}</Text>
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    padding: 14,
    minHeight: 76,
  },
  rowDone: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  main: { flex: 1, gap: 2 },
  name: { fontSize: type.body, fontWeight: '700', color: colors.ink },
  nameDone: { textDecorationLine: 'line-through', color: colors.muted },
  meta: { fontSize: type.small, color: colors.muted },
  streak: { fontSize: type.small, color: colors.amber, fontWeight: '700' },
  avatar: { alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: '800' },
  check: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkDone: { backgroundColor: colors.primary, borderColor: colors.primary },
  checkMuted: { opacity: 0.4 },
  checkText: { fontSize: 22, color: colors.ink },
  checkTextDone: { color: '#fff' },
});
