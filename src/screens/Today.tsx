import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useStore } from '../store';
import { colors, spacing, type } from '../theme';
import { Card, EmptyState, GhostButton, ProgressBar, SectionTitle } from '../components/ui';
import { HabitRow } from '../components/HabitRow';
import type { Nav } from '../navigation';
import type { TimeSlot } from '../types';
import { formatLongDate, todayKey } from '../lib/dates';
import { dayStatus, isDone, isDueOn, missedYesterday } from '../lib/streaks';

const SLOTS: { key: TimeSlot; label: string }[] = [
  { key: 'morning', label: 'Morning' },
  { key: 'afternoon', label: 'Afternoon' },
  { key: 'evening', label: 'Evening' },
];

export default function Today({ nav }: { nav: Nav }): React.JSX.Element {
  const { state, toggleDone, toggleSkip } = useStore();
  const today = todayKey();
  const [showPermissionCard, setShowPermissionCard] = useState(true);

  const dueToday = useMemo(() => state.habits.filter((h) => isDueOn(h, today) && !h.paused), [state.habits, today]);
  const doneToday = dueToday.filter((h) => dayStatus(h, today, state.checkIns, today) === 'done').length;
  const pct = dueToday.length === 0 ? 0 : Math.round((doneToday / dueToday.length) * 100);
  const missed = missedYesterday(state.habits, state.checkIns, today);

  return (
    <ScrollView contentContainerStyle={styles.wrap}>
      <Text style={styles.date}>{formatLongDate(today)}</Text>
      <Text style={styles.hero}>{doneToday === 0 ? 'A fresh start today' : pct === 100 ? 'All done. Well done.' : `${doneToday} of ${dueToday.length} done`}</Text>

      <Card>
        <Text style={styles.progressText}>Today's progress · {pct}%</Text>
        <ProgressBar value={pct} />
      </Card>

      {missed.length > 0 ? (
        <Card style={styles.missedCard}>
          <Text style={styles.missedTitle}>Yesterday's streaks reset</Text>
          <Text style={styles.missedBody}>{missed.map((h) => h.name).join(', ')} {missed.length === 1 ? 'was' : 'were'} not done yesterday. Start again today, one tap at a time.</Text>
        </Card>
      ) : null}

      {showPermissionCard && !state.settings.notificationsEnabled ? (
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

      {state.habits.length === 0 ? (
        <EmptyState
          title="No habits yet"
          detail="Add your first habit and it will appear here, grouped by morning, afternoon and evening."
          actionLabel="Add your first habit"
          onAction={() => nav.push({ name: 'habitForm' })}
        />
      ) : dueToday.length === 0 ? (
        <EmptyState title="Nothing due today" detail="Your habits are set for other days, or paused. Add a daily habit to see it here every day." actionLabel="Add a habit" onAction={() => nav.push({ name: 'habitForm' })} />
      ) : (
        SLOTS.map((slot) => {
          const items = dueToday.filter((h) => h.slot === slot.key);
          if (items.length === 0) return null;
          return (
            <View key={slot.key}>
              <SectionTitle>{slot.label}</SectionTitle>
              <View style={styles.list}>
                {items.map((h) => (
                  <View key={h.id}>
                    <HabitRow
                      habit={h}
                      date={today}
                      checkIns={state.checkIns}
                      onToggle={() => toggleDone(h, today)}
                      onOpen={() => nav.push({ name: 'habitDetail', habitId: h.id })}
                    />
                    {h.skipDates.includes(today) || isDone(h, today, state.checkIns) ? null : (
                      <View style={styles.skipRow}>
                        <GhostButton label="Mark today as skip" onPress={() => toggleSkip(h.id, today)} />
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

const styles = StyleSheet.create({
  wrap: { flexGrow: 1, padding: spacing.lg, gap: 14, backgroundColor: colors.bg },
  date: { fontSize: type.small, color: colors.muted, fontWeight: '700', textTransform: 'uppercase' },
  hero: { fontSize: type.title, fontWeight: '800', color: colors.ink },
  progressText: { fontSize: type.body, fontWeight: '700', color: colors.ink, marginBottom: 8 },
  missedCard: { borderColor: colors.red, backgroundColor: colors.redSoft },
  missedTitle: { fontSize: type.body, fontWeight: '700', color: colors.red },
  missedBody: { fontSize: type.body, color: colors.ink, lineHeight: 22, marginTop: 4 },
  cardTitle: { fontSize: type.subtitle, fontWeight: '700', color: colors.ink },
  cardBody: { fontSize: type.body, color: colors.muted, lineHeight: 22, marginVertical: 6 },
  rowBtns: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
  note: { fontSize: type.small, color: colors.muted, lineHeight: 19, marginTop: 8 },
  list: { gap: 10 },
  skipRow: { alignItems: 'flex-start', marginTop: 4, marginBottom: 4 },
});
