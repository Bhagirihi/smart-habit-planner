import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { c, radius, spacing, type } from '../theme';
import { Btn, Note } from './ui';
import type { UiState } from '../navigation';

// Paywall overlay (STEP 3: RevenueCat).
//
// UNCONFIGURED (no RevenueCat API key): exactly today's preview —
// plan names only, no prices, tapping a plan does nothing and unlocks
// nothing, Restore is a preview note, closing returns to the current
// screen with no draft lost. Nothing here fakes a purchase or a
// premium state.
//
// CONFIGURED: shows the current offering's packages with prices
// from RevenueCat ONLY (never hardcoded). Tapping a package buys it;
// success is shown only when RevenueCat's CustomerInfo has the
// premium entitlement active. Errors (including user-cancelled and
// the Expo Go native-module error) are shown as text, never as a
// success. Restore calls RevenueCat restore and reports the real
// result: Premium only when the restored entitlement is active,
// otherwise "No active premium purchase found to restore."
export default function Paywall({ onClose, ui }: { onClose: () => void; ui?: UiState }) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const configured = ui?.revenueCatConfigured ?? false;
  const isPremium = ui?.isPremium ?? false;

  const onPurchase = async (identifier: string) => {
    if (!ui || busyId) return;
    setBusyId(identifier);
    setMessage(null);
    try {
      const premium = await ui.purchasePackage(identifier);
      setMessage(premium
        ? 'Premium active ✓ — your purchase was confirmed by RevenueCat.'
        : 'Purchase completed, but no active premium entitlement was returned. Your premium state was not changed — check the RevenueCat dashboard, then try Restore.');
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Purchase failed.');
    } finally {
      setBusyId(null);
    }
  };

  const onRestore = async () => {
    if (!ui || restoring) return;
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
    <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' }}>
      <View style={{ backgroundColor: c.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.xl }}>
        <Text style={{ color: c.ink, fontSize: type.subtitle, fontWeight: '800', textAlign: 'center' }}>Upgrade to Premium</Text>
        {isPremium ? (
          <Text style={{ color: c.primary, textAlign: 'center', marginTop: spacing.sm, fontWeight: '700' }}>You are Premium ✓ — unlimited habits & routines are unlocked.</Text>
        ) : configured ? (
          <Text style={{ color: c.muted, textAlign: 'center', marginTop: spacing.sm }}>Prices below come from RevenueCat — nothing here is hard-coded. Free tier: 5 habits · 1 routine.</Text>
        ) : (
          <Text style={{ color: c.muted, textAlign: 'center', marginTop: spacing.sm }}>RevenueCat is not configured — plan names only, no prices here. Prices will come from real products once configured, never hard-coded.</Text>
        )}
        {configured ? (
          ui!.revenueCatLoading ? (
            <Text style={{ color: c.muted, textAlign: 'center', marginTop: spacing.md }}>Loading products…</Text>
          ) : ui!.offerings.length === 0 ? (
            <Text style={{ color: c.muted, textAlign: 'center', marginTop: spacing.md }}>No products available — check the products and offering in the RevenueCat dashboard, then tap Retry.</Text>
          ) : (
            ui!.offerings.map((p) => (
              <Pressable key={p.identifier} onPress={() => onPurchase(p.identifier)} disabled={busyId !== null} style={{ backgroundColor: c.surfaceAlt, borderColor: c.border, borderWidth: 1, borderRadius: radius.md, padding: spacing.md, marginTop: spacing.sm, opacity: busyId !== null && busyId !== p.identifier ? 0.5 : 1 }}>
                <Text style={{ color: c.ink, fontWeight: '700' }}>{p.title}{p.priceString ? ` — ${p.priceString}` : ''}</Text>
                {p.description ? <Text style={{ color: c.muted, fontSize: type.small, marginTop: 2 }}>{p.description}</Text> : null}
                <Text style={{ color: c.primary, fontSize: type.small, marginTop: 2 }}>{busyId === p.identifier ? 'Processing…' : 'Tap to purchase'}</Text>
              </Pressable>
            ))
          )
        ) : (
          ['Free', 'Premium Monthly', 'Premium Yearly', 'Premium Lifetime'].map((p) => (
            <View key={p} style={{ backgroundColor: c.surfaceAlt, borderColor: c.border, borderWidth: 1, borderRadius: radius.md, padding: spacing.md, marginTop: spacing.sm }}>
              <Text style={{ color: c.ink, fontWeight: '700' }}>{p}</Text>
              <Text style={{ color: c.muted, fontSize: type.small }}>{p === 'Free' ? '5 habits · 1 routine · core stats' : 'Unlimited habits & routines · advanced charts · widgets · backup/sync'}</Text>
            </View>
          ))
        )}
        {configured && (
          <Pressable onPress={() => { setMessage(null); ui?.refreshRevenueCat(); }} style={{ minHeight: 48, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: c.primary, fontWeight: '700' }}>Retry loading products</Text>
          </Pressable>
        )}
        {message && <Note>{message}</Note>}
        {ui?.revenueCatError && <Note>{ui.revenueCatError}</Note>}
        {!configured && <Note>UI preview — tapping a plan does nothing and unlocks nothing. Closing this overlay returns to your current screen, with no draft lost.</Note>}
        <Btn label="Close paywall" onPress={onClose} />
        {configured ? (
          <Pressable onPress={onRestore} disabled={restoring} style={{ minHeight: 48, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: c.primary, fontWeight: '700' }}>{restoring ? 'Restoring…' : 'Restore purchases'}</Text>
          </Pressable>
        ) : (
          <Pressable onPress={onClose} style={{ minHeight: 48, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: c.primary, fontWeight: '700' }}>Restore purchases (preview — not connected)</Text></Pressable>
        )}
      </View>
    </View>
  );
}
