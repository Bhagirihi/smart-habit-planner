import React, { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useStore } from '../store';
import { spacing, type, type Palette } from '../theme';
import { useTheme } from '../useTheme';
import { Card, GhostButton, PrimaryButton } from '../components/ui';
import type { Nav } from '../navigation';

const PLANS = [
  { id: 'monthly', label: 'Monthly', price: '₹149 / month', note: 'Cancel any time', accent: 'primary' as const },
  { id: 'yearly', label: 'Yearly — Best Value', price: '₹999 / year', note: 'About ₹83 / month', accent: 'violet' as const },
  { id: 'lifetime', label: 'Lifetime', price: '₹1,999 once', note: 'Pay once, keep it forever', accent: 'amber' as const },
];

function makeStyles(c: Palette) {
  return StyleSheet.create({
    wrap: { flexGrow: 1, padding: spacing.lg, gap: 14, backgroundColor: c.bg },
    heroCard: { borderRadius: 26, padding: spacing.lg, overflow: 'hidden', gap: 8 },
    hero: { fontSize: type.display, fontWeight: '800', color: '#fff', lineHeight: 40 },
    heroBody: { fontSize: type.body, color: '#E6F4F1', lineHeight: 22 },
    body: { fontSize: type.body, color: c.muted, lineHeight: 22 },
    cardTitle: { fontSize: type.subtitle, fontWeight: '700', color: c.ink },
    bullet: { fontSize: type.body, color: c.ink, lineHeight: 24 },
    premiumCard: { borderColor: c.primary, backgroundColor: c.primarySoft },
    planLabel: { fontSize: type.subtitle, fontWeight: '700', color: c.ink },
    planPrice: { fontSize: type.body, fontWeight: '800', marginTop: 4 },
    planNote: { fontSize: type.small, color: c.muted, marginTop: 2, marginBottom: 8 },
    note: { fontSize: type.small, color: c.muted, lineHeight: 19, textAlign: 'center' },
  });
}

export default function Paywall({ nav }: { nav: Nav }): React.JSX.Element {
  const c = useTheme();
  const styles = useMemo(() => makeStyles(c), [c]);
  const { isPremium } = useStore();
  const [selected, setSelected] = useState('yearly');

  function purchase() {
    // TODO: RevenueCat — wire this button to RevenueCat purchases before release.
    // Deliberately does NOT unlock Premium and does NOT charge anything in v1.
    Alert.alert(
      'Purchases are not wired yet',
      'This is a v1 placeholder. TODO: connect RevenueCat here, then unlock Premium only after a verified purchase. Nothing has been charged.',
      [{ text: 'OK' }],
    );
  }

  function restore() {
    // TODO: RevenueCat — wire Restore to RevenueCat restorePurchases before release.
    Alert.alert('Restore is not wired yet', 'TODO: connect RevenueCat restorePurchases here. Nothing has been restored in this v1 build.', [{ text: 'OK' }]);
  }

  function planStyle(p: (typeof PLANS)[number]) {
    const accent = p.accent === 'violet' ? c.violet : p.accent === 'amber' ? c.amber : c.primary;
    const bg = p.accent === 'violet' ? c.violetSoft : p.accent === 'amber' ? c.amberSoft : c.primarySoft;
    return { borderColor: accent, backgroundColor: bg, borderWidth: selected === p.id ? 3 : 1.5 };
  }

  return (
    <ScrollView contentContainerStyle={styles.wrap}>
      <LinearGradient colors={[...c.gradient]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.heroCard}>
        <Text style={styles.hero}>Go Premium</Text>
        <Text style={styles.heroBody}>Keep the free version forever, or unlock everything for serious streak builders.</Text>
      </LinearGradient>

      <Card>
        <Text style={styles.cardTitle}>Free</Text>
        <Text style={styles.bullet}>• Up to 5 habits, 1 routine</Text>
        <Text style={styles.bullet}>• Basic streaks and calendar</Text>
      </Card>
      <Card style={styles.premiumCard}>
        <Text style={styles.cardTitle}>Premium</Text>
        <Text style={styles.bullet}>• Unlimited habits and routines</Text>
        <Text style={styles.bullet}>• Advanced charts and trends</Text>
        <Text style={styles.bullet}>• Weekly suggestions with one-tap Apply</Text>
        <Text style={styles.bullet}>• Backup and sync (v2)</Text>
      </Card>

      {isPremium ? (
        <Card>
          <Text style={styles.cardTitle}>Premium preview is on</Text>
          <Text style={styles.body}>This is the demo preview switch from Settings, not a real purchase. Turn it off in Settings to test the free gates again.</Text>
        </Card>
      ) : null}

      {PLANS.map((p) => (
        <Card key={p.id} style={planStyle(p)}>
          <Text style={styles.planLabel} onPress={() => setSelected(p.id)}>{p.label}</Text>
          <Text style={[styles.planPrice, { color: p.accent === 'violet' ? c.violet : p.accent === 'amber' ? c.amber : c.primary }]}>{p.price}</Text>
          <Text style={styles.planNote}>{p.note}</Text>
          <GhostButton label={selected === p.id ? 'Selected' : 'Select'} onPress={() => setSelected(p.id)} />
        </Card>
      ))}

      <PrimaryButton label="Continue with selected plan" onPress={purchase} />
      <GhostButton label="Restore purchase" onPress={restore} />
      <GhostButton label="Maybe later" onPress={nav.pop} />
      <Text style={styles.note}>v1 note: purchase and restore are placeholders. Do not ship to the Play Store with real prices until RevenueCat is wired and verified.</Text>
    </ScrollView>
  );
}
