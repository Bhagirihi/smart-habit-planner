import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { c, GOALS, spacing, type } from '../theme';
import { Btn, Card, Note, Screen, Sub, Title } from '../components/ui';
import { STARTER_HABITS } from '../data';
import type { ScreenProps } from './props';

export function Welcome({ nav }: ScreenProps) {
  return (
    <Screen>
      <Text style={{ fontSize: 56 }}>🌿</Text>
      <Title>Welcome to Smart Habit</Title>
      <Sub>Build routines, track habits, and see your streaks grow — one small step at a time. This UI preview uses static data only.</Sub>
      <Card><Text style={{ color: c.ink }}>✓ Today, in under 10 seconds</Text><Text style={{ color: c.muted, marginTop: 4 }}>Check off what is due today. Nothing more.</Text></Card>
      <Card><Text style={{ color: c.ink }}>🔥 Streaks that forgive a planned skip</Text><Text style={{ color: c.muted, marginTop: 4 }}>A planned skip never breaks your streak.</Text></Card>
      <Btn label="Continue" onPress={() => nav.push({ name: 'goal' })} />
      <Pressable onPress={() => nav.push({ name: 'login' })} style={{ minHeight: 48, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: c.primary, fontWeight: '700' }}>I already have an account — Log in</Text></Pressable>
    </Screen>
  );
}

export function Goal({ nav }: ScreenProps) {
  const [goal, setGoal] = useState<string>('Fitness');
  const [wake, setWake] = useState<string>('7:00 AM');
  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Title>What is your goal?</Title>
        <Sub>Pick one goal and a wake time. Every step here requires an action — no empty onboarding.</Sub>
        {GOALS.map((g) => (
          <Pressable key={g} onPress={() => setGoal(g)} style={{ minHeight: 48, backgroundColor: goal === g ? c.tonal : c.surface, borderColor: goal === g ? c.primary : c.border, borderWidth: 1, borderRadius: 12, padding: spacing.md, marginBottom: spacing.sm, justifyContent: 'center' }}>
            <Text style={{ color: c.ink, fontWeight: goal === g ? '700' : '400' }}>{goal === g ? '● ' : '○ '}{g}</Text>
          </Pressable>
        ))}
        <Text style={{ color: c.ink, fontWeight: '700', marginTop: spacing.lg, marginBottom: spacing.sm }}>Wake time</Text>
        {['6:00 AM', '7:00 AM', '8:00 AM'].map((w) => (
          <Pressable key={w} onPress={() => setWake(w)} style={{ minHeight: 48, backgroundColor: wake === w ? c.tonal : c.surface, borderColor: wake === w ? c.primary : c.border, borderWidth: 1, borderRadius: 12, padding: spacing.md, marginBottom: spacing.sm, justifyContent: 'center' }}>
            <Text style={{ color: c.ink }}>{wake === w ? '● ' : '○ '}{w}</Text>
          </Pressable>
        ))}
        <Btn label={`Continue with ${goal} · ${wake}`} onPress={() => nav.push({ name: 'starter' })} />
      </ScrollView>
    </Screen>
  );
}

export function Starter({ nav }: ScreenProps) {
  const [picked, setPicked] = useState<Set<string>>(new Set(['water', 'run']));
  const toggle = (id: string) => {
    const next = new Set(picked);
    if (next.has(id)) next.delete(id); else next.add(id);
    setPicked(next);
  };
  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Title>Pick starter habits</Title>
        <Sub>Tap to pick. In this UI preview your selection is session-only and does not change the static Today list.</Sub>
        {STARTER_HABITS.map((h) => (
          <Pressable key={h.id} onPress={() => toggle(h.id)} style={{ minHeight: 56, flexDirection: 'row', alignItems: 'center', backgroundColor: c.surface, borderColor: picked.has(h.id) ? c.primary : c.border, borderWidth: 1, borderRadius: 12, padding: spacing.md, marginBottom: spacing.sm }}>
            <Text style={{ fontSize: 22, marginRight: spacing.md }}>{h.icon}</Text>
            <Text style={{ color: c.ink, flex: 1 }}>{h.name}</Text>
            <Text style={{ color: c.primary, fontWeight: '700' }}>{picked.has(h.id) ? '✓ Picked' : '+ Pick'}</Text>
          </Pressable>
        ))}
        <Note>Picked: {picked.size} starter habit(s). UI preview only.</Note>
        <Btn label="Finish → Today" onPress={() => nav.goTab('today')} />
        <Btn label="Skip to Today" ghost onPress={() => nav.goTab('today')} />
      </ScrollView>
    </Screen>
  );
}
