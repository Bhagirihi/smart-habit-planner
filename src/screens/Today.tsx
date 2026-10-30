import React, { useEffect, useRef } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { c, spacing, type } from '../theme';
import { Btn, Card, IconTile, Note, Ring, Row, Screen, Title } from '../components/ui';
import { HABITS, WEEK_DATES, WEEK_DAYS, FREE_TIER_DAYS_LEFT, FREE_HABIT_LIMIT, FREE_ROUTINE_LIMIT } from '../data';
import type { TourTarget } from '../navigation';
import { TOUR_STEPS, tourMeasure } from '../components/Tooltip';
import type { ScreenProps } from './props';

const SLOTS = [{ id: 'morning', label: 'Morning' }, { id: 'afternoon', label: 'Afternoon' }, { id: 'evening', label: 'Evening' }] as const;

// Note: wrapper Views use collapsable={false} so Android does not optimise
// them away, which would make measureInWindow return nothing.

export default function Today({ nav, ui }: ScreenProps) {
  const doneCount = HABITS.filter((h) => ui.done.has(h.id)).length;
  const scrollRef = useRef<any>(null);
  const ringRef = useRef<any>(null);
  const freeTierRef = useRef<any>(null);
  const helpRef = useRef<any>(null);
  const firstHabitRef = useRef<any>(null);
  const firstCheckRef = useRef<any>(null);

  useEffect(() => {
    const targets: [TourTarget, React.RefObject<View | null>][] = [
      ['today-ring', ringRef],
      ['today-free-tier', freeTierRef],
      ['today-help', helpRef],
      ['today-first-habit', firstHabitRef],
      ['today-first-check', firstCheckRef],
    ];
    targets.forEach(([key, ref]) => ui.registerTourTarget(key, tourMeasure(ref)));
    return () => targets.forEach(([key]) => ui.unregisterTourTarget(key));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When the tour reaches the habit-row / check steps, scroll Today so the
  // first habit row is in view before App re-measures it (350ms later).
  useEffect(() => {
    if (!ui.tourActive) return;
    const step = TOUR_STEPS[ui.tourStep];
    if (step?.target === 'today-first-habit' || step?.target === 'today-first-check') {
      scrollRef.current?.scrollTo({ y: 480, animated: true });
    }
  }, [ui.tourActive, ui.tourStep]);

  return (
    <Screen>
      <ScrollView ref={scrollRef} showsVerticalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <View style={{ flex: 1 }}><Title>Good morning, Dhruv</Title></View>
          <Pressable ref={helpRef} onPress={ui.startTour} style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: c.surface, borderColor: c.border, borderWidth: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: c.primary, fontSize: 20, fontWeight: '800' }}>?</Text>
          </Pressable>
        </View>
        <Text style={{ color: c.primary, fontSize: type.body, marginBottom: spacing.sm }}>Keep going, you're doing great!</Text>
        <View ref={freeTierRef} collapsable={false} style={{ alignSelf: 'flex-start', backgroundColor: c.surface, borderColor: c.border, borderWidth: 1, borderRadius: 20, paddingVertical: 6, paddingHorizontal: 12, marginBottom: spacing.md }}>
          <Text style={{ color: c.muted, fontSize: type.small }}>Free tier · <Text style={{ color: c.primary, fontWeight: '800' }}>{FREE_TIER_DAYS_LEFT} days left</Text> · {FREE_HABIT_LIMIT} habits, {FREE_ROUTINE_LIMIT} routine</Text>
        </View>
        <View ref={ringRef} collapsable={false}><Ring done={doneCount} total={HABITS.length} /></View>
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
            <Text style={{ color: c.ink, fontWeight: '700' }}>New here? Take the guided tour</Text>
            <Text style={{ color: c.muted, marginTop: 4 }}>14 short tooltips, each highlighting the actual button or view it explains — the ring, free tier, ?, habit rows, ✓, +, tabs, routines, Progress, Weekly Report, the grid, payment Skip, and Settings.</Text>
            <Btn label="Start guided tour" onPress={ui.startTour} />
            <Btn label="Not now" ghost onPress={ui.dismissTour} />
          </Card>
        )}
        {SLOTS.map((slot, slotIdx) => {
          const rows = HABITS.filter((h) => h.slot === slot.id);
          if (rows.length === 0) return null;
          return (
            <View key={slot.id}>
              <Text style={{ color: c.ink, fontSize: type.subtitle, fontWeight: '700', marginBottom: spacing.sm }}>{slot.label}</Text>
              {rows.map((h, rowIdx) => {
                const done = ui.done.has(h.id);
                const isFirst = slotIdx === 0 && rowIdx === 0;
                return (
                  <Pressable key={h.id} ref={isFirst ? firstHabitRef : undefined} onPress={() => nav.push({ name: 'habitDetail', habitId: h.id })} style={{ minHeight: 64, flexDirection: 'row', alignItems: 'center', backgroundColor: c.surface, borderColor: c.border, borderWidth: 1, borderRadius: 16, padding: spacing.md, marginBottom: spacing.sm }}>
                    <IconTile icon={h.icon} color={h.color} />
                    <View style={{ flex: 1, marginLeft: spacing.md }}>
                      <Text style={{ color: c.ink, fontWeight: '700' }}>{h.name}</Text>
                      <Text style={{ color: c.muted, fontSize: type.small }}>🔥 {h.streak}-day streak · {h.target} · {h.reminder}</Text>
                    </View>
                    <Pressable ref={isFirst ? firstCheckRef : undefined} onPress={() => ui.toggleDone(h.id)} style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: done ? h.color : c.surfaceAlt, borderColor: h.color, borderWidth: 1, alignItems: 'center', justifyContent: 'center' }}>
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
