import React, { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useStore } from '../store';
import { spacing, type, type Palette } from '../theme';
import { useTheme } from '../useTheme';
import { Card, GhostButton, PrimaryButton, ProgressBar, SectionTitle } from '../components/ui';
import { HabitAvatar } from '../components/HabitRow';
import type { Nav } from '../navigation';
import { formatDayLabel, formatTime12h, lastNDays, todayKey } from '../lib/dates';
import { completionRate, computeBestStreak, computeStreak, dayStatus, isDone } from '../lib/streaks';

export default function HabitDetail({ nav, habitId }: { nav: Nav; habitId: string }): React.JSX.Element {
  const { state, toggleDone, addValue, deleteHabit, updateHabit, toggleSkip } = useStore();
  const c = useTheme();
  const styles = useMemo(() => makeStyles(c), [c]);
  const habit = state.habits.find((h) => h.id === habitId);
  const [amount, setAmount] = useState('');
  const today = todayKey();
  if (!habit) {
    return (
      <View style={styles.wrap}>
        <Text style={styles.hero}>Habit not found</Text>
        <GhostButton label="Back" onPress={nav.pop} />
      </View>
    );
  }
  const streak = computeStreak(habit, state.checkIns, today);
  const best = computeBestStreak(habit, state.checkIns, today);
  const rate7 = completionRate(habit, state.checkIns, today, 7);
  const rate30 = completionRate(habit, state.checkIns, today, 30);
  const doneToday = isDone(habit, today, state.checkIns);
  const current = state.checkIns[`${habit.id}|${today}`];
  const gridDays = lastNDays(today, 90);
  const thisHabitId = habit.id;

  function confirmDelete() {
    Alert.alert('Delete habit?', 'This deletes the habit and its history. This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => { deleteHabit(thisHabitId); nav.pop(); } },
    ]);
  }

  return (
    <ScrollView contentContainerStyle={styles.wrap}>
      <View style={styles.header}>
        <HabitAvatar habit={habit} size={64} />
        <View style={{ flex: 1 }}>
          <Text style={styles.hero}>{habit.name}</Text>
          <Text style={styles.meta}>
            {habit.type === 'measurable' ? `Target ${habit.target} ${habit.unit} · ` : ''}{habit.slot} · {habit.reminderTime ? formatTime12h(habit.reminderTime) : 'No reminder'}
          </Text>
        </View>
      </View>

      <View style={styles.stats}>
        <Card style={styles.stat}><Text style={styles.statNum}>{streak}</Text><Text style={styles.statLabel}>Current streak</Text></Card>
        <Card style={styles.stat}><Text style={styles.statNum}>{best}</Text><Text style={styles.statLabel}>Best streak</Text></Card>
        <Card style={styles.stat}><Text style={styles.statNum}>{rate7 === null ? '—' : `${rate7}%`}</Text><Text style={styles.statLabel}>Last 7 days</Text></Card>
      </View>

      <Card>
        <Text style={styles.cardTitle}>Today</Text>
        {habit.type === 'measurable' ? (
          <>
            <Text style={styles.cardBody}>Logged today: {current ?? 0} / {habit.target} {habit.unit}</Text>
            <ProgressBar value={current === undefined ? 0 : Math.min(100, (current / habit.target) * 100)} color={habit.color} />
            <View style={styles.amountRow}>
              <TextInput style={styles.input} keyboardType="numeric" placeholder="Amount" placeholderTextColor={c.muted} value={amount} onChangeText={setAmount} />
              <PrimaryButton label="Log" onPress={() => { const v = Number(amount); if (Number.isFinite(v) && v > 0) { addValue(habit, today, (current ?? 0) + v); setAmount(''); } }} />
            </View>
          </>
        ) : (
          <PrimaryButton label={doneToday ? 'Mark as not done' : 'Mark done today'} onPress={() => toggleDone(habit, today)} />
        )}
        <View style={{ height: 8 }} />
        <GhostButton label={habit.skipDates.includes(today) ? 'Unskip today' : 'Skip today (planned)'} onPress={() => toggleSkip(habit.id, today)} />
        <GhostButton label={habit.paused ? 'Resume habit' : 'Pause habit'} onPress={() => updateHabit({ ...habit, paused: !habit.paused })} />
      </Card>

      <SectionTitle>Last 7 days</SectionTitle>
      <Card>
        {lastNDays(today, 7).map((d) => (
          <View key={d} style={styles.dayRow}>
            <Text style={styles.dayLabel}>{d === today ? 'Today' : formatDayLabel(d)}</Text>
            <Text style={styles.dayStatus}>{dayStatus(habit, d, state.checkIns, today)}</Text>
          </View>
        ))}
      </Card>

      <SectionTitle>Last 3 months</SectionTitle>
      <Card>
        <View style={styles.grid}>
          {gridDays.map((d) => {
            const s = dayStatus(habit, d, state.checkIns, today);
            const bg = s === 'done' ? habit.color : s === 'missed' ? c.redSoft : s === 'skipped' ? c.amberSoft : c.surface2;
            return <View key={d} style={[styles.cell, { backgroundColor: bg }]} />;
          })}
        </View>
        <Text style={styles.legend}>Coloured = done · Pink = missed · Amber = skipped · Grey = not due yet</Text>
        <Text style={styles.meta}>30-day completion: {rate30 === null ? 'No due days yet' : `${rate30}%`}</Text>
      </Card>

      <PrimaryButton label="Edit habit" onPress={() => nav.push({ name: 'habitForm', habitId: habit.id })} />
      <GhostButton label="Delete habit" onPress={confirmDelete} />
      <Text style={styles.note}>Tip: a planned skip does not break your streak. An unplanned missed day does.</Text>
    </ScrollView>
  );
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
    wrap: { flexGrow: 1, padding: spacing.lg, gap: 14, backgroundColor: c.bg },
    header: { flexDirection: 'row', gap: 14, alignItems: 'center' },
    hero: { fontSize: type.title, fontWeight: '800', color: c.ink },
    meta: { fontSize: type.small, color: c.muted, marginTop: 4, lineHeight: 19 },
    stats: { flexDirection: 'row', gap: 10 },
    stat: { flex: 1, alignItems: 'center', gap: 2 },
    statNum: { fontSize: 26, fontWeight: '800', color: c.ink },
    statLabel: { fontSize: type.caption, color: c.muted, textAlign: 'center' },
    cardTitle: { fontSize: type.subtitle, fontWeight: '700', color: c.ink, marginBottom: 6 },
    cardBody: { fontSize: type.body, color: c.muted, marginBottom: 8 },
    amountRow: { flexDirection: 'row', gap: 10, marginTop: 10, alignItems: 'center' },
    input: { flex: 1, borderWidth: 1, borderColor: c.border, borderRadius: 12, minHeight: 48, paddingHorizontal: 12, fontSize: type.body, backgroundColor: c.surface, color: c.ink },
    dayRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: c.border },
    dayLabel: { fontSize: type.body, color: c.ink },
    dayStatus: { fontSize: type.body, fontWeight: '600', color: c.muted, textTransform: 'capitalize' },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
    cell: { width: 22, height: 22, borderRadius: 6, borderWidth: 1, borderColor: c.border },
    legend: { fontSize: type.small, color: c.muted, marginTop: 10, lineHeight: 19 },
    note: { fontSize: type.small, color: c.muted, lineHeight: 19 },
  });
}
