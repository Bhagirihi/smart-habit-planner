import React, { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { c, spacing, type } from '../theme';
import { Back, Btn, Card, Heatmap, Note, Row, Screen, Sub, Title } from '../components/ui';
import { tourMeasure } from '../components/Tooltip';
import { addDaysString, localTodayString, mondayOfWeek } from '../widgetData';
import type { ScreenProps } from './props';

const WEEK_DAYS_MON_SUN = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function Progress({ nav, ui }: ScreenProps) {
  const [mode, setMode] = useState<'week' | 'month'>('week');
  const scoreRef = useRef<any>(null);
  useEffect(() => {
    ui.registerTourTarget('progress-score', tourMeasure(scoreRef));
    return () => ui.unregisterTourTarget('progress-score');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
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
        <View ref={scoreRef} collapsable={false}><Card>
          <Text style={{ color: c.ink, fontWeight: '700' }}>Habit Score</Text>
          <Text style={{ color: c.ink, fontSize: 36, fontWeight: '800', marginTop: 4 }}>86%</Text>
          <Text style={{ color: c.muted }}>5/7 days this {mode} · Best streak 26 days</Text>
          {/* STEP 8 (QA fix M4): these Progress numbers are hardcoded
              and are NOT computed from real history — unlike the
              Weekly Report, which computes from history when signed
              in. Label them, never present them as measured. */}
          <Text style={{ color: c.muted, fontSize: type.small, marginTop: spacing.sm }}>Static preview — the score, week bars, and per-habit rates on this screen are not yet computed from real history. See Weekly Report for real numbers when signed in with Supabase configured.</Text>
        </Card></View>
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
        {ui.habits.map((h) => (
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
  const firstRef = useRef<any>(null);
  useEffect(() => {
    ui.registerTourTarget('report-first', tourMeasure(firstRef));
    return () => ui.unregisterTourTarget('report-first');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // STEP 7 (real Weekly Report): when historySource is 'real', every
  // number below is computed from ui.completionHistory — the Supabase
  // rows for a signed-in user — for the Mon–Sun week containing today
  // (local dates, Monday first). When it is 'static', the old
  // hardcoded values are shown WITH a clear "static preview" label —
  // they are never presented as measured. No other source is used.
  const today = localTodayString();
  const monday = mondayOfWeek(today);
  const sunday = addDaysString(monday, 6);
  const weekDays = WEEK_DAYS_MON_SUN;
  let total = 28;
  let bestDay = 'Thursday';
  let bestStreak = 26;
  let lowestName = 'Evening journal';
  let lowestText = '62% (static preview)';
  if (ui.historySource === 'real') {
    const doneRows = ui.completionHistory.filter(
      (r) => r.status === 'done' && r.date >= monday && r.date <= sunday,
    );
    total = doneRows.length;
    const perDay = weekDays.map((_, i) => doneRows.filter((r) => r.date === addDaysString(monday, i)).length);
    const bestIdx = perDay.reduce((best, v, i) => (v > perDay[best]! ? i : best), 0);
    bestDay = `${weekDays[bestIdx]} (${perDay[bestIdx]} completions)`;
    bestStreak = Math.max(0, ...Object.values(ui.bestStreaks));
    const perHabit = ui.habits.map((h) => ({
      habit: h,
      count: doneRows.filter((r) => r.habit_id === h.id).length,
    }));
    const lowest = perHabit.reduce(
      (worst, cur) => (cur.count < worst.count ? cur : worst),
      perHabit[0] ?? { habit: null as never, count: 0 },
    );
    if (lowest?.habit) {
      lowestName = lowest.habit.name;
      lowestText = `${lowest.count} completions this week`;
    }
  }
  const persisted = ui.supabaseConfigured && !!ui.authUser;
  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Back label="‹ Back" onPress={nav.back} />
        <Title>Weekly Report</Title>
        <Sub>
          {ui.historySource === 'real'
            ? `Week of ${monday} – ${sunday} · ${total} completions · Best day: ${bestDay} · Best streak: ${bestStreak} days`
            : 'Week of Oct 27 – Nov 2 · 28 completions · Best day: Thursday · Best streak: 26 days (static preview)'}
        </Sub>
        <Card>
          <Text style={{ color: c.ink, fontWeight: '700' }}>Lowest habit: {lowestName} ({lowestText})</Text>
          <Text style={{ color: c.muted, marginTop: 4 }}>
            {ui.historySource === 'real'
              ? 'Computed from your completion history for this week. Apply changes that habit for real; Dismiss hides the suggestion.'
              : 'Static preview — these numbers are not measured from real history. Sign in with Supabase configured to see your real week.'}
          </Text>
        </Card>
        {ui.suggestions.map((s, i) => {
          const h = ui.habits.find((x) => x.id === s.habitId);
          return (
            <View key={s.id} ref={i === 0 ? firstRef : undefined} collapsable={false}><Card>
              <Text style={{ color: c.ink, fontWeight: '700' }}>{s.title}</Text>
              <Text style={{ color: c.muted, marginTop: 4 }}>{s.reason} {h ? `(${h.name})` : ''}</Text>
              {s.state === 'new' ? (
                <Row><Btn label="Apply" onPress={() => ui.applySuggestion(s.id)} /><Btn label="Dismiss" ghost onPress={() => ui.dismissSuggestion(s.id)} /></Row>
              ) : (
                <Text style={{ color: s.state === 'applied' ? c.accent : c.muted, fontWeight: '700', marginTop: spacing.sm }}>
                  {s.state === 'applied'
                    ? (persisted ? '✓ Applied and saved' : '✓ Applied (session only)')
                    : (persisted ? 'Dismissed (saved)' : 'Dismissed')}
                </Text>
              )}
            </Card></View>
          );
        })}
        <Note>
          {persisted
            ? 'Apply/Dismiss states are saved to your account and survive reloads. Apply also changes the habit itself (slot or target, per the suggestion title).'
            : 'No account is signed in with Supabase configured, so Apply/Dismiss last for this session only. Reloading resets every suggestion to New.'}
        </Note>
      </ScrollView>
    </Screen>
  );
}
