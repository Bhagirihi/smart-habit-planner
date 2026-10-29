import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useStore } from '../store';
import { colors, spacing, type } from '../theme';
import { Card, Chip, GhostButton, PrimaryButton } from '../components/ui';
import { GOALS, newId, starterOptions, starterToHabit } from '../lib/seed';
import { todayKey } from '../lib/dates';
import type { StarterOption } from '../lib/seed';

const WAKE_TIMES = ['06:00', '06:30', '07:00', '07:30', '08:00'];

export default function Onboarding(): React.JSX.Element {
  const { completeOnboarding } = useStore();
  const [step, setStep] = useState(0);
  const [goal, setGoal] = useState(GOALS[0]);
  const [wake, setWake] = useState('07:00');
  const [picked, setPicked] = useState<StarterOption[]>([]);

  const options = starterOptions(goal);

  function finish() {
    const today = todayKey();
    const habits = picked.map((o) => starterToHabit(o, today, newId('habit')));
    completeOnboarding(habits, goal, wake);
  }

  return (
    <ScrollView contentContainerStyle={styles.wrap}>
      {step === 0 ? (
        <>
          <Text style={styles.hero}>Build small habits,{'\n'}keep the streak alive.</Text>
          <Text style={styles.body}>Pick a goal, tick off one small list each day, and watch your streak grow. No account needed to start.</Text>
          <Card>
            <Text style={styles.cardTitle}>What you get</Text>
            <Text style={styles.bullet}>• A simple Today list, grouped by morning, afternoon and evening</Text>
            <Text style={styles.bullet}>• Streaks, a calendar grid, and one useful suggestion every Sunday</Text>
            <Text style={styles.bullet}>• Reminders on your phone, even without internet</Text>
          </Card>
          <PrimaryButton label="Get Started" onPress={() => setStep(1)} />
          <GhostButton label="Skip, start empty" onPress={() => completeOnboarding([], '', '07:00')} />
        </>
      ) : step === 1 ? (
        <>
          <Text style={styles.hero}>What do you want to improve?</Text>
          <Text style={styles.body}>Pick one goal. You can change your habits later, nothing here is locked in.</Text>
          <View style={styles.chips}>
            {GOALS.map((g) => (
              <Chip key={g} label={g} selected={goal === g} onPress={() => { setGoal(g); setPicked([]); }} />
            ))}
          </View>
          <Text style={styles.label}>What time do you usually wake up?</Text>
          <View style={styles.chips}>
            {WAKE_TIMES.map((t) => (
              <Chip key={t} label={t} selected={wake === t} onPress={() => setWake(t)} />
            ))}
          </View>
          <PrimaryButton label="Continue" onPress={() => setStep(2)} />
          <GhostButton label="Back" onPress={() => setStep(0)} />
        </>
      ) : (
        <>
          <Text style={styles.hero}>Pick 2 or 3 to start with</Text>
          <Text style={styles.body}>Starting small beats starting big. You can add more habits any time from the + button.</Text>
          {options.map((o) => {
            const on = picked.some((p) => p.name === o.name);
            return (
              <Card key={o.name}>
                <View style={styles.optRow}>
                  <View style={[styles.dot, { backgroundColor: o.color }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.optName}>{o.name}</Text>
                    <Text style={styles.optMeta}>{o.slot} · {o.reminderTime}</Text>
                  </View>
                  <GhostButton label={on ? 'Added' : 'Add'} onPress={() => setPicked((p) => (on ? p.filter((x) => x.name !== o.name) : [...p, o]))} />
                </View>
              </Card>
            );
          })}
          <PrimaryButton label={picked.length === 0 ? 'Start with no habits' : `Start My Day (${picked.length})`} onPress={finish} />
          <GhostButton label="Back" onPress={() => setStep(1)} />
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { flexGrow: 1, padding: spacing.lg, gap: 14, backgroundColor: colors.bg },
  hero: { fontSize: type.hero, fontWeight: '800', color: colors.ink, lineHeight: 38 },
  body: { fontSize: type.body, color: colors.muted, lineHeight: 22 },
  cardTitle: { fontSize: type.subtitle, fontWeight: '700', color: colors.ink, marginBottom: 6 },
  bullet: { fontSize: type.body, color: colors.ink, lineHeight: 24 },
  chips: { flexDirection: 'row', flexWrap: 'wrap' },
  label: { fontSize: type.body, fontWeight: '700', color: colors.ink, marginTop: 6 },
  optRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dot: { width: 40, height: 40, borderRadius: 20 },
  optName: { fontSize: type.body, fontWeight: '700', color: colors.ink },
  optMeta: { fontSize: type.small, color: colors.muted },
});
