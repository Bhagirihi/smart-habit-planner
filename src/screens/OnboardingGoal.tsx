import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Chip, ErrorBanner, PrimaryButton, SecondaryButton } from '../components/ui';
import { useStore } from '../store';
import type { Nav } from '../navigation';
import { GOALS, c, radius, spacing, type } from '../theme';
import type { Goal } from '../types';

export function isValidTime(value: string): boolean {
  const m = /^(\d{2}):(\d{2})$/.exec(value);
  if (!m || m[1] === undefined || m[2] === undefined) return false;
  const hh = Number(m[1]);
  const mm = Number(m[2]);
  return hh >= 0 && hh <= 23 && mm >= 0 && mm <= 59;
}

export default function OnboardingGoal({ nav }: { nav: Nav }) {
  const { prefs, setPrefs } = useStore();
  const [goal, setGoal] = useState<Goal | null>(prefs.goal);
  const [wakeTime, setWakeTime] = useState<string>(prefs.wakeTime || '07:00');
  const [error, setError] = useState<string | null>(null);

  const handleContinue = () => {
    if (!goal) {
      setError('Choose a goal to continue.');
      return;
    }
    if (!isValidTime(wakeTime)) {
      setError('Enter a valid wake time in HH:MM format, between 00:00 and 23:59.');
      return;
    }
    setError(null);
    setPrefs({ goal, wakeTime });
    nav.push({ name: 'starter' });
  };

  return (
    <SafeAreaView style={s.root}>
      <ScrollView contentContainerStyle={s.content}>
        <Text style={s.title}>What would you like to work on?</Text>
        <Text style={s.body}>Pick one goal. You can change it later in settings.</Text>
        <View style={s.chips}>
          {GOALS.map((g) => (
            <Chip key={g} label={g} active={goal === g} onPress={() => setGoal(g)} />
          ))}
        </View>
        <Text style={s.label}>Wake time</Text>
        <TextInput
          style={s.input}
          value={wakeTime}
          onChangeText={setWakeTime}
          placeholder="07:00"
          placeholderTextColor={c.muted}
          keyboardType="numbers-and-punctuation"
          maxLength={5}
          accessibilityLabel="Wake time in HH:MM format"
        />
        <Text style={s.hint}>Use 24-hour format, for example 07:00.</Text>
        <ErrorBanner message={error} />
        <View style={s.actions}>
          <PrimaryButton label="Continue" onPress={handleContinue} />
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
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  label: { fontSize: type.label, fontWeight: '600', color: c.ink, marginTop: spacing.sm },
  input: {
    minHeight: 48, backgroundColor: c.surfaceAlt, borderColor: c.border, borderWidth: 1,
    borderRadius: radius.md, paddingHorizontal: spacing.md, color: c.ink, fontSize: type.body,
  },
  hint: { fontSize: type.small, color: c.muted },
  actions: { gap: spacing.sm, marginTop: spacing.sm },
});
