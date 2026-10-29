import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { CheckIns, Habit } from '../types';
import { radii, soft, type, type Palette } from '../theme';
import { useTheme } from '../useTheme';
import { completionRate, computeStreak, isDone, isSkipped } from '../lib/streaks';
import { formatTime12h } from '../lib/dates';
import { ProgressBar } from './ui';

export function HabitAvatar({ habit, size = 44 }: { habit: Habit; size?: number }): React.JSX.Element {
  const initial = habit.name.trim().charAt(0).toUpperCase() || 'H';
  return (
    <View style={[stylesAvatar, { width: size, height: size, borderRadius: size / 2, backgroundColor: habit.color }]}>
      <Text style={[stylesAvatarText, { fontSize: size * 0.42 }]}>{initial}</Text>
    </View>
  );
}

const stylesAvatar = { alignItems: 'center', justifyContent: 'center' } as const;
const stylesAvatarText = { color: '#fff', fontWeight: '800' } as const;

function makeStyles(c: Palette) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      borderWidth: 1.5,
      borderRadius: radii.lg,
      padding: 14,
      minHeight: 84,
      shadowColor: c.shadow,
      shadowOpacity: 0.06,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 3 },
      elevation: 2,
    },
    main: { flex: 1, gap: 3 },
    name: { fontSize: type.body, fontWeight: '800', color: c.ink },
    nameDone: { textDecorationLine: 'line-through', color: c.muted },
    meta: { fontSize: type.small, color: c.muted },
    streak: { fontSize: type.small, color: c.amber, fontWeight: '800' },
    check: {
      width: 48,
      height: 48,
      borderRadius: 24,
      borderWidth: 2,
      backgroundColor: c.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkMuted: { opacity: 0.4 },
    checkText: { fontSize: 22, color: c.ink },
    checkTextDone: { color: '#fff' },
  });
}

/**
 * One colourful, tappable habit card for Today / routine lists.
 * Checkbox toggles done/undo; tapping the card itself opens detail.
 * Emoji-free: colour + initial, never an emoji icon. The card is tinted
 * with the habit's own colour, and the tap circle fills with that colour.
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
  const c = useTheme();
  const styles = useMemo(() => makeStyles(c), [c]);
  const done = isDone(habit, date, checkIns);
  const skipped = isSkipped(habit, date);
  const streak = computeStreak(habit, checkIns, date);
  const current = checkIns[`${habit.id}|${date}`];
  const weekRate = completionRate(habit, checkIns, date, 7) ?? 0;
  const progressText =
    habit.type === 'measurable' && current !== undefined ? `${current} / ${habit.target} ${habit.unit}` : habit.type === 'avoid' ? 'Avoided today' : null;

  return (
    <Pressable
      onPress={onOpen}
      style={[styles.row, { backgroundColor: soft(habit.color, 0.12), borderColor: habit.color }]}
      accessibilityRole="button"
    >
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
        <ProgressBar value={weekRate} color={habit.color} />
      </View>
      <Pressable
        onPress={onToggle}
        disabled={skipped || habit.paused}
        style={[
          styles.check,
          { borderColor: habit.color },
          done && { backgroundColor: habit.color, borderColor: habit.color },
          (skipped || habit.paused) && styles.checkMuted,
        ]}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: done, disabled: skipped || habit.paused }}
        hitSlop={8}
      >
        <Text style={[styles.checkText, done && styles.checkTextDone]}>{done ? '✓' : ''}</Text>
      </Pressable>
    </Pressable>
  );
}
