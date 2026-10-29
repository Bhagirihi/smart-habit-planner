import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useStore } from '../store';
import { spacing, type, type Palette } from '../theme';
import { useTheme } from '../useTheme';
import { Card, EmptyState, GhostButton, ProgressBar, SectionTitle } from '../components/ui';
import { HabitAvatar, HabitRow } from '../components/HabitRow';
import type { Nav } from '../navigation';
import type { TimeSlot } from '../types';
import { addDays, formatLongDate, todayKey, weekStartKey } from '../lib/dates';
import { computeStreak, dayStatus, isDone, isDueOn, missedYesterday } from '../lib/streaks';

const SLOTS: { key: TimeSlot; label: string }[] = [
  { key: 'morning', label: 'Morning' },
  { key: 'afternoon', label: 'Afternoon' },
  { key: 'evening', label: 'Evening' },
];

const WEEK_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
    wrap: { flexGrow: 1, padding: spacing.lg, gap: 14, backgroundColor: c.bg },
    heroCard: { borderRadius: 26, padding: spacing.lg, overflow: 'hidden' },
    heroRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    heroText: { flex: 1, gap: 2 },
    date: { fontSize: type.small, color: '#E6F4F1', fontWeight: '700', textTransform: 'uppercase' },
    hero: { fontSize: type.title, fontWeight: '800', color: '#fff', lineHeight: 28 },
    heroSub: { fontSize: type.body, color: '#E6F4F1', marginTop: 4 },
    ring: { width: 96, height: 96, borderRadius: 48, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
    ringPct: { fontSize: 24, fontWeight: '800', color: '#0F766E' },
    ringLabel: { fontSize: type.caption, color: '#6B7280', fontWeight: '700' },
    weekRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 4 },
    weekDay: { flex: 1, alignItems: 'center', gap: 2, paddingVertical: 8, borderRadius: 14, minHeight: 56, justifyContent: 'center' },
    weekDaySelected: { backgroundColor: c.primary },
    weekDayLabel: { fontSize: type.caption, color: c.muted, fontWeight: '700' },
    weekDayLabelSelected: { color: '#fff' },
    weekDayNum: { fontSize: type.body, fontWeight: '800', color: c.ink },
    weekDayNumSelected: { color: '#fff' },
    weekDayToday: { borderWidth: 1.5, borderColor: c.amber },
    toggleRow: { flexDirection: 'row', gap: 8 },
    toggleBtn: { flex: 1, minHeight: 48, borderRadius: 999, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: c.border, backgroundColor: c.surface },
    toggleBtnActive: { backgroundColor: c.primary, borderColor: c.primary },
    toggleText: { fontSize: type.body, fontWeight: '700', color: c.ink },
    toggleTextActive: { color: '#fff' },
    missedCard: { borderColor: c.red, backgroundColor: c.redSoft },
    missedTitle: { fontSize: type.body, fontWeight: '700', color: c.red },
    missedBody: { fontSize: type.body, color: c.ink, lineHeight: 22, marginTop: 4 },
    cardTitle: { fontSize: type.subtitle, fontWeight: '700', color: c.ink },
    cardBody: { fontSize: type.body, color: c.muted, lineHeight: 22, marginVertical: 6 },
    rowBtns: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
    note: { fontSize: type.small, color: c.muted, lineHeight: 19, marginTop: 8 },
    list: { gap: 10 },
    skipRow: { alignItems: 'flex-start', marginTop: 4, marginBottom: 4 },
    streakRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    streakName: { flex: 1 },
    streakHabitName: { fontSize: type.body, fontWeight: '800', color: c.ink },
    streakMeta: { fontSize: type.small, color: c.amber, fontWeight: '800' },
    streakGrid: { gap: 3, marginTop: 8 },
    streakGridRow: { flexDirection: 'row', gap: 3 },
    streakCell: { flex: 1, aspectRatio: 1, borderRadius: 5, borderWidth: 1 },
  });
}

export default function Today({ nav }: { nav: Nav }): React.JSX.Element {
  const c = useTheme();
  const styles = useMemo(() => makeStyles(c), [c]);
  const { state, toggleDone, toggleSkip } = useStore();
  const today = todayKey();
  const [showPermissionCard, setShowPermissionCard] = useState(true);
  const [selectedDate, setSelectedDate] = useState(today);
  const [view, setView] = useState<'list' | 'streak'>('list');
  const isToday = selectedDate === today;

  const due = useMemo(
    () => state.habits.filter((h) => isDueOn(h, selectedDate) && !h.paused),
    [state.habits, selectedDate],
  );
  const doneCount = due.filter((h) => dayStatus(h, selectedDate, state.checkIns, today) === 'done').length;
  const pct = due.length === 0 ? 0 : Math.round((doneCount / due.length) * 100);
  const missed = missedYesterday(state.habits, state.checkIns, today);
  const weekStart = weekStartKey(selectedDate);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <ScrollView contentContainerStyle={styles.wrap}>
      <LinearGradient colors={[...c.gradient]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.heroCard}>
        <View style={styles.heroRow}>
          <View style={styles.heroText}>
            <Text style={styles.date}>{formatLongDate(selectedDate)}</Text>
            <Text style={styles.hero}>{greeting()}!</Text>
            <Text style={styles.heroSub}>
              {doneCount === 0 ? 'A fresh start today' : pct === 100 ? 'All done. Well done.' : `${doneCount} of ${due.length} done`}
            </Text>
          </View>
          <View style={styles.ring}>
            <Text style={styles.ringPct}>{pct}%</Text>
            <Text style={styles.ringLabel}>done</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.weekRow}>
        {weekDays.map((d, i) => {
          const selected = d === selectedDate;
          const isTodayDay = d === today;
          return (
            <Pressable
              key={d}
              onPress={() => setSelectedDate(d)}
              style={[styles.weekDay, selected && styles.weekDaySelected, isTodayDay && !selected && styles.weekDayToday]}
              accessibilityRole="button"
              accessibilityState={{ selected }}
            >
              <Text style={[styles.weekDayLabel, selected && styles.weekDayLabelSelected]}>{WEEK_LABELS[i]}</Text>
              <Text style={[styles.weekDayNum, selected && styles.weekDayNumSelected]}>{Number(d.slice(8, 10))}</Text>
            </Pressable>
          );
        })}
      </View>
      {!isToday ? <GhostButton label="Back to today" onPress={() => setSelectedDate(today)} /> : null}

      <View style={styles.toggleRow}>
        <Pressable onPress={() => setView('list')} style={[styles.toggleBtn, view === 'list' && styles.toggleBtnActive]} accessibilityRole="button">
          <Text style={[styles.toggleText, view === 'list' && styles.toggleTextActive]}>List View</Text>
        </Pressable>
        <Pressable onPress={() => setView('streak')} style={[styles.toggleBtn, view === 'streak' && styles.toggleBtnActive]} accessibilityRole="button">
          <Text style={[styles.toggleText, view === 'streak' && styles.toggleTextActive]}>Streak View</Text>
        </Pressable>
      </View>

      <Card>
        <Text style={styles.cardTitle}>Today's progress · {pct}%</Text>
        <ProgressBar value={pct} />
      </Card>

      {isToday && missed.length > 0 ? (
        <Card style={styles.missedCard}>
          <Text style={styles.missedTitle}>Yesterday's streaks reset</Text>
          <Text style={styles.missedBody}>{missed.map((h) => h.name).join(', ')} {missed.length === 1 ? 'was' : 'were'} not done yesterday. Start again today, one tap at a time.</Text>
        </Card>
      ) : null}

      {isToday && showPermissionCard && !state.settings.notificationsEnabled ? (
        <Card>
          <Text style={styles.cardTitle}>Never miss a habit</Text>
          <Text style={styles.cardBody}>Allow reminders and this app will nudge you at each habit's reminder time, plus an evening review.</Text>
          <View style={styles.rowBtns}>
            <GhostButton label="Allow reminders" onPress={() => { setShowPermissionCard(false); nav.goTab('settings'); }} />
            <GhostButton label="Not now" onPress={() => setShowPermissionCard(false)} />
          </View>
          <Text style={styles.note}>You can turn this on any time from Settings. The system permission prompt appears there, after this explanation, never without warning.</Text>
        </Card>
      ) : null}

      {view === 'streak' ? (
        state.habits.length === 0 ? (
          <EmptyState
            title="No habits yet"
            detail="Add your first habit and its 4-week streak grid will appear here."
            actionLabel="Add your first habit"
            onAction={() => nav.push({ name: 'habitForm' })}
          />
        ) : (
          state.habits.filter((h) => !h.paused).map((h) => {
            const streak = computeStreak(h, state.checkIns, today);
            const days28 = Array.from({ length: 28 }, (_, i) => addDays(selectedDate, i - 27));
            return (
              <Card key={h.id}>
                <View style={styles.streakRow}>
                  <HabitAvatar habit={h} />
                  <View style={styles.streakName}>
                    <Text style={styles.streakHabitName}>{h.name}</Text>
                    <Text style={styles.streakMeta}>{streak > 0 ? `▲ ${streak}-day streak` : 'No streak yet'}</Text>
                  </View>
                </View>
                <View style={styles.streakGrid}>
                  {[0, 1, 2, 3].map((w) => (
                    <View key={w} style={styles.streakGridRow}>
                      {days28.slice(w * 7, w * 7 + 7).map((d) => {
                        const s = dayStatus(h, d, state.checkIns, today);
                        const bg = s === 'done' ? h.color : s === 'missed' ? c.redSoft : s === 'skipped' ? c.amberSoft : c.surface2;
                        return <View key={d} style={[styles.streakCell, { backgroundColor: bg, borderColor: c.border }]} />;
                      })}
                    </View>
                  ))}
                </View>
              </Card>
            );
          })
        )
      ) : state.habits.length === 0 ? (
        <EmptyState
          title="No habits yet"
          detail="Add your first habit and it will appear here, grouped by morning, afternoon and evening."
          actionLabel="Add your first habit"
          onAction={() => nav.push({ name: 'habitForm' })}
        />
      ) : due.length === 0 ? (
        <EmptyState title="Nothing due on this day" detail="Your habits are set for other days, or paused. Add a daily habit to see it here every day." actionLabel="Add a habit" onAction={() => nav.push({ name: 'habitForm' })} />
      ) : (
        SLOTS.map((slot) => {
          const items = due.filter((h) => h.slot === slot.key);
          if (items.length === 0) return null;
          return (
            <View key={slot.key}>
              <SectionTitle>{slot.label}</SectionTitle>
              <View style={styles.list}>
                {items.map((h) => (
                  <View key={h.id}>
                    <HabitRow
                      habit={h}
                      date={selectedDate}
                      checkIns={state.checkIns}
                      onToggle={() => toggleDone(h, selectedDate)}
                      onOpen={() => nav.push({ name: 'habitDetail', habitId: h.id })}
                    />
                    {h.skipDates.includes(selectedDate) || isDone(h, selectedDate, state.checkIns) ? null : (
                      <View style={styles.skipRow}>
                        <GhostButton label="Mark this day as skip" onPress={() => toggleSkip(h.id, selectedDate)} />
                      </View>
                    )}
                  </View>
                ))}
              </View>
            </View>
          );
        })
      )}

      <Card>
        <Text style={styles.cardTitle}>Weekly report</Text>
        <Text style={styles.cardBody}>Every Sunday, see what worked and get 1 to 3 small changes to try next week.</Text>
        <GhostButton label="View weekly report" onPress={() => nav.push({ name: 'weeklyReport' })} />
      </Card>
    </ScrollView>
  );
}
