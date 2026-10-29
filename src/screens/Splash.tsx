import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, ErrorBanner } from '../components/ui';
import { useStore } from '../store';
import type { Nav } from '../navigation';
import { c, radius, spacing, type } from '../theme';

export default function Splash({ nav }: { nav: Nav }) {
  void nav;
  const { ready, loadError } = useStore();
  return (
    <SafeAreaView style={s.root}>
      <View style={s.center}>
        <Text style={s.logo}>Smart habit planner</Text>
        <Text style={s.tagline}>Build small habits, keep the streak alive.</Text>
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
          <Card>
            <Text style={s.readyText}>Ready. Opening your day…</Text>
          </Card>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: c.bg },
  center: { flex: 1, justifyContent: 'center', padding: spacing.lg, gap: spacing.md },
  logo: { fontSize: type.title, fontWeight: '600', color: c.ink, textAlign: 'center' },
  tagline: { fontSize: type.body, color: c.muted, textAlign: 'center', lineHeight: 20 },
  loading: { alignItems: 'center', gap: spacing.sm, marginTop: spacing.lg },
  loadingText: { fontSize: type.body, color: c.muted },
  errorWrap: { gap: spacing.sm, marginTop: spacing.sm },
  errorNote: { fontSize: type.body, color: c.muted, lineHeight: 20 },
  readyText: { fontSize: type.body, color: c.muted },
});
