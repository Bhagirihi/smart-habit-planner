import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useStore } from '../store';
import { colors, spacing, type } from '../theme';
import { Card, GhostButton, PrimaryButton } from '../components/ui';
import type { Nav } from '../navigation';

const PLANS = [
  { id: 'monthly', label: 'Monthly', price: '₹149 / month', note: 'Cancel any time' },
  { id: 'yearly', label: 'Yearly — Best Value', price: '₹999 / year', note: 'About ₹83 / month' },
  { id: 'lifetime', label: 'Lifetime', price: '₹1,999 once', note: 'Pay once, keep it forever' },
];

export default function Paywall({ nav }: { nav: Nav }): React.JSX.Element {
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

  return (
    <ScrollView contentContainerStyle={styles.wrap}>
      <Text style={styles.hero}>Go Premium</Text>
      <Text style={styles.body}>Keep the free version forever, or unlock everything for serious streak builders.</Text>

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
        <Card key={p.id} style={selected === p.id ? styles.selected : undefined}>
          <Text style={styles.planLabel} onPress={() => setSelected(p.id)}>{p.label}</Text>
          <Text style={styles.planPrice}>{p.price}</Text>
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

const styles = StyleSheet.create({
  wrap: { flexGrow: 1, padding: spacing.lg, gap: 14, backgroundColor: colors.bg },
  hero: { fontSize: type.title, fontWeight: '800', color: colors.ink },
  body: { fontSize: type.body, color: colors.muted, lineHeight: 22 },
  cardTitle: { fontSize: type.subtitle, fontWeight: '700', color: colors.ink },
  bullet: { fontSize: type.body, color: colors.ink, lineHeight: 24 },
  premiumCard: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  selected: { borderColor: colors.primary, borderWidth: 2 },
  planLabel: { fontSize: type.subtitle, fontWeight: '700', color: colors.ink },
  planPrice: { fontSize: type.body, fontWeight: '700', color: colors.primary, marginTop: 4 },
  planNote: { fontSize: type.small, color: colors.muted, marginTop: 2, marginBottom: 8 },
  note: { fontSize: type.small, color: colors.muted, lineHeight: 19, textAlign: 'center' },
});
