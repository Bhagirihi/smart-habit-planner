import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { c, radius, spacing, type } from '../theme';
import { Back, Card, Note, Screen, Title } from '../components/ui';
import { HABITS, WEEK_DAYS, FREE_TIER_DAYS_LEFT } from '../data';
import type { ScreenProps } from './props';

// Mirrors the real widget in src/widgets/HabitWidget.tsx, in the same order:
// week at the top, then "Habit completed today" below it. No steps counter:
// this app tracks habits, not system steps.
// CONTRAST RULE: week circles and the progress track are never the same
// colour as the card behind them. Done = bright green, today = amber,
// missed = light grey-green, future = mid-tonal #334F49 (not near-black).
// The phone frame is tonal #12312C, visibly different from the app
// background #0A1211, so the frame itself can be found on a dark screen.

const WEEK_STATUS = ['done', 'done', 'done', 'today', 'future', 'future', 'future'] as const;

function weekCircle(status: string): { bg: string; mark: string; markColor: string } {
  if (status === 'done') return { bg: '#34D399', mark: '✓', markColor: c.onPrimary };
  if (status === 'today') return { bg: '#FBBF24', mark: '•', markColor: c.onPrimary };
  if (status === 'missed') return { bg: '#8A9E98', mark: '–', markColor: '#0A1211' };
  return { bg: '#334F49', mark: '•', markColor: '#A7C2BB' };
}

export default function WidgetPreview({ nav, ui }: ScreenProps) {
  const doneCount = HABITS.filter((h) => ui.done.has(h.id)).length;
  const pct = Math.round((doneCount / HABITS.length) * 100);
  const doneNames = HABITS.filter((h) => ui.done.has(h.id)).map((h) => h.name).join(' · ');
  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Back label="‹ Back" onPress={nav.back} />
        <Title>Widget preview</Title>
        <Note>Real Android home widget included: src/widgets/HabitWidget.tsx is registered in app.json (expo-widgets, enableAndroid). It still will NOT appear in Expo Go — install a development build, then long-press the home screen → Widgets → Smart Habit → place it. This screen shows the same layout as the real widget: week at the top, then Habit completed today.</Note>
        {/* Phone-home-screen-style frame */}
        <View style={{ backgroundColor: c.tonal, borderColor: c.primary, borderWidth: 1, borderRadius: 28, padding: spacing.lg, marginBottom: spacing.md }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.md }}>
            <Text style={{ color: c.muted, fontSize: type.small }}>9:41</Text>
            <Text style={{ color: c.muted, fontSize: type.small }}>Home screen · preview</Text>
          </View>
          <View style={{ backgroundColor: c.surface, borderColor: c.primary, borderWidth: 1, borderRadius: radius.xl, padding: spacing.lg, shadowColor: c.primary, shadowOpacity: 0.35, shadowRadius: 12, elevation: 3 }}>
            <Text style={{ color: c.ink, fontWeight: '800', fontSize: type.subtitle }}>Smart Habit</Text>
            {/* 1. WEEK AT THE TOP */}
            <Text style={{ color: c.ink, fontWeight: '700', marginTop: spacing.md }}>This week</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm }}>
              {WEEK_DAYS.map((d, i) => (
                <Text key={d} style={{ color: i === 3 ? c.primary : c.muted, fontSize: type.small, fontWeight: i === 3 ? '800' : '400', width: 36, textAlign: 'center' }}>{d}</Text>
              ))}
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm }}>
              {WEEK_STATUS.map((s, i) => {
                const circ = weekCircle(s);
                return (
                  <View key={i} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: circ.bg, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: circ.markColor, fontWeight: '800' }}>{circ.mark}</Text>
                  </View>
                );
              })}
            </View>
            <Text style={{ color: c.muted, fontSize: type.small, marginTop: spacing.sm }}>Green = done · Amber = today · Grey = missed · Dark = coming up</Text>
            {/* 2. HABIT COMPLETED TODAY, BELOW THE WEEK */}
            <Text style={{ color: c.ink, fontWeight: '800', fontSize: type.subtitle, marginTop: spacing.lg }}>Habit completed today</Text>
            <Text style={{ color: c.ink, fontSize: 28, fontWeight: '800', marginTop: spacing.sm }}>{doneCount} of {HABITS.length} · {pct}%</Text>
            <View style={{ height: 8, borderRadius: 4, backgroundColor: '#334F49', marginVertical: spacing.sm, overflow: 'hidden' }}>
              <View style={{ height: 8, width: `${pct}%`, backgroundColor: c.primary, borderRadius: 4 }} />
            </View>
            <Text style={{ color: c.muted, fontSize: type.small }}>Done: {doneNames || 'Nothing yet today'} · Free tier · {FREE_TIER_DAYS_LEFT} days left (static preview)</Text>
          </View>
          <Text style={{ color: c.muted, fontSize: type.small, textAlign: 'center', marginTop: spacing.md }}>Other apps would sit around this widget on a real home screen.</Text>
        </View>
        <Card>
          <Text style={{ color: c.ink, fontWeight: '700' }}>Get it on your home screen</Text>
          <Text style={{ color: c.muted, marginTop: 4 }}>Install a development build (not Expo Go), then long-press the home screen → Widgets → Smart Habit → place it. The widget shows this week at the top and Habit completed today below it. See README for the build steps. The widget data is static in this UI build — it does not yet update from the app.</Text>
        </Card>
      </ScrollView>
    </Screen>
  );
}
