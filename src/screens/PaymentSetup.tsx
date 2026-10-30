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

export default function PaymentSetup({ nav, ui }: ScreenProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const skipRef = useRef<any>(null);
  useEffect(() => {
    ui.registerTourTarget('payment-skip', tourMeasure(skipRef));
    return () => ui.unregisterTourTarget('payment-skip');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Back label="‹ Back" onPress={nav.back} />
        <Title>Set up payment (optional)</Title>
        <Sub>You can skip this completely and use the app for free. Nothing here charges you.</Sub>
        <Card>
          <Text style={{ color: c.ink, fontWeight: '700' }}>You are on the free tier — {FREE_TIER_DAYS_LEFT} days left in this preview</Text>
          <Text style={{ color: c.muted, marginTop: 4 }}>{FREE_HABIT_LIMIT} habits, {FREE_ROUTINE_LIMIT} routine. Static demo value — real value comes from subscription later.</Text>
        </Card>
        <Note>UI preview — no payment is taken. Plan cards show names only, with NO prices. Prices come from real RevenueCat products later, exactly like the Paywall overlay.</Note>
        {PLANS.map((p) => (
          <Pressable key={p.id} onPress={() => setSelected(p.id)} style={{ minHeight: 64, backgroundColor: selected === p.id ? c.tonal : c.surface, borderColor: selected === p.id ? c.primary : c.border, borderWidth: 1, borderRadius: 16, padding: spacing.md, marginBottom: spacing.sm, justifyContent: 'center' }}>
            <Text style={{ color: c.ink, fontWeight: '700' }}>{p.name}</Text>
            <Text style={{ color: c.muted, fontSize: type.small }}>{p.desc} · Price shown only when real products are configured</Text>
          </Pressable>
        ))}
        <Btn label="Continue (preview → Today, no charge)" onPress={() => nav.goTab('today')} />
        <Pressable ref={skipRef} collapsable={false} onPress={() => nav.goTab('today')} style={{ minHeight: 48, alignItems: 'center', justifyContent: 'center', marginTop: spacing.sm }}>
          <Text style={{ color: c.primary, fontWeight: '800', fontSize: type.label }}>Skip payment setup →</Text>
        </Pressable>
        <View style={{ height: spacing.md }} />
        <Text style={{ color: c.muted, fontSize: type.small, textAlign: 'center' }}>Selecting a plan does not charge or unlock anything in this preview.</Text>
      </ScrollView>
    </Screen>
  );
}
