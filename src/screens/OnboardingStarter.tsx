import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ErrorBanner, SecondaryButton } from '../components/ui';
import { STARTER, useStore } from '../store';
import type { Nav } from '../navigation';
import { todayKey } from '../lib/dates';
import { c, radius, spacing, type } from '../theme';
import type { NewHabitInput } from '../types';

export default function OnboardingStarter({ nav }: { nav: Nav }) {
  const { prefs, addHabit, setPrefs } = useStore();
  const goalKey = prefs.goal ?? 'Health';
  const starters = STARTER[goalKey] ?? STARTER.Health ?? [];
  const [selected, setSelected] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const toggle = (index: number) => {
    setError(null);
    setSelected((prev) => (prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]));
  };

  const canStart = selected.length >= 2 && selected.length <= 3;
  const guidance =
    selected.length === 0
      ? 'Choose 2 or 3 habits to start with. Starting small makes the streak easier to keep.'
      : selected.length === 1
        ? 'Pick one more habit to start. You need 2 or 3 to continue.'
        : selected.length > 3
          ? 'You have picked more than 3. Remove one or more to continue with 2 or 3.'
          : `${selected.length} habits selected. Good starting point.`;

  const handleStart = () => {
    if (!canStart) {
      setError('Choose 2 or 3 habits to start with. Starting with 1 habit is not enough to set up your day.');
      return;
    }
    setSaving(true);
    setError(null);
    const today = todayKey();
    for (const index of selected) {
      const item = starters[index];
      if (!item) continue;
      const input: NewHabitInput = {
        name: item.name, icon: item.icon, color: item.color, type: item.type,
        target: item.target, unit: item.unit, frequency: 'daily', weekdays: [1, 2, 3, 4, 5],
        weeklyTarget: 3, timeSlot: item.timeSlot, startDate: today, skipDays: [],
        reminderEnabled: false, reminderTime: null,
      };
      const result = addHabit(input);
      if (!result.ok) {
        setError(result.message ?? 'One of the habits could not be added. Please try again.');
        setSaving(false);
        return;
      }
    }
    setPrefs({ onboardingComplete: true });
    nav.goTab('today');
  };

  return (
    <SafeAreaView style={s.root}>
      <ScrollView contentContainerStyle={s.content}>
        <Text style={s.title}>Pick your starting habits</Text>
        <Text style={s.body}>
          {prefs.goal ? `For ${prefs.goal}, here are six habits to choose from.` : 'Here are six habits to choose from.'}
        </Text>
        <Text style={s.count}>{selected.length} selected · Choose 2 or 3</Text>
        <View style={s.list}>
          {starters.map((item, index) => {
            const active = selected.includes(index);
            return (
              <Pressable
                key={`${item.name}-${index}`}
                style={[s.row, active && s.rowActive]}
                onPress={() => toggle(index)}
                accessibilityRole="button"
              >
                <View style={[s.tile, { backgroundColor: item.color }]}>
                  <Text style={s.tileText}>{item.icon}</Text>
                </View>
                <View style={s.rowText}>
                  <Text style={s.rowName}>{item.name}</Text>
                  <Text style={s.rowDetail}>
                    {item.type === 'measurable' ? `Target ${item.target} ${item.unit}` : 'Daily'} · {item.timeSlot}
                  </Text>
                </View>
                <Text style={s.check}>{active ? '✓' : ''}</Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={s.guidance}>{guidance}</Text>
        <ErrorBanner message={error} />
        <View style={s.actions}>
          <Pressable
            style={[s.primary, !canStart && s.primaryDisabled]}
            onPress={handleStart}
            disabled={!canStart || saving}
            accessibilityRole="button"
          >
            <Text style={s.primaryText}>{saving ? 'Starting your day…' : 'Start my day'}</Text>
          </Pressable>
          <SecondaryButton label="Back" onPress={() => nav.back()} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: c.bg },
  content: { padding: spacing.lg, gap: spacing.md },
  title: { fontSize: type.title, fontWeight: '600', color: c.ink, lineHeight: 32 },
  body: { fontSize: type.body, color: c.muted, lineHeight: 20 },
  count: { fontSize: type.label, fontWeight: '600', color: c.ink },
  list: { gap: spacing.sm },
  row: {
    minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: c.surface, borderRadius: radius.lg, padding: spacing.lg,
    borderWidth: 1, borderColor: c.border,
  },
  rowActive: { borderColor: c.primary, backgroundColor: c.surfaceTonal },
  tile: { width: 40, height: 40, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  tileText: { fontSize: 18 },
  rowText: { flex: 1, gap: 2 },
  rowName: { fontSize: type.label, fontWeight: '600', color: c.ink },
  rowDetail: { fontSize: type.small, color: c.muted },
  check: { fontSize: 18, color: c.primary, width: 24, textAlign: 'center' },
  guidance: { fontSize: type.body, color: c.muted, lineHeight: 20 },
  actions: { gap: spacing.sm },
  primary: { minHeight: 48, borderRadius: radius.md, backgroundColor: c.primary, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.lg },
  primaryDisabled: { opacity: 0.45 },
  primaryText: { fontSize: type.label, fontWeight: '600', color: c.onPrimary },
});
