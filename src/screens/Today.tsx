import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { c, spacing, type } from '../theme';
import { Btn, Card, IconTile, Note, Ring, Row, Screen, Title } from '../components/ui';
import { HABITS, WEEK_DATES, WEEK_DAYS, FREE_TIER_DAYS_LEFT, FREE_HABIT_LIMIT, FREE_ROUTINE_LIMIT } from '../data';
import type { ScreenProps } from './props';

const SLOTS = [{ id: 'morning', label: 'Morning' }, { id: 'afternoon', label: 'Afternoon' }, { id: 'evening', label: 'Evening' }] as const;

export default function Today({ nav, ui }: ScreenProps) {
  const doneCount = HABITS.filter((h) => ui.done.has(h.id)).length;
  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Title>Good morning, Dhruv</Title>
        <Text style={{ color: c.primary, fontSize: type.body, marginBottom: spacing.sm }}>Keep going, you're doing great!</Text>
        <View style={{ alignSelf: 'flex-start', backgroundColor: c.surface, borderColor: c.border, borderWidth: 1, borderRadius: 20, paddingVertical: 6, paddingHorizontal: 12, marginBottom: spacing.md }}>
          <Text style={{ color: c.muted, fontSize: type.small }}>Free tier · <Text style={{ color: c.primary, fontWeight: '800' }}>{FREE_TIER_DAYS_LEFT} days left</Text> · {FREE_HABIT_LIMIT} habits, {FREE_ROUTINE_LIMIT} routine</Text>
        </View>
        <Ring done={doneCount} total={HABITS.length} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.lg }}>
          {WEEK_DAYS.map((d, i) => (
            <View key={d} style={{ alignItems: 'center', backgroundColor: i === 3 ? c.primary : c.surface, borderColor: c.border, borderWidth: 1, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 6 }}>
              <Text style={{ color: i === 3 ? c.onPrimary : c.muted, fontSize: type.small, fontWeight: '700' }}>{d}</Text>
              <Text style={{ color: i === 3 ? c.onPrimary : c.ink, fontWeight: '700' }}>{WEEK_DATES[i]}</Text>
            </View>
          ))}
        </View>
        {!ui.tourDismissed && (
          <Card>
            <Text style={{ color: c.ink, fontWeight: '700' }}>Tour: tap a row for detail, tap ✓ to check off</Text>
            <Text style={{ color: c.muted, marginTop: 4 }}>The ring shows done-of-scheduled. Tap + to add a habit or routine.</Text>
            <Btn label="Got it" onPress={ui.dismissTour} />
          </Card>
        )}
        {SLOTS.map((slot) => {
          const rows = HABITS.filter((h) => h.slot === slot.id);
          if (rows.length === 0) return null;
          return (
            <View key={slot.id}>
              <Text style={{ color: c.ink, fontSize: type.subtitle, fontWeight: '700', marginBottom: spacing.sm }}>{slot.label}</Text>
              {rows.map((h) => {
                const done = ui.done.has(h.id);
                return (
                  <Pressable key={h.id} onPress={() => nav.push({ name: 'habitDetail', habitId: h.id })} style={{ minHeight: 64, flexDirection: 'row', alignItems: 'center', backgroundColor: c.surface, borderColor: c.border, borderWidth: 1, borderRadius: 16, padding: spacing.md, marginBottom: spacing.sm }}>
                    <IconTile icon={h.icon} color={h.color} />
                    <View style={{ flex: 1, marginLeft: spacing.md }}>
                      <Text style={{ color: c.ink, fontWeight: '700' }}>{h.name}</Text>
                      <Text style={{ color: c.muted, fontSize: type.small }}>🔥 {h.streak}-day streak · {h.target} · {h.reminder}</Text>
                    </View>
                    <Pressable onPress={() => ui.toggleDone(h.id)} style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: done ? h.color : c.surfaceAlt, borderColor: h.color, borderWidth: 1, alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ color: done ? c.onPrimary : h.color, fontWeight: '800', fontSize: 18 }}>{done ? '✓' : '○'}</Text>
                    </Pressable>
                  </Pressable>
                );
              })}
            </View>
          );
        })}
        <Row><Btn label="Habits Grid" ghost onPress={() => nav.push({ name: 'habitsGrid' })} /><Btn label="Weekly Report" ghost onPress={() => nav.push({ name: 'weeklyReport' })} /></Row>
        <Note>UI preview: checking a habit only changes this session. Reloading resets to the static data.</Note>
      </ScrollView>
    </Screen>
  );
}
