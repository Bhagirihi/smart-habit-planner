import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useStore } from '../store';
import { colors, HABIT_COLORS, spacing, type } from '../theme';
import { Card, Chip, GhostButton, PrimaryButton } from '../components/ui';
import type { Frequency, Habit, HabitType, TimeSlot } from '../types';
import { FREE_HABIT_LIMIT } from '../types';
import type { Nav } from '../navigation';
import { newId } from '../lib/seed';
import { todayKey } from '../lib/dates';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const TIMES = ['06:00', '07:00', '08:00', '09:00', '12:00', '16:00', '18:00', '19:00', '20:00', '21:00'];

export default function HabitForm({ nav, habitId }: { nav: Nav; habitId?: string }): React.JSX.Element {
  const { state, addHabit, updateHabit, isPremium } = useStore();
  const existing = habitId ? state.habits.find((h) => h.id === habitId) : undefined;

  const [name, setName] = useState(existing?.name ?? '');
  const [color, setColor] = useState(existing?.color ?? HABIT_COLORS[0]);
  const [habitType, setHabitType] = useState<HabitType>(existing?.type ?? 'do');
  const [target, setTarget] = useState(String(existing?.target ?? 1));
  const [unit, setUnit] = useState(existing?.unit ?? '');
  const [freqKind, setFreqKind] = useState<'daily' | 'weekdays' | 'timesPerWeek'>(existing?.frequency.kind ?? 'daily');
  const [days, setDays] = useState<number[]>(existing?.frequency.kind === 'weekdays' ? existing.frequency.days : [1, 2, 3, 4, 5]);
  const [perWeek, setPerWeek] = useState(existing?.frequency.kind === 'timesPerWeek' ? existing.frequency.count : 3);
  const [slot, setSlot] = useState<TimeSlot>(existing?.slot ?? 'morning');
  const [reminderTime, setReminderTime] = useState(existing?.reminderTime ?? '08:00');
  const [reminderOn, setReminderOn] = useState(existing?.reminderEnabled ?? true);
  const [error, setError] = useState('');

  function save() {
    const cleanName = name.trim();
    if (!cleanName) {
      setError('Please enter a habit name.');
      return;
    }
    // Free gate: 6th habit (new habit only, edits are exempt).
    if (!existing && !isPremium && state.habits.length >= FREE_HABIT_LIMIT) {
      nav.openPaywall();
      return;
    }
    let frequency: Frequency = { kind: 'daily' };
    if (freqKind === 'weekdays') frequency = { kind: 'weekdays', days: days.length > 0 ? days : [1] };
    if (freqKind === 'timesPerWeek') frequency = { kind: 'timesPerWeek', count: Math.max(1, Math.min(7, perWeek)) };
    const parsedTarget = habitType === 'measurable' ? Math.max(1, Number(target) || 1) : 1;
    const habit: Habit = {
      id: existing?.id ?? newId('habit'),
      name: cleanName,
      color,
      type: habitType,
      target: parsedTarget,
      unit: habitType === 'measurable' ? unit.trim() : '',
      frequency,
      slot,
      reminderTime: reminderOn ? reminderTime : null,
      reminderEnabled: reminderOn,
      skipDates: existing?.skipDates ?? [],
      paused: existing?.paused ?? false,
      createdAt: existing?.createdAt ?? todayKey(),
    };
    if (existing) updateHabit(habit);
    else addHabit(habit);
    nav.pop();
  }

  return (
    <ScrollView contentContainerStyle={styles.wrap}>
      <Text style={styles.hero}>{existing ? 'Edit habit' : 'New habit'}</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Text style={styles.label}>Name</Text>
      <TextInput style={styles.input} placeholder="e.g. Morning Walk" value={name} onChangeText={setName} maxLength={60} />

      <Text style={styles.label}>Colour</Text>
      <View style={styles.colorRow}>
        {HABIT_COLORS.map((c) => (
          <Text key={c} onPress={() => setColor(c)} style={[styles.colorDot, { backgroundColor: c }, color === c && styles.colorSelected]}>
            {color === c ? '✓' : ' '}
          </Text>
        ))}
      </View>

      <Text style={styles.label}>Type</Text>
      <View style={styles.chips}>
        <Chip label="Do it" selected={habitType === 'do'} onPress={() => setHabitType('do')} />
        <Chip label="Avoid it" selected={habitType === 'avoid'} onPress={() => setHabitType('avoid')} />
        <Chip label="Measurable" selected={habitType === 'measurable'} onPress={() => setHabitType('measurable')} />
      </View>
      {habitType === 'measurable' ? (
        <>
          <Text style={styles.label}>Daily target</Text>
          <View style={styles.row}>
            <TextInput style={[styles.input, { flex: 1 }]} keyboardType="numeric" value={target} onChangeText={setTarget} placeholder="8" />
            <TextInput style={[styles.input, { flex: 1 }]} value={unit} onChangeText={setUnit} placeholder="Unit, e.g. glasses" maxLength={20} />
          </View>
        </>
      ) : null}
      {habitType === 'avoid' ? <Text style={styles.help}>For an avoid habit, tapping Done means you successfully avoided it that day.</Text> : null}

      <Text style={styles.label}>How often?</Text>
      <View style={styles.chips}>
        <Chip label="Every day" selected={freqKind === 'daily'} onPress={() => setFreqKind('daily')} />
        <Chip label="Specific days" selected={freqKind === 'weekdays'} onPress={() => setFreqKind('weekdays')} />
        <Chip label="Times per week" selected={freqKind === 'timesPerWeek'} onPress={() => setFreqKind('timesPerWeek')} />
      </View>
      {freqKind === 'weekdays' ? (
        <View style={styles.chips}>
          {WEEKDAYS.map((d, i) => (
            <Chip key={d} label={d} selected={days.includes(i)} onPress={() => setDays((prev) => (prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]))} />
          ))}
        </View>
      ) : null}
      {freqKind === 'timesPerWeek' ? (
        <View style={styles.chips}>
          {[1, 2, 3, 4, 5, 6, 7].map((n) => (
            <Chip key={n} label={`${n}x`} selected={perWeek === n} onPress={() => setPerWeek(n)} />
          ))}
        </View>
      ) : null}

      <Text style={styles.label}>Time of day</Text>
      <View style={styles.chips}>
        <Chip label="Morning" selected={slot === 'morning'} onPress={() => setSlot('morning')} />
        <Chip label="Afternoon" selected={slot === 'afternoon'} onPress={() => setSlot('afternoon')} />
        <Chip label="Evening" selected={slot === 'evening'} onPress={() => setSlot('evening')} />
      </View>

      <Text style={styles.label}>Reminder</Text>
      <View style={styles.chips}>
        <Chip label="Reminder on" selected={reminderOn} onPress={() => setReminderOn(true)} />
        <Chip label="No reminder" selected={!reminderOn} onPress={() => setReminderOn(false)} />
      </View>
      {reminderOn ? (
        <View style={styles.chips}>
          {TIMES.map((t) => (
            <Chip key={t} label={t} selected={reminderTime === t} onPress={() => setReminderTime(t)} />
          ))}
        </View>
      ) : null}

      <Card>
        <Text style={styles.help}>Free plan allows {FREE_HABIT_LIMIT} habits. Premium unlocks unlimited habits, routines, advanced charts and weekly suggestions.</Text>
      </Card>

      <PrimaryButton label={existing ? 'Save changes' : 'Add habit'} onPress={save} />
      <GhostButton label="Cancel" onPress={nav.pop} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { flexGrow: 1, padding: spacing.lg, gap: 10, backgroundColor: colors.bg },
  hero: { fontSize: type.title, fontWeight: '800', color: colors.ink },
  label: { fontSize: type.body, fontWeight: '700', color: colors.ink, marginTop: 8 },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 12, minHeight: 52, paddingHorizontal: 12, fontSize: type.body, backgroundColor: colors.surface },
  chips: { flexDirection: 'row', flexWrap: 'wrap' },
  colorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  colorDot: { width: 44, height: 44, borderRadius: 22, color: '#fff', textAlign: 'center', lineHeight: 44, fontWeight: '800', overflow: 'hidden' },
  colorSelected: { borderWidth: 3, borderColor: colors.ink },
  row: { flexDirection: 'row', gap: 10 },
  help: { fontSize: type.body, color: colors.muted, lineHeight: 22 },
  error: { fontSize: type.body, color: colors.red, fontWeight: '700' },
});
