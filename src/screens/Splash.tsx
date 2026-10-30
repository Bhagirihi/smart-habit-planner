import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, ErrorBanner } from '../components/ui';
import { useStore } from '../store';
import type { Nav } from '../navigation';
import { c, radius, spacing, type } from '../theme';

export default function Splash({ nav }: { nav: Nav }) {
  const { ready, loadError, prefs } = useStore();
  // Fallback escape hatch, in case this screen is ever shown while ready:
  // the shell normally switches away from Splash on its own, but a stuck
  // user must always have a tap that moves them forward.
  const handleContinue = () => {
    if (prefs.onboardingComplete) nav.goTab('today');
    else nav.push({ name: 'welcome' });
  };
  return (
    <SafeAreaView style={s.root}>
      <View style={s.center}>
        <View style={s.leafTile}>
          <Text style={s.leafGlyph}>🌿</Text>
        </View>
        <Text style={s.logo}>Smart Habit</Text>
        <Text style={s.logo}>&amp; Routine Planner</Text>
        <Text style={s.tagline}>Build better habits. A healthier, happier you.</Text>
        {loadError ? (
          <View style={s.errorWrap}>
            <ErrorBanner message={loadError} />
            <Text style={s.errorNote}>Your saved data could not be loaded. Please restart the app to try again.</Text>
          </View>
        ) : null}
        {!ready && !loadError ? (
          <View style={s.loading}>
            <ActivityIndicator size="large" color={c.primary} />
            <Text style={s.loadingText}>Loading your habits…</Text>
          </View>
        ) : null}
        {ready && !loadError ? (
          <View style={s.readyWrap}>
            <Card>
              <Text style={s.readyText}>Ready. Opening your day…</Text>
            </Card>
            <Pressable style={s.continueBtn} onPress={handleContinue} accessibilityRole="button">
              <Text style={s.continueText}>Continue →</Text>
            </Pressable>
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: c.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.lg, gap: spacing.md },
  leafTile: { width: 72, height: 72, borderRadius: radius.lg, backgroundColor: c.surfaceTonal, alignItems: 'center', justifyContent: 'center' },
  leafGlyph: { fontSize: 36 },
  logo: { fontSize: type.title, fontWeight: '600', color: c.ink, textAlign: 'center' },
  tagline: { fontSize: type.body, color: c.muted, textAlign: 'center', lineHeight: 20 },
  loading: { alignItems: 'center', gap: spacing.sm, marginTop: spacing.lg },
  loadingText: { fontSize: type.body, color: c.muted },
  errorWrap: { gap: spacing.sm, marginTop: spacing.sm },
  errorNote: { fontSize: type.body, color: c.muted, lineHeight: 20 },
  readyWrap: { alignItems: 'center', gap: spacing.sm, width: '100%' },
  continueBtn: { minHeight: 48, paddingHorizontal: spacing.lg, borderRadius: radius.md, backgroundColor: c.primary, alignItems: 'center', justifyContent: 'center' },
  continueText: { fontSize: type.label, fontWeight: '600', color: c.onPrimary },
  readyText: { fontSize: type.body, color: c.muted },
});
