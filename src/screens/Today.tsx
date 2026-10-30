import React, { useEffect, useRef } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { c, spacing, type } from '../theme';
import { Btn, Card, IconTile, Note, Row, Screen, Title } from '../components/ui';
import { WEEK_DAYS, FREE_TIER_DAYS_LEFT, FREE_HABIT_LIMIT, FREE_ROUTINE_LIMIT } from '../data';
import { addDaysString, mondayOfWeek, todayIndexInWeek } from '../widgetData';
import { localToday } from '../streak';
import type { TourTarget } from '../navigation';
import { TOUR_STEPS, tourMeasure } from '../components/Tooltip';
import type { ScreenProps } from './props';

const SLOTS = [{ id: 'morning', label: 'Morning' }, { id: 'afternoon', label: 'Afternoon' }, { id: 'evening', label: 'Evening' }] as const;

// Note: every tour target — wrapper Views AND Pressables — uses
// collapsable={false} so Android does not optimise the view away, which
// would make measureInWindow return its parent's rect instead of the
// element itself (that is one way a frame can land on a neighbour).

export default function Today({ nav, ui }: ScreenProps) {
  const HABITS = ui.habits;
  const doneCount = HABITS.filter((h) => ui.done.has(h.id)).length;
  const pct = HABITS.length > 0 ? Math.round((doneCount / HABITS.length) * 100) : 0;
  // Next habit: first habit not yet done, in slot order
  // morning → afternoon → evening (within a slot, list order). At session
  // start that is Meditate (morning, 7:00 AM) — water, run and walk are
  // already done. Checking a habit off moves "next" to the following
  // undone habit; when all are done the left side says so.
  const slotOrder = ['morning', 'afternoon', 'evening'] as const;
  const nextHabit = slotOrder
    .flatMap((slot) => HABITS.filter((h) => h.slot === slot))
    .find((h) => !ui.done.has(h.id)) ?? null;
  // STEP 8 (QA fix M1): the week strip is computed from the REAL local
  // date — Monday-first week containing today, today highlighted —
  // never from the old hardcoded WEEK_DATES / index 3. Day labels are
  // Mon–Sun (WEEK_DAYS order); dates are the day-of-month numbers
  // (no leading zeros, matching the old display).
  const todayStr = localToday();
  const weekMonday = mondayOfWeek(todayStr);
  const weekDates = [0, 1, 2, 3, 4, 5, 6].map((i) => addDaysString(weekMonday, i));
  const todayIndex = todayIndexInWeek(todayStr);
  const scrollRef = useRef<any>(null);
  const completedRef = useRef<any>(null);
  const freeTierRef = useRef<any>(null);
  const helpRef = useRef<any>(null);
  const firstHabitRef = useRef<any>(null);
  const firstCheckRef = useRef<any>(null);
  // Scroll handshake (replaces the old hard-coded scrollTo y=480, which
  // is wrong on any device whose intro card / font size differs):
  // - slotYRef: Morning slot View's onLayout y = its top in ScrollView
  //   CONTENT coordinates (direct children of a ScrollView report that).
  // - rowYRef: first habit row's onLayout y, relative to its slot View.
  // - contentY = slotY + rowY = the row's top in content coordinates.
  // - scrollYRef: current scroll offset, tracked onScroll.
  const slotYRef = useRef<number | null>(null);
  const rowYRef = useRef<number | null>(null);
  const scrollYRef = useRef(0);
  const pendingScrollRef = useRef(false);
  const scrollFallbackRef = useRef<any>(null);

  useEffect(() => {
    const targets: [TourTarget, React.RefObject<View | null>][] = [
      ['today-completed', completedRef],
      ['today-free-tier', freeTierRef],
      ['today-help', helpRef],
      ['today-first-habit', firstHabitRef],
      ['today-first-check', firstCheckRef],
    ];
    targets.forEach(([key, ref]) => ui.registerTourTarget(key, tourMeasure(ref)));
    return () => targets.forEach(([key]) => ui.unregisterTourTarget(key));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When the tour reaches the habit-row / check steps, scroll Today so
  // the first habit row is fully in view, THEN ask App to re-measure —
  // never measure a stale rect from mid-scroll (that is what made the
  // step-4 frame sit on the Morning header and cut the row's subtitle).
  // Scroll target is computed from measured onLayout positions, not a
  // hard-coded pixel value, so it works on any screen size / font size.
  useEffect(() => {
    if (!ui.tourActive) return;
    const step = TOUR_STEPS[ui.tourStep];
    if (step?.target !== 'today-first-habit' && step?.target !== 'today-first-check') return;
    if (slotYRef.current == null || rowYRef.current == null) {
      // Layout not measured yet (e.g. first mount): ask App to re-measure
      // shortly, rather than scrolling to a guessed offset.
      const t = setTimeout(() => ui.requestTourRemeasure(), 300);
      return () => clearTimeout(t);
    }
    const contentY = slotYRef.current + rowYRef.current;
    const desired = Math.max(0, contentY - 80); // row 80px below viewport top
    if (Math.abs(desired - scrollYRef.current) <= 10) {
      ui.requestTourRemeasure();
      return;
    }
    pendingScrollRef.current = true;
    scrollRef.current?.scrollTo({ y: desired, animated: true });
    // Fallback: some devices do not fire momentum-end for a short scroll.
    if (scrollFallbackRef.current) clearTimeout(scrollFallbackRef.current);
    scrollFallbackRef.current = setTimeout(() => {
      if (pendingScrollRef.current) {
        pendingScrollRef.current = false;
        ui.requestTourRemeasure();
      }
    }, 700);
    return () => { if (scrollFallbackRef.current) clearTimeout(scrollFallbackRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ui.tourActive, ui.tourStep]);

  const handleScrollEnd = () => {
    if (pendingScrollRef.current) {
      pendingScrollRef.current = false;
      if (scrollFallbackRef.current) clearTimeout(scrollFallbackRef.current);
      ui.requestTourRemeasure();
    }
  };

  return (
    <Screen>
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        onScroll={(e) => { scrollYRef.current = e.nativeEvent.contentOffset.y; }}
        scrollEventThrottle={16}
        onMomentumScrollEnd={handleScrollEnd}
        onScrollEndDrag={handleScrollEnd}
      >
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <View style={{ flex: 1 }}><Title>Good morning, Dhruv</Title></View>
          {/* ? target: this Pressable alone, not the header row. */}
          <Pressable ref={helpRef} collapsable={false} onPress={ui.startTour} style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: c.tonal, borderColor: c.border, borderWidth: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: c.primary, fontSize: 20, fontWeight: '800' }}>?</Text>
          </Pressable>
        </View>
        <Text style={{ color: c.primary, fontSize: type.body, marginBottom: spacing.sm }}>Keep going, you're doing great!</Text>
        {/* Free-tier target: this pill View ALONE — not the greeting text
            above it. Its ref is on the pill, so its rect is the pill's. */}
        <View ref={freeTierRef} collapsable={false} style={{ alignSelf: 'flex-start', backgroundColor: c.tonal, borderColor: c.border, borderWidth: 1, borderRadius: 20, paddingVertical: 6, paddingHorizontal: 12, marginBottom: spacing.md }}>
          <Text style={{ color: c.muted, fontSize: type.small }}>Free tier · <Text style={{ color: c.primary, fontWeight: '800' }}>{FREE_TIER_DAYS_LEFT} days left</Text> · {FREE_HABIT_LIMIT} habits, {FREE_ROUTINE_LIMIT} routine</Text>
        </View>
        {/* 1. Week strip, right below the free-tier pill (ring removed).
            Dates + highlight come from the real local date (above). */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.lg }}>
          {WEEK_DAYS.map((d, i) => (
            <View key={d} style={{ alignItems: 'center', backgroundColor: i === todayIndex ? c.primary : c.tonal, borderColor: c.border, borderWidth: 1, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 6 }}>
              <Text style={{ color: i === todayIndex ? c.onPrimary : c.muted, fontSize: type.small, fontWeight: '700' }}>{d}</Text>
              <Text style={{ color: i === todayIndex ? c.onPrimary : c.ink, fontWeight: '700' }}>{Number(weekDates[i]!.split('-')[2]).toString()}</Text>
            </View>
          ))}
        </View>
        {/* 3. Next habit (left) / Habit completed today (right), with a
            progress bar below — count/total + bar, as in the reference. */}
        <View style={{ backgroundColor: c.surface, borderColor: c.border, borderWidth: 1, borderRadius: 16, padding: spacing.md, marginBottom: spacing.lg }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View style={{ flex: 1, marginRight: spacing.md }}>
              <Text style={{ color: c.muted, fontSize: type.small, fontWeight: '700' }}>Next habit</Text>
              {HABITS.length === 0 ? (
                <Text style={{ color: c.ink, fontWeight: '800', marginTop: spacing.sm }}>No habits yet — add your first habit below.</Text>
              ) : nextHabit ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm }}>
                  <IconTile icon={nextHabit.icon} color={nextHabit.color} />
                  <View style={{ flex: 1, marginLeft: spacing.sm }}>
                    <Text style={{ color: c.ink, fontWeight: '800' }}>{nextHabit.name}</Text>
                    <Text style={{ color: c.muted, fontSize: type.small }}>{nextHabit.target} · {nextHabit.reminder}</Text>
                  </View>
                </View>
              ) : (
                <Text style={{ color: c.ink, fontWeight: '800', marginTop: spacing.sm }}>All habits done 🎉</Text>
              )}
            </View>
            {/* Tour target: this right side ALONE — the completed count. */}
            <View ref={completedRef} collapsable={false} style={{ alignItems: 'flex-end' }}>
              <Text style={{ color: c.muted, fontSize: type.small, fontWeight: '700', textAlign: 'right' }}>Habit completed today</Text>
              <Text style={{ color: c.ink, fontSize: 24, fontWeight: '800', marginTop: spacing.sm }}>{doneCount} of {HABITS.length}</Text>
              <Text style={{ color: c.primary, fontWeight: '800' }}>{pct}%</Text>
            </View>
          </View>
          <View style={{ height: 8, borderRadius: 4, backgroundColor: '#334F49', marginTop: spacing.md, overflow: 'hidden' }}>
            <View style={{ height: 8, width: `${pct}%`, backgroundColor: c.primary, borderRadius: 4 }} />
          </View>
        </View>
        {!ui.tourDismissed && (
          <Card>
            <Text style={{ color: c.ink, fontWeight: '700' }}>New here? Take the guided tour</Text>
            <Text style={{ color: c.muted, marginTop: 4 }}>14 short tooltips, each highlighting the actual button or view it explains — the completed-today card, free tier, ?, habit rows, ✓, +, tabs, routines, Progress, Weekly Report, the grid, payment Skip, and Settings.</Text>
            <Btn label="Start guided tour" onPress={ui.startTour} />
            <Btn label="Not now" ghost onPress={ui.dismissTour} />
          </Card>
        )}
        {SLOTS.map((slot, slotIdx) => {
          const rows = HABITS.filter((h) => h.slot === slot.id);
          if (rows.length === 0) return null;
          return (
            // Slot View onLayout (direct ScrollView child) = slot top in
            // content coordinates; the first row's own onLayout is relative
            // to this View, so slotY + rowY = row top in content coordinates.
            <View key={slot.id} onLayout={slotIdx === 0 ? (e) => { slotYRef.current = e.nativeEvent.layout.y; } : undefined}>
              <Text style={{ color: c.ink, fontSize: type.subtitle, fontWeight: '700', marginBottom: spacing.sm }}>{slot.label}</Text>
              {rows.map((h, rowIdx) => {
                const done = ui.done.has(h.id);
                const isFirst = slotIdx === 0 && rowIdx === 0;
                return (
                  // Habit target: this row Pressable ALONE — not the slot
                  // View (which also contains the "Morning" header). That
                  // distinction is what the step-4 frame must respect.
                  <Pressable key={h.id} ref={isFirst ? firstHabitRef : undefined} collapsable={false} onLayout={isFirst ? (e) => { rowYRef.current = e.nativeEvent.layout.y; } : undefined} onPress={() => nav.push({ name: 'habitDetail', habitId: h.id })} style={{ minHeight: 64, flexDirection: 'row', alignItems: 'center', backgroundColor: c.tonal, borderColor: c.border, borderWidth: 1, borderRadius: 16, padding: spacing.md, marginBottom: spacing.sm }}>
                    <IconTile icon={h.icon} color={h.color} />
                    <View style={{ flex: 1, marginLeft: spacing.md }}>
                      <Text style={{ color: c.ink, fontWeight: '700' }}>{h.name}</Text>
                      <Text style={{ color: c.muted, fontSize: type.small }}>🔥 {ui.streaks[h.id] ?? h.streak}-day streak · {h.target} · {h.reminder}</Text>
                    </View>
                    <Pressable ref={isFirst ? firstCheckRef : undefined} collapsable={false} onPress={() => ui.toggleDone(h.id)} style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: done ? h.color : c.surface, borderColor: h.color, borderWidth: 1, alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ color: done ? c.onPrimary : h.color, fontWeight: '800', fontSize: 18 }}>{done ? '✓' : '○'}</Text>
                    </Pressable>
                  </Pressable>
                );
              })}
            </View>
          );
        })}
        <Row><Btn label="Habits Grid" ghost onPress={() => nav.push({ name: 'habitsGrid' })} /><Btn label="Weekly Report" ghost onPress={() => nav.push({ name: 'weeklyReport' })} /></Row>
        <Note>{ui.supabaseConfigured ? 'Supabase is connected: checking a habit saves it to your project.' : 'UI preview: checking a habit only changes this session. Reloading resets to the static data.'}</Note>
      </ScrollView>
    </Screen>
  );
}
