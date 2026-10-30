import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { c, radius, spacing, type } from '../theme';
import { Back, Card, Note, Screen, Title } from '../components/ui';
import { HabitGrid7 } from '../components/Widget';
import { HABITS, FREE_TIER_DAYS_LEFT } from '../data';
import type { ScreenProps } from './props';

export default function WidgetPreview({ nav, ui }: ScreenProps) {
  const doneCount = HABITS.filter((h) => ui.done.has(h.id)).length;
  const pct = Math.round((doneCount / HABITS.length) * 100);
  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Back label="‹ Back" onPress={nav.back} />
        <Title>Widget preview</Title>
        <Note>Home widget preview — a real Android home widget needs a development build, it does NOT work in Expo Go. This screen only shows what the widget would look like on a home screen.</Note>
        {/* Phone-home-screen-style frame */}
        <View style={{ backgroundColor: '#04100D', borderColor: c.border, borderWidth: 1, borderRadius: 28, padding: spacing.lg, marginBottom: spacing.md }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.md }}>
            <Text style={{ color: c.muted, fontSize: type.small }}>9:41</Text>
            <Text style={{ color: c.muted, fontSize: type.small }}>Home screen · preview</Text>
          </View>
          <View style={{ backgroundColor: c.surface, borderColor: c.primary, borderWidth: 1, borderRadius: radius.xl, padding: spacing.lg, shadowColor: c.primary, shadowOpacity: 0.35, shadowRadius: 12, elevation: 3 }}>
            <Text style={{ color: c.ink, fontWeight: '800', fontSize: type.subtitle }}>Smart Habit</Text>
            <Text style={{ color: c.ink, fontSize: 28, fontWeight: '800', marginTop: spacing.sm }}>{doneCount} of {HABITS.length} · {pct}%</Text>
            <Text style={{ color: c.muted, fontSize: type.small, marginBottom: spacing.md }}>Completed today · Free tier · {FREE_TIER_DAYS_LEFT} days left (static preview)</Text>
            {HABITS.map((h) => {
              const done = ui.done.has(h.id);
              return (
                <View key={h.id} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm }}>
                  <Text style={{ color: c.ink }}>{h.icon} {h.name}</Text>
                  <Text style={{ color: done ? c.accent : c.muted, fontWeight: '700' }}>{done ? '✓ Done' : '○ To do'}</Text>
                </View>
              );
            })}
            <View style={{ marginTop: spacing.md }}>
              <HabitGrid7 done={ui.done} />
            </View>
          </View>
          <Text style={{ color: c.muted, fontSize: type.small, textAlign: 'center', marginTop: spacing.md }}>Other apps would sit around this widget on a real home screen.</Text>
        </View>
        <Card>
          <Text style={{ color: c.ink, fontWeight: '700' }}>Why this is a preview only</Text>
          <Text style={{ color: c.muted, marginTop: 4 }}>A real Android home widget (expo-widgets) needs a native development build and prebuild. This UI-only Expo Go preview cannot place a widget on your home screen, and no widget was installed in this build — see README for the reason.</Text>
        </Card>
      </ScrollView>
    </Screen>
  );
}
