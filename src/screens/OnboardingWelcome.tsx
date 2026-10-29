import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GhostButton, PrimaryButton } from '../components/ui';
import { useStore } from '../store';
import type { Nav } from '../navigation';
import { c, radius, spacing, type } from '../theme';

export default function OnboardingWelcome({ nav }: { nav: Nav }) {
  const { setPrefs } = useStore();
  const handleSkip = () => {
    setPrefs({ onboardingComplete: true });
    nav.goTab('today');
  };
  return (
    <SafeAreaView style={s.root}>
      <View style={s.content}>
        <View style={s.leafTile}>
          <Text style={s.leafGlyph}>🌿</Text>
        </View>
        <Text style={s.logo}>Smart habit planner</Text>
        <Text style={s.headline}>Build small habits, keep the streak alive.</Text>
        <Text style={s.body}>
          Pick a goal, choose a few habits to start with, and check them off each day. Small steps, tracked daily, add up.
        </Text>
        <View style={s.actions}>
          <PrimaryButton label="Get started" onPress={() => nav.push({ name: 'goal' })} />
          <GhostButton label="Skip" onPress={handleSkip} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: c.bg },
  content: { flex: 1, justifyContent: 'center', padding: spacing.lg, gap: spacing.md },
  leafTile: { width: 72, height: 72, borderRadius: radius.lg, backgroundColor: c.surfaceTonal, alignItems: 'center', justifyContent: 'center' },
  leafGlyph: { fontSize: 36 },
  logo: { fontSize: type.label, fontWeight: '600', color: c.primary },
  headline: { fontSize: type.title, fontWeight: '600', color: c.ink, lineHeight: 32 },
  body: { fontSize: type.body, color: c.muted, lineHeight: 22 },
  actions: { gap: spacing.sm, marginTop: spacing.lg },
});
