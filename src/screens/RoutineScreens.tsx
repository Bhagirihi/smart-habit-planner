import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { c, spacing, type } from '../theme';
import { Back, Btn, Card, Field, Note, Row, Screen, Sub, Title } from '../components/ui';
import { HABITS, ROUTINES } from '../data';
import type { ScreenProps } from './props';

function routineById(id: string) {
  return ROUTINES.find((r) => r.id === id) ?? ROUTINES[0]!;
}

export function Routines({ nav }: ScreenProps) {
  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Title>Routines</Title>
        <Sub>Named, ordered habit sequences. Tap one to run it step by step.</Sub>
        {ROUTINES.map((r) => (
          <Pressable key={r.id} onPress={() => nav.push({ name: 'routineDetail', routineId: r.id })}>
            <Card>
              <Row><Text style={{ color: c.ink, fontWeight: '700', fontSize: type.subtitle }}>{r.name}</Text><Text style={{ color: c.primary, fontWeight: '700' }}>{r.percent}%</Text></Row>
              <Text style={{ color: c.muted, marginTop: 4 }}>Starts {r.startTime} · {r.habitIds.length} habits</Text>
              <View style={{ height: 8, backgroundColor: c.surfaceAlt, borderRadius: 4, marginTop: spacing.md }}><View style={{ width: `${r.percent}%`, height: 8, backgroundColor: c.primary, borderRadius: 4 }} /></View>
            </Card>
          </Pressable>
        ))}
        <Btn label="Create routine" onPress={() => nav.push({ name: 'routineForm' })} />
        <Note>Free preview: 1 routine is free in the full spec; a 2nd routine would open the paywall. This UI does not enforce limits.</Note>
      </ScrollView>
    </Screen>
  );
}

export function RoutineDetail({ nav, ui }: ScreenProps) {
  const route = nav.route;
  const r = routineById(route.name === 'routineDetail' ? route.routineId : 'morning');
  const steps = r.habitIds.map((id) => HABITS.find((h) => h.id === id)!).filter(Boolean);
  const step = steps[Math.min(ui.runStep, steps.length - 1)];
  const finished = ui.runStep >= steps.length;
  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Back label="‹ Back" onPress={nav.back} />
        <Title>{r.name}</Title>
        <Sub>Starts {r.startTime} · {r.percent}% complete · Run Mode, step by step.</Sub>
        <Card>
          <Text style={{ color: c.ink, fontWeight: '700' }}>{finished ? 'Run complete 🎉' : `Step ${ui.runStep + 1} of ${steps.length}`}</Text>
          {!finished && step && (
            <View style={{ marginTop: spacing.md }}>
              <Text style={{ fontSize: 32 }}>{step.icon}</Text>
              <Text style={{ color: c.ink, fontSize: type.subtitle, fontWeight: '700', marginTop: spacing.sm }}>{step.name}</Text>
              <Text style={{ color: c.muted }}>{step.target} · {step.reminder}</Text>
              <Btn label="Mark step done → Next" onPress={() => ui.setRunStep(ui.runStep + 1)} />
            </View>
          )}
          {finished && <Btn label="Restart run" onPress={() => ui.setRunStep(0)} />}
        </Card>
        <Text style={{ color: c.ink, fontWeight: '700', marginBottom: spacing.sm }}>All steps</Text>
        {steps.map((s, i) => (
          <Card key={s.id}><Text style={{ color: c.ink }}>{i + 1}. {s.icon} {s.name} — {i < ui.runStep || finished ? '✓ Done (session only)' : 'Pending'}</Text></Card>
        ))}
        <Btn label="Edit routine" onPress={() => nav.push({ name: 'routineForm', routineId: r.id })} />
      </ScrollView>
    </Screen>
  );
}

export function RoutineForm({ nav }: ScreenProps) {
  const route = nav.route;
  const existing = route.name === 'routineForm' && route.routineId ? routineById(route.routineId) : undefined;
  const [name, setName] = useState(existing?.name ?? '');
  const [time, setTime] = useState(existing?.startTime ?? '7:00 AM');
  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Back label="‹ Back" onPress={nav.back} />
        <Title>{existing ? 'Edit routine' : 'Create routine'}</Title>
        <Sub>UI preview only — Save returns to Routines and does not persist anything.</Sub>
        <Field label="Routine name" value={name} onChange={setName} placeholder="e.g. Morning routine" />
        <Field label="Start time" value={time} onChange={setTime} placeholder="7:00 AM" />
        <Text style={{ color: c.ink, fontWeight: '700', marginBottom: spacing.sm }}>Habits in this routine (tap order is static in this preview)</Text>
        {HABITS.slice(0, 3).map((h, i) => (
          <Card key={h.id}><Text style={{ color: c.ink }}>{i + 1}. {h.icon} {h.name}</Text></Card>
        ))}
        <Btn label="Save routine (UI preview)" onPress={() => nav.goTab('routines')} />
      </ScrollView>
    </Screen>
  );
}
