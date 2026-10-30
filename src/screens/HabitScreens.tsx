import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { c, spacing, type } from '../theme';
import { Back, Btn, Card, Field, Heatmap, IconTile, Note, Row, Screen, Sub, Title } from '../components/ui';
import { HABITS } from '../data';
import type { ScreenProps } from './props';

function habitById(id: string) {
  return HABITS.find((h) => h.id === id) ?? HABITS[0]!;
}

export function HabitDetail({ nav, ui }: ScreenProps) {
  const route = nav.route;
  const habitId = route.name === 'habitDetail' ? route.habitId : 'water';
  const h = habitById(habitId);
  const done = ui.done.has(h.id);
  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Back label="‹ Back" onPress={nav.back} />
        <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: spacing.md }}>
          <IconTile icon={h.icon} color={h.color} />
          <View style={{ marginLeft: spacing.md }}>
            <Title>{h.name}</Title>
            <Text style={{ color: c.muted }}>🔥 {h.streak}-day streak · Best {h.bestStreak} days · {h.rate}% this month</Text>
          </View>
        </View>
        <Card><Text style={{ color: c.ink, fontWeight: '700', marginBottom: spacing.sm }}>Today: {done ? 'Done ✓' : 'Not done yet'}</Text><Text style={{ color: c.muted }}>Target: {h.target} · Reminder: {h.reminder}</Text><Btn label={done ? 'Undo today' : 'Mark done today'} onPress={() => ui.toggleDone(h.id)} /></Card>
        <Card><Text style={{ color: c.ink, fontWeight: '700', marginBottom: spacing.sm }}>Last 6 weeks — heatmap</Text><Heatmap color={h.color} habitId={h.id} /><Text style={{ color: c.muted, fontSize: type.small, marginTop: spacing.sm }}>Legend: full colour = done, green = partial, dark = scheduled-missed, faint = unscheduled/future.</Text></Card>
        <Card><Text style={{ color: c.ink, fontWeight: '700' }}>Weekly totals (static)</Text><Text style={{ color: c.muted, marginTop: 4 }}>Week 1: 5/7 · Week 2: 6/7 · Week 3: 4/7 · Week 4: 6/7</Text></Card>
        <Btn label="Edit habit" onPress={() => nav.push({ name: 'habitForm', habitId: h.id })} />
        <Note>Past dates are read-only in this UI preview.</Note>
      </ScrollView>
    </Screen>
  );
}

export function HabitForm({ nav }: ScreenProps) {
  const route = nav.route;
  const existing = route.name === 'habitForm' && route.habitId ? habitById(route.habitId) : undefined;
  const [name, setName] = useState(existing?.name ?? '');
  const [target, setTarget] = useState(existing?.target ?? '');
  const [reminder, setReminder] = useState(existing?.reminder ?? '7:30 AM');
  const [slot, setSlot] = useState<string>(existing?.slot ?? 'morning');
  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Back label="‹ Back" onPress={nav.back} />
        <Title>{existing ? 'Edit habit' : 'Add habit'}</Title>
        <Sub>UI preview only — Save returns to Today and does not persist anything.</Sub>
        <Field label="Habit name" value={name} onChange={setName} placeholder="e.g. Drink water" />
        <Field label="Target" value={target} onChange={setTarget} placeholder="e.g. 8 glasses" />
        <Field label="Reminder time" value={reminder} onChange={setReminder} placeholder="7:30 AM" />
        <Text style={{ color: c.ink, fontWeight: '700', marginBottom: spacing.sm }}>Time slot</Text>
        {(['morning', 'afternoon', 'evening'] as const).map((s) => (
          <Pressable key={s} onPress={() => setSlot(s)} style={{ minHeight: 48, backgroundColor: slot === s ? c.tonal : c.surface, borderColor: slot === s ? c.primary : c.border, borderWidth: 1, borderRadius: 12, padding: spacing.md, marginBottom: spacing.sm, justifyContent: 'center' }}>
            <Text style={{ color: c.ink }}>{slot === s ? '● ' : '○ '}{s === 'morning' ? 'Morning (6:00 - 9:00 AM)' : s === 'afternoon' ? 'Afternoon (12:00 - 3:00 PM)' : 'Evening (6:00 - 9:00 PM)'}</Text>
          </Pressable>
        ))}
        <Row><Text style={{ color: c.ink }}>Icon preview</Text><IconTile icon={existing?.icon ?? '✓'} color={existing?.color ?? c.primary} /></Row>
        <Btn label="Save (UI preview)" onPress={() => nav.goTab('today')} />
        <Btn label="Upgrade to Premium — see paywall" ghost onPress={nav.openPaywall} />
      </ScrollView>
    </Screen>
  );
}

export function HabitsGrid({ nav }: ScreenProps) {
  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Back label="‹ Back" onPress={nav.back} />
        <Title>Habits Grid</Title>
        <Sub>One card per habit, with a last-6-months heatmap. Tap a card for detail.</Sub>
        {HABITS.map((h) => (
          <Pressable key={h.id} onPress={() => nav.push({ name: 'habitDetail', habitId: h.id })}>
            <Card>
              <Row><View style={{ flexDirection: 'row', alignItems: 'center' }}><IconTile icon={h.icon} color={h.color} /><Text style={{ color: c.ink, fontWeight: '700', marginLeft: spacing.md }}>{h.name}</Text></View><Text style={{ color: c.amber, fontWeight: '700' }}>🔥 {h.streak}</Text></Row>
              <View style={{ marginTop: spacing.md }}><Heatmap color={h.color} habitId={h.id} cells={42} /></View>
              <Text style={{ color: c.muted, fontSize: type.small, marginTop: spacing.sm }}>{h.rate}% this month · Best {h.bestStreak} days</Text>
            </Card>
          </Pressable>
        ))}
      </ScrollView>
    </Screen>
  );
}
