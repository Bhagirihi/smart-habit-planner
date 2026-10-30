import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { c, spacing, type } from '../theme';
import { Back, Btn, Card, Heatmap, Note, Row, Screen, Sub, Title } from '../components/ui';
import { HABITS } from '../data';
import type { ScreenProps } from './props';

export function Progress({ nav }: ScreenProps) {
  const [mode, setMode] = useState<'week' | 'month'>('week');
  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Title>Progress</Title>
        <Row>
          {(['week', 'month'] as const).map((m) => (
            <Pressable key={m} onPress={() => setMode(m)} style={{ flex: 1, minHeight: 48, justifyContent: 'center', alignItems: 'center', backgroundColor: mode === m ? c.primary : c.surface, borderRadius: 12, marginRight: 8 }}>
              <Text style={{ color: mode === m ? c.onPrimary : c.ink, fontWeight: '700' }}>{m === 'week' ? 'This Week' : 'This Month'}</Text>
            </Pressable>
          ))}
        </Row>
        <Card>
          <Text style={{ color: c.ink, fontWeight: '700' }}>Habit Score</Text>
          <Text style={{ color: c.ink, fontSize: 36, fontWeight: '800', marginTop: 4 }}>86%</Text>
          <Text style={{ color: c.muted }}>5/7 days this {mode} · Best streak 26 days</Text>
        </Card>
        <Card>
          <Text style={{ color: c.ink, fontWeight: '700', marginBottom: spacing.sm }}>Week bars</Text>
          {[5, 6, 4, 6, 5, 3, 6].map((v, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
              <Text style={{ color: c.muted, width: 32 }}>{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i]}</Text>
              <View style={{ height: 12, width: v * 28, backgroundColor: c.chart[i % c.chart.length], borderRadius: 6 }} />
              <Text style={{ color: c.ink, marginLeft: 8, fontWeight: '700' }}>{v}/6</Text>
            </View>
          ))}
        </Card>
        <Text style={{ color: c.ink, fontWeight: '700', marginBottom: spacing.sm }}>Per-habit rates</Text>
        {HABITS.map((h) => (
          <Pressable key={h.id} onPress={() => nav.push({ name: 'habitDetail', habitId: h.id })}>
            <Card><Row><Text style={{ color: c.ink, fontWeight: '700' }}>{h.icon} {h.name}</Text><Text style={{ color: c.ink, fontWeight: '700' }}>{h.rate}%</Text></Row><View style={{ marginTop: spacing.sm }}><Heatmap color={h.color} habitId={h.id} cells={28} /></View></Card>
          </Pressable>
        ))}
        <Btn label="Habits Grid" onPress={() => nav.push({ name: 'habitsGrid' })} />
        <Btn label="Weekly Report" ghost onPress={() => nav.push({ name: 'weeklyReport' })} />
      </ScrollView>
    </Screen>
  );
}

export function WeeklyReport({ nav, ui }: ScreenProps) {
  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Back label="‹ Back" onPress={nav.back} />
        <Title>Weekly Report</Title>
        <Sub>Week of Oct 27 – Nov 2 · 28 completions · Best day: Thursday · Best streak: 26 days</Sub>
        <Card><Text style={{ color: c.ink, fontWeight: '700' }}>Lowest habit: Evening journal (62%)</Text><Text style={{ color: c.muted, marginTop: 4 }}>Suggestions below change only this session in this UI preview.</Text></Card>
        {ui.suggestions.map((s) => {
          const h = HABITS.find((x) => x.id === s.habitId);
          return (
            <Card key={s.id}>
              <Text style={{ color: c.ink, fontWeight: '700' }}>{s.title}</Text>
              <Text style={{ color: c.muted, marginTop: 4 }}>{s.reason} {h ? `(${h.name})` : ''}</Text>
              {s.state === 'new' ? (
                <Row><Btn label="Apply" onPress={() => ui.applySuggestion(s.id)} /><Btn label="Dismiss" ghost onPress={() => ui.dismissSuggestion(s.id)} /></Row>
              ) : (
                <Text style={{ color: s.state === 'applied' ? c.accent : c.muted, fontWeight: '700', marginTop: spacing.sm }}>{s.state === 'applied' ? '✓ Applied (session only)' : 'Dismissed'}</Text>
              )}
            </Card>
          );
        })}
        <Note>No backend is involved. Reloading resets every suggestion to New.</Note>
      </ScrollView>
    </Screen>
  );
}
