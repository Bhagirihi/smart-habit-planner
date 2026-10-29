import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Chip, ErrorBanner, PrimaryButton, SecondaryButton } from '../components/ui';
import { useStore } from '../store';
import type { Nav } from '../navigation';
import { isValidDateKey, todayKey } from '../lib/dates';
import { HABIT_COLORS, HABIT_ICONS, c, radius, spacing, type } from '../theme';
import { FREE_HABIT_LIMIT, newHabitDefaults } from '../types';
import type { FrequencyType, HabitType, NewHabitInput, TimeSlot } from '../types';

const TIME_SLOTS: { key: TimeSlot; label: string; range: string }[] = [
  { key: 'morning', label: 'Morning', range: '6:00 - 9:00 AM' },
  { key: 'afternoon', label: 'Afternoon', range: '12:00 - 5:00 PM' },
  { key: 'evening', label: 'Evening', range: '6:00 - 10:00 PM' },
];

const WEEKDAY_CHIPS: { label: string; value: number }[] = [
  { label: 'Mon', value: 1 }, { label: 'Tue', value: 2 }, { label: 'Wed', value: 3 },
  { label: 'Thu', value: 4 }, { label: 'Fri', value: 5 }, { label: 'Sat', value: 6 },
  { label: 'Sun', value: 0 },
];

export function isValidTime(value: string): boolean {
  const m = /^(\d{2}):(\d{2})$/.exec(value);
  if (!m || m[1] === undefined || m[2] === undefined) return false;
  const hh = Number(m[1]);
  const mm = Number(m[2]);
  return hh >= 0 && hh <= 23 && mm >= 0 && mm <= 59;
}

export function isStrictDateKey(value: string): boolean {
  if (!isValidDateKey(value)) return false;
  const parts = value.split('-');
  const y = Number(parts[0]);
  const mo = Number(parts[1]);
  const d = Number(parts[2]);
  const parsed = new Date(`${value}T12:00:00`);
  return parsed.getFullYear() === y && parsed.getMonth() + 1 === mo && parsed.getDate() === d;
}

function parseSkipDays(raw: string): { days: string[]; bad: string[] } {
  const entries = raw.split(',').map((e) => e.trim()).filter((e) => e.length > 0);
  const days: string[] = [];
  const bad: string[] = [];
  for (const e of entries) {
    if (isStrictDateKey(e)) days.push(e);
    else bad.push(e);
  }
  return { days, bad };
}

export default function HabitForm({ nav }: { nav: Nav }) {
  const { habits, isPremium, addHabit, updateHabit, rescheduleReminder } = useStore();
  const editingId = nav.route.name === 'habitForm' ? nav.route.habitId : undefined;
  const existing = editingId ? habits.find((h) => h.id === editingId) : undefined;
  const isNew = !editingId;
  const today = todayKey();

  const initial: NewHabitInput = existing
    ? {
        name: existing.name, icon: existing.icon, color: existing.color, type: existing.type,
        target: existing.target, unit: existing.unit, frequency: existing.frequency,
        weekdays: existing.weekdays, weeklyTarget: existing.weeklyTarget, timeSlot: existing.timeSlot,
        startDate: existing.startDate, skipDays: existing.skipDays,
        reminderEnabled: existing.reminderEnabled, reminderTime: existing.reminderTime,
      }
    : newHabitDefaults(today);

  const [name, setName] = useState(initial.name);
  const [icon, setIcon] = useState(initial.icon);
  const [color, setColor] = useState(initial.color);
  const [habitType, setHabitType] = useState<HabitType>(initial.type);
  const [targetText, setTargetText] = useState(String(initial.target));
  const [unit, setUnit] = useState(initial.unit);
  const [frequency, setFrequency] = useState<FrequencyType>(initial.frequency);
  const [weekdays, setWeekdays] = useState<number[]>(initial.weekdays);
  const [weeklyTarget, setWeeklyTarget] = useState(initial.weeklyTarget);
  const [timeSlot, setTimeSlot] = useState<TimeSlot>(initial.timeSlot);
  const [reminderEnabled, setReminderEnabled] = useState(initial.reminderEnabled);
  const [reminderTime, setReminderTime] = useState(initial.reminderTime ?? '09:00');
  const [startDate, setStartDate] = useState(initial.startDate);
  const [skipDaysRaw, setSkipDaysRaw] = useState(initial.skipDays.join(', '));
  const [error, setError] = useState<string | null>(null);
  const [reminderNote, setReminderNote] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const toggleWeekday = (value: number) => {
    setWeekdays((prev) => (prev.includes(value) ? prev.filter((d) => d !== value) : [...prev, value]));
  };

  const handleSave = async () => {
    setError(null);
    setReminderNote(null);
    setSuccess(null);
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Enter a habit name.');
      return;
    }
    if (!isStrictDateKey(startDate)) {
      setError('Enter a valid start date in YYYY-MM-DD format, for example 2026-10-29.');
      return;
    }
    if (frequency === 'weekdays' && weekdays.length === 0) {
      setError('Choose at least one weekday for specific weekdays.');
      return;
    }
    if (frequency === 'weekly' && (weeklyTarget < 1 || weeklyTarget > 7)) {
      setError('Weekly target must be between 1 and 7.');
      return;
    }
    const { days: skipDays, bad } = parseSkipDays(skipDaysRaw);
    if (bad.length > 0) {
      setError(`These skip days are not valid dates and were not saved: ${bad.join(', ')}. Use YYYY-MM-DD format, separated by commas.`);
      return;
    }
    let target = 1;
    if (habitType === 'measurable') {
      const parsed = Number(targetText);
      if (!Number.isFinite(parsed) || parsed < 1) {
        setError('Enter a target of 1 or more for a measurable habit.');
        return;
      }
      target = Math.floor(parsed);
    }
    if (reminderEnabled && !isValidTime(reminderTime)) {
      setError('Enter a valid reminder time in HH:MM format, between 00:00 and 23:59.');
      return;
    }

    const input: NewHabitInput = {
      name: trimmedName, icon, color, type: habitType, target, unit: unit.trim(),
      frequency, weekdays, weeklyTarget, timeSlot, startDate, skipDays,
      reminderEnabled, reminderTime: reminderEnabled ? reminderTime : null,
    };

    if (isNew) {
      const activeCount = habits.filter((h) => !h.archived).length;
      if (!isPremium && activeCount >= FREE_HABIT_LIMIT) {
        setError('Free allows up to 5 active habits. Upgrade to Premium to add more. Your form has been kept as-is.');
        nav.openPaywall(nav.route);
        return;
      }
      setSaving(true);
      const result = addHabit(input);
      if (!result.ok || !result.habit) {
        setSaving(false);
        setError(result.message ?? 'This habit could not be saved. Your form has been kept as-is.');
        return;
      }
      // Reminder result is surfaced, never silent: on denial the habit is
      // already saved, the form is kept, and no navigation happens, so the
      // user sees the reason and can fix permissions or disable reminders.
      const reminder = await rescheduleReminder(result.habit, null);
      setSaving(false);
      if (!reminder.ok) {
        setReminderNote(reminder.message);
        return;
      }
      setSuccess('Habit saved.');
      setTimeout(() => nav.goTab('today'), 900);
      return;
    }

    if (!existing) {
      setError('This habit no longer exists, so it could not be updated.');
      return;
    }
    const updated = { ...existing, ...input };
    updateHabit(updated);
    const reminder = await rescheduleReminder(updated, existing);
    if (!reminder.ok) {
      setReminderNote(reminder.message);
      return;
    }
    setSuccess('Habit saved.');
    setTimeout(() => nav.back(), 900);
  };

  return (
    <SafeAreaView style={s.root}>
      <ScrollView contentContainerStyle={s.content}>
        <Text style={s.title}>{isNew ? 'Add habit' : 'Edit habit'}</Text>
        {!isNew && !existing ? (
          <ErrorBanner message="This habit no longer exists." />
        ) : null}
        <ErrorBanner message={error} />
        {reminderNote ? (
          <View style={s.reminderNote}>
            <Text style={s.reminderNoteText}>{reminderNote}</Text>
          </View>
        ) : null}
        {success ? (
          <View style={s.success}>
            <Text style={s.successText}>{success}</Text>
          </View>
        ) : null}

        <Text style={s.label}>Name</Text>
        <TextInput
          style={s.input} value={name} onChangeText={setName}
          placeholder="For example, Drink water" placeholderTextColor={c.muted}
          accessibilityLabel="Habit name"
        />

        <Text style={s.label}>Icon</Text>
        <View style={s.wrap}>
          {HABIT_ICONS.map((ic) => (
            <Pressable key={ic} style={[s.iconBtn, icon === ic && s.iconBtnActive]} onPress={() => setIcon(ic)} accessibilityRole="button">
              <Text style={s.iconText}>{ic}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={s.label}>Colour</Text>
        <View style={s.wrap}>
          {HABIT_COLORS.map((col) => (
            <Pressable
              key={col.id}
              style={[s.colorBtn, { backgroundColor: col.value }, color === col.value && s.colorBtnActive]}
              onPress={() => setColor(col.value)}
              accessibilityRole="button"
              accessibilityLabel={`${col.id} colour`}
            />
          ))}
        </View>

        <Text style={s.label}>Type</Text>
        <View style={s.wrap}>
          <Chip label="Do it" active={habitType === 'do'} onPress={() => setHabitType('do')} />
          <Chip label="Avoid it" active={habitType === 'avoid'} onPress={() => setHabitType('avoid')} />
          <Chip label="Measurable" active={habitType === 'measurable'} onPress={() => setHabitType('measurable')} />
        </View>

        {habitType === 'measurable' ? (
          <View style={s.fieldGroup}>
            <Text style={s.label}>Target</Text>
            <TextInput
              style={s.input} value={targetText} onChangeText={setTargetText}
              keyboardType="number-pad" placeholder="8" placeholderTextColor={c.muted}
              accessibilityLabel="Measurable target number"
            />
            <Text style={s.label}>Unit</Text>
            <TextInput
              style={s.input} value={unit} onChangeText={setUnit}
              placeholder="Glasses, pages, minutes" placeholderTextColor={c.muted}
              accessibilityLabel="Measurable unit"
            />
            <Text style={s.hint}>
              Partial progress counts toward your target on the day, but the streak counts only when you reach 100% of the target.
            </Text>
          </View>
        ) : null}

        <Text style={s.label}>Frequency</Text>
        <View style={s.wrap}>
          <Chip label="Every day" active={frequency === 'daily'} onPress={() => setFrequency('daily')} />
          <Chip label="Specific weekdays" active={frequency === 'weekdays'} onPress={() => setFrequency('weekdays')} />
          <Chip label="X times per week" active={frequency === 'weekly'} onPress={() => setFrequency('weekly')} />
        </View>

        {frequency === 'weekdays' ? (
          <View style={s.wrap}>
            {WEEKDAY_CHIPS.map((d) => (
              <Chip key={d.value} label={d.label} active={weekdays.includes(d.value)} onPress={() => toggleWeekday(d.value)} />
            ))}
          </View>
        ) : null}

        {frequency === 'weekly' ? (
          <View style={s.stepperRow}>
            <Text style={s.label}>Times per week</Text>
            <View style={s.stepperControls}>
              <Pressable style={s.stepper} onPress={() => setWeeklyTarget(Math.max(1, weeklyTarget - 1))} accessibilityRole="button">
                <Text style={s.stepperText}>−</Text>
              </Pressable>
              <Text style={s.stepperValue}>{weeklyTarget}</Text>
              <Pressable style={s.stepper} onPress={() => setWeeklyTarget(Math.min(7, weeklyTarget + 1))} accessibilityRole="button">
                <Text style={s.stepperText}>+</Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        <Text style={s.label}>Time of day</Text>
        <View style={s.slotRow}>
          {TIME_SLOTS.map((slot) => (
            <Pressable
              key={slot.key}
              style={[s.slotBtn, timeSlot === slot.key && s.slotBtnActive]}
              onPress={() => setTimeSlot(slot.key)}
              accessibilityRole="button"
            >
              <Text style={[s.slotLabel, timeSlot === slot.key && s.slotLabelActive]}>{slot.label}</Text>
              <Text style={s.slotRange}>{slot.range}</Text>
            </Pressable>
          ))}
        </View>

        <View style={s.switchRow}>
          <Text style={s.label}>Reminder</Text>
          <Switch value={reminderEnabled} onValueChange={setReminderEnabled} trackColor={{ false: c.border, true: c.primary }} />
        </View>
        {reminderEnabled ? (
          <TextInput
            style={s.input} value={reminderTime} onChangeText={setReminderTime}
            placeholder="09:00" placeholderTextColor={c.muted}
            keyboardType="numbers-and-punctuation" maxLength={5}
            accessibilityLabel="Reminder time in HH:MM format"
          />
        ) : null}
        {reminderEnabled ? <Text style={s.hint}>Reminder scheduling is handled when the habit is saved.</Text> : null}

        <Text style={s.label}>Start date</Text>
        <TextInput
          style={s.input} value={startDate} onChangeText={setStartDate}
          placeholder="2026-10-29" placeholderTextColor={c.muted}
          keyboardType="numbers-and-punctuation" maxLength={10}
          accessibilityLabel="Start date in YYYY-MM-DD format"
        />

        <Text style={s.label}>Skip / rest days (optional)</Text>
        <TextInput
          style={s.input} value={skipDaysRaw} onChangeText={setSkipDaysRaw}
          placeholder="2026-11-02, 2026-11-09" placeholderTextColor={c.muted}
          accessibilityLabel="Skip days as comma-separated YYYY-MM-DD dates"
        />
        <Text style={s.hint}>Separate dates with commas, for example 2026-11-02, 2026-11-09.</Text>

        <View style={s.actions}>
          <PrimaryButton label={saving ? 'Saving…' : 'Save habit'} onPress={handleSave} />
          <SecondaryButton label="Back" onPress={() => nav.back()} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: c.bg },
  content: { padding: spacing.lg, gap: spacing.md },
  title: { fontSize: type.title, fontWeight: '600', color: c.ink },
  label: { fontSize: type.label, fontWeight: '600', color: c.ink, marginTop: spacing.sm },
  input: {
    minHeight: 48, backgroundColor: c.surfaceAlt, borderColor: c.border, borderWidth: 1,
    borderRadius: radius.md, paddingHorizontal: spacing.md, color: c.ink, fontSize: type.body,
  },
  hint: { fontSize: type.small, color: c.muted, lineHeight: 18 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  slotRow: { flexDirection: 'row', gap: spacing.sm },
  slotBtn: { flex: 1, minHeight: 56, borderRadius: radius.full, backgroundColor: c.surfaceAlt, alignItems: 'center', justifyContent: 'center', gap: 2, paddingHorizontal: spacing.sm },
  slotBtnActive: { backgroundColor: c.surfaceTonal },
  slotLabel: { fontSize: type.small, fontWeight: '500', color: c.muted },
  slotLabelActive: { color: c.ink },
  slotRange: { fontSize: type.small, color: c.muted, textAlign: 'center' },
  iconBtn: { width: 48, height: 48, borderRadius: radius.md, backgroundColor: c.surfaceAlt, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: c.border },
  iconBtnActive: { borderColor: c.primary, backgroundColor: c.surfaceTonal },
  iconText: { fontSize: 20 },
  colorBtn: { width: 48, height: 48, borderRadius: 24, borderWidth: 2, borderColor: 'transparent' },
  colorBtnActive: { borderColor: c.ink },
  fieldGroup: { gap: spacing.sm },
  stepperRow: { gap: spacing.sm },
  stepperControls: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  stepper: { width: 48, height: 48, borderRadius: radius.md, backgroundColor: c.surfaceTonal, alignItems: 'center', justifyContent: 'center' },
  stepperText: { fontSize: 20, color: c.ink },
  stepperValue: { fontSize: type.subtitle, fontWeight: '600', color: c.ink, minWidth: 32, textAlign: 'center' },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  success: { backgroundColor: c.surfaceTonal, borderRadius: radius.md, padding: spacing.md },
  successText: { fontSize: type.body, fontWeight: '600', color: c.primary },
  reminderNote: { backgroundColor: c.surfaceAlt, borderWidth: 1, borderColor: c.error, borderRadius: radius.md, padding: spacing.md },
  reminderNoteText: { fontSize: type.body, color: c.ink, lineHeight: 20 },
  actions: { gap: spacing.sm, marginTop: spacing.sm },
});
