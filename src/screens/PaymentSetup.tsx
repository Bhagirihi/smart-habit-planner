import React, { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { c, spacing, type } from '../theme';
import { Back, Btn, Card, Note, Screen, Sub, Title } from '../components/ui';
import { tourMeasure } from '../components/Tooltip';
import { FREE_TIER_DAYS_LEFT, FREE_HABIT_LIMIT, FREE_ROUTINE_LIMIT } from '../data';
import type { ScreenProps } from './props';

const PLANS = [
  { id: 'monthly', name: 'Monthly', desc: 'Billed every month' },
  { id: 'yearly', name: 'Yearly', desc: 'Billed once a year' },
  { id: 'lifetime', name: 'Lifetime', desc: 'Pay once, keep it forever' },
];

// Payment setup after auth, with Skip (STEP 3: RevenueCat).
//
// UNCONFIGURED: exactly today's preview — plan names only, no prices,
// no payment taken, Skip and Continue both go to Today for demo only.
// CONFIGURED: lists the current RevenueCat offering's packages with
// prices from RevenueCat ONLY (never hardcoded); selecting + tapping
// Purchase buys that package, Restore restores previous purchases,
// and success is reported only when RevenueCat confirms the premium
// entitlement. Errors are shown as text, never as a success.
export default function PaymentSetup({ nav, ui }: ScreenProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const skipRef = useRef<any>(null);
  useEffect(() => {
    ui.registerTourTarget('payment-skip', tourMeasure(skipRef));
    return () => ui.unregisterTourTarget('payment-skip');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onPurchase = async () => {
    if (!selected || busy) return;
    setBusy(true);
    setMessage(null);
    try {
      const premium = await ui.purchasePackage(selected);
      setMessage(premium
        ? 'Premium active ✓ — your purchase was confirmed by RevenueCat.'
        : 'Purchase completed, but no active premium entitlement was returned. Your premium state was not changed — check the RevenueCat dashboard, then try Restore.');
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Purchase failed.');
    } finally {
      setBusy(false);
    }
  };

  const onRestore = async () => {
    if (restoring) return;
    setRestoring(true);
    setMessage(null);
    try {
      const premium = await ui.restorePurchases();
      setMessage(premium
        ? 'Premium restored ✓ — your previous purchase was confirmed by RevenueCat.'
        : 'No active premium purchase found to restore. Nothing was unlocked.');
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Restore failed.');
    } finally {
      setRestoring(false);
    }
  };

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Back label="‹ Back" onPress={nav.back} />
        <Title>Set up payment (optional)</Title>
        <Sub>You can skip this completely and use the app for free. Nothing here charges you unless you complete a real purchase below.</Sub>
        <Card>
          <Text style={{ color: c.ink, fontWeight: '700' }}>
            {ui.isPremium
              ? 'You are Premium ✓ — unlimited habits & routines.'
              : `You are on the free tier — ${FREE_TIER_DAYS_LEFT} days left in this preview`}
          </Text>
          <Text style={{ color: c.muted, marginTop: 4 }}>{FREE_HABIT_LIMIT} habits, {FREE_ROUTINE_LIMIT} routine. {ui.revenueCatConfigured ? 'Free limits are enforced for new habits/routines until Premium is active.' : 'Static demo value — real value comes from subscription later.'}</Text>
        </Card>
        {ui.revenueCatConfigured ? (
          <>
            {ui.revenueCatLoading ? (
              <Text style={{ color: c.muted, marginBottom: spacing.md }}>Loading products…</Text>
            ) : ui.offerings.length === 0 ? (
              <Text style={{ color: c.muted, marginBottom: spacing.md }}>No products available — check the products and offering in the RevenueCat dashboard, then tap Retry below.</Text>
            ) : (
              ui.offerings.map((p) => (
                <Pressable key={p.identifier} onPress={() => setSelected(p.identifier)} style={{ minHeight: 64, backgroundColor: selected === p.identifier ? c.tonal : c.surface, borderColor: selected === p.identifier ? c.primary : c.border, borderWidth: 1, borderRadius: 16, padding: spacing.md, marginBottom: spacing.sm, justifyContent: 'center' }}>
                  <Text style={{ color: c.ink, fontWeight: '700' }}>{p.title}{p.priceString ? ` — ${p.priceString}` : ''}</Text>
                  {p.description ? <Text style={{ color: c.muted, fontSize: type.small }}>{p.description}</Text> : null}
                </Pressable>
              ))
            )}
            <Btn label={busy ? 'Processing…' : 'Purchase selected'} onPress={onPurchase} />
            <Btn label={restoring ? 'Restoring…' : 'Restore purchases'} ghost onPress={onRestore} />
            <Btn label="Retry loading products" ghost onPress={() => { setMessage(null); ui.refreshRevenueCat(); }} />
            {message && <Note>{message}</Note>}
            {ui.revenueCatError && <Note>{ui.revenueCatError}</Note>}
          </>
        ) : (
          <>
            <Note>RevenueCat is not configured — UI preview, no payment is taken. Plan cards show names only, with NO prices. Prices come from real RevenueCat products once configured, never hard-coded.</Note>
            {PLANS.map((p) => (
              <Pressable key={p.id} onPress={() => setSelected(p.id)} style={{ minHeight: 64, backgroundColor: selected === p.id ? c.tonal : c.surface, borderColor: selected === p.id ? c.primary : c.border, borderWidth: 1, borderRadius: 16, padding: spacing.md, marginBottom: spacing.sm, justifyContent: 'center' }}>
                <Text style={{ color: c.ink, fontWeight: '700' }}>{p.name}</Text>
                <Text style={{ color: c.muted, fontSize: type.small }}>{p.desc} · Price shown only when real products are configured</Text>
              </Pressable>
            ))}
            <Btn label="Continue (preview → Today, no charge)" onPress={() => nav.goTab('today')} />
            <Text style={{ color: c.muted, fontSize: type.small, textAlign: 'center' }}>Selecting a plan does not charge or unlock anything in this preview.</Text>
          </>
        )}
        <Pressable ref={skipRef} collapsable={false} onPress={() => nav.goTab('today')} style={{ minHeight: 48, alignItems: 'center', justifyContent: 'center', marginTop: spacing.sm }}>
          <Text style={{ color: c.primary, fontWeight: '800', fontSize: type.label }}>Skip payment setup →</Text>
        </Pressable>
        <View style={{ height: spacing.md }} />
      </ScrollView>
    </Screen>
  );
}
