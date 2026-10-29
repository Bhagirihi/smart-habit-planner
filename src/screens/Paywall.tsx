import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, GhostButton, Inset, PrimaryButton, SectionTitle } from '../components/ui';
import type { Nav } from '../navigation';
import { AVAILABLE_PRODUCTS, purchaseProduct, restorePurchases } from '../services/subscription';
import { c, radius, spacing, type } from '../theme';

const DEMO_BANNER =
  'Development / demo mode — no subscription products are configured, so no prices are shown and no purchase can be made.';
const LEGAL_NOT_PUBLISHED = 'Terms of Service and Privacy Policy are not published yet for this app.';

const FREE_FEATURES = ['Up to 5 habits', '1 routine', 'Basic progress', 'Basic reminders'];
const PREMIUM_FEATURES = [
  'Unlimited habits',
  'Unlimited routines',
  'Advanced analytics',
  'Custom reminders',
  'Personalised weekly suggestions',
  'Additional customisation',
];

function FeatureRow({ label, included }: { label: string; included: boolean }) {
  return (
    <View style={s.row}>
      <Text style={[s.mark, included ? s.markYes : s.markNo]}>{included ? '✓' : '—'}</Text>
      <Text style={s.rowText}>{label}</Text>
    </View>
  );
}

export function Paywall({ nav }: { nav: Nav }) {
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleRestore = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const result = await restorePurchases();
      setMessage(result.message);
    } catch {
      setMessage('Restore could not be completed. No purchase was made and Premium was not unlocked.');
    } finally {
      setBusy(false);
    }
  };

  const handlePurchase = async (productId: string) => {
    if (busy) return;
    setBusy(true);
    try {
      const result = await purchaseProduct(productId);
      setMessage(result.message);
    } catch {
      setMessage('Purchase could not be completed. No payment was taken and Premium was not unlocked.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.content}>
        <View style={s.header}>
          <Text style={s.title}>Premium</Text>
          <GhostButton label="Close" onPress={() => nav.back()} />
        </View>

        <Inset>
          <Text style={s.banner}>{DEMO_BANNER}</Text>
        </Inset>

        <Card>
          <SectionTitle>Free vs Premium</SectionTitle>
          <View style={s.compare}>
            <View style={s.column}>
              <Text style={s.columnTitle}>Free</Text>
              {FREE_FEATURES.map((f) => (
                <FeatureRow key={f} label={f} included />
              ))}
            </View>
            <View style={s.column}>
              <Text style={s.columnTitle}>Premium</Text>
              {PREMIUM_FEATURES.map((f) => (
                <FeatureRow key={f} label={f} included />
              ))}
            </View>
          </View>
          <Text style={s.note}>No prices are shown because no subscription products are configured.</Text>
        </Card>

        <Card>
          <SectionTitle>Purchase</SectionTitle>
          {AVAILABLE_PRODUCTS.length === 0 ? (
            <Text style={s.body}>No products available yet.</Text>
          ) : (
            AVAILABLE_PRODUCTS.map((p) => (
              <PrimaryButton key={p.id} label={p.title} onPress={() => void handlePurchase(p.id)} />
            ))
          )}
          <Text style={s.body}>
            Purchasing is unavailable in this build. No payment will be taken and Premium will not be unlocked.
          </Text>
        </Card>

        {message ? (
          <Inset>
            <Text style={s.body}>{message}</Text>
          </Inset>
        ) : null}

        <PrimaryButton label={busy ? 'Working…' : 'Restore purchases'} onPress={() => void handleRestore()} />

        <Pressable style={s.legalRow} onPress={() => setMessage(LEGAL_NOT_PUBLISHED)} accessibilityRole="button">
          <Text style={s.legalText}>Terms of Service</Text>
        </Pressable>
        <Pressable style={s.legalRow} onPress={() => setMessage(LEGAL_NOT_PUBLISHED)} accessibilityRole="button">
          <Text style={s.legalText}>Privacy Policy</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: c.bg },
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: type.title, fontWeight: '600', color: c.ink },
  banner: { fontSize: type.body, color: c.ink, lineHeight: 20 },
  compare: { flexDirection: 'row', gap: spacing.lg },
  column: { flex: 1, gap: spacing.sm },
  columnTitle: { fontSize: type.label, fontWeight: '600', color: c.ink },
  row: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  mark: { fontSize: type.body, fontWeight: '600', width: 16 },
  markYes: { color: c.accent },
  markNo: { color: c.muted },
  rowText: { fontSize: type.body, color: c.muted, lineHeight: 20, flex: 1 },
  note: { fontSize: type.small, color: c.muted, lineHeight: 18 },
  body: { fontSize: type.body, color: c.muted, lineHeight: 20 },
  legalRow: {
    minHeight: 48,
    justifyContent: 'center',
    backgroundColor: c.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
  },
  legalText: { fontSize: type.label, fontWeight: '600', color: c.primary },
});
