import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useStore } from '../store';
import ProBadge from '../components/ProBadge';
import type { Nav } from '../navigation';

/**
 * Dark premium paywall (near-black + bright green + orange PRO pills), fixed
 * dark style like onboarding so the premium pitch reads the same in Light
 * and Dark mode. Gate contract is unchanged: purchase/restore are honest
 * v1 placeholders that show a not-wired-yet message and never unlock
 * anything, and Close returns via nav.pop(). The old "Backup and sync (v2)"
 * premium bullet was dropped: it is not implemented, so it must not be
 * sold as a Premium feature.
 */

const BG = '#0A0A0A';
const CARD = '#1C1C1E';
const BORDER = '#2A2A2E';
const GREEN = '#4ADE80';
const WHITE = '#FFFFFF';
const GREY = '#9CA3AF';

const PLANS = [
  { id: 'monthly', label: 'Monthly', price: '₹149 / month', note: 'Cancel any time' },
  { id: 'yearly', label: 'Yearly', price: '₹999 / year', note: 'About ₹83 / month · Best Value' },
  { id: 'lifetime', label: 'Lifetime', price: '₹1,999 once', note: 'Pay once, keep it forever' },
];

const FREE_ROWS = [
  { label: 'Basic habit tracking', detail: 'Up to 5 habits, 1 routine' },
  { label: 'Daily reminders', detail: 'Local reminders on your phone' },
  { label: 'Skips and pauses', detail: 'Planned skips never break a streak' },
];

const PREMIUM_ROWS = [
  { label: 'Unlimited habits', detail: 'No 5-habit cap' },
  { label: 'Unlimited routines', detail: 'No 1-routine cap' },
  { label: 'Weekly suggestions with Apply', detail: 'One-tap fixes every Sunday' },
  { label: 'Advanced charts and heatmaps', detail: 'Trends beyond the basic calendar' },
  { label: 'Task repeats', detail: 'Daily and Weekly repeats on tasks (Never is free)' },
  { label: 'Import Calendar', detail: 'Bring timed entries into Plan day (coming soon, Premium only)' },
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
    <ScrollView contentContainerStyle={styles.wrap} style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.crown}>♛</Text>
        <Text style={styles.hero}>Unlock Premium</Text>
        <Text style={styles.heroBody}>Go beyond the basics: more habits, more routines, and smarter weekly guidance, with no extra setup.</Text>
      </View>

      <Text style={styles.sectionTitle}>Included free</Text>
      {FREE_ROWS.map((r) => (
        <View key={r.label} style={styles.row}>
          <Text style={styles.check}>✓</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>{r.label}</Text>
            <Text style={styles.rowDetail}>{r.detail}</Text>
          </View>
        </View>
      ))}

      <Text style={styles.sectionTitle}>Premium unlocks</Text>
      {PREMIUM_ROWS.map((r) => (
        <View key={r.label} style={styles.row}>
          <Text style={isPremium ? styles.check : styles.lock}>{isPremium ? '✓' : '🔒'}</Text>
          <View style={{ flex: 1 }}>
            <View style={styles.rowTitleRow}>
              <Text style={styles.rowTitle}>{r.label}</Text>
              {!isPremium ? <ProBadge /> : null}
            </View>
            <Text style={styles.rowDetail}>{r.detail}</Text>
          </View>
        </View>
      ))}

      {isPremium ? (
        <View style={styles.noteCard}>
          <Text style={styles.rowTitle}>Premium preview is on</Text>
          <Text style={styles.rowDetail}>This is the demo preview switch from Settings, not a real purchase. Turn it off in Settings to test the free gates again.</Text>
        </View>
      ) : null}

      <Text style={styles.sectionTitle}>Choose a plan</Text>
      {PLANS.map((p) => {
        const on = selected === p.id;
        const best = p.id === 'yearly';
        return (
          <Pressable key={p.id} onPress={() => setSelected(p.id)} style={[styles.planCard, on && styles.planSelected, best && styles.planBest]}>
            <View style={styles.planHead}>
              <Text style={styles.planLabel}>{p.label}</Text>
              {best ? (
                <View style={styles.bestPill}>
                  <Text style={styles.bestPillText}>BEST VALUE</Text>
                </View>
              ) : null}
            </View>
            <Text style={styles.planPrice}>{p.price}</Text>
            <Text style={styles.rowDetail}>{p.note}</Text>
            <Text style={[styles.planState, on && styles.planStateOn]}>{on ? '● Selected' : '○ Select'}</Text>
          </Pressable>
        );
      })}

      <Pressable onPress={purchase} style={styles.greenBtn}>
        <Text style={styles.greenBtnText}>Continue with selected plan</Text>
      </Pressable>
      <Pressable onPress={restore} style={styles.ghostBtn}>
        <Text style={styles.ghostBtnText}>Restore purchase</Text>
      </Pressable>
      <Pressable onPress={nav.pop} style={styles.ghostBtn}>
        <Text style={styles.ghostBtnText}>Close</Text>
      </Pressable>
      <Text style={styles.note}>v1 note: purchase and restore are placeholders. Do not ship to the Play Store with real prices until RevenueCat is wired and verified.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: BG },
  wrap: { flexGrow: 1, padding: 22, gap: 14, backgroundColor: BG },
  header: { backgroundColor: CARD, borderRadius: 26, borderWidth: 1, borderColor: BORDER, padding: 20, gap: 8, alignItems: 'center' },
  crown: { fontSize: 40, color: GREEN },
  hero: { fontSize: 30, fontWeight: '800', color: WHITE, textAlign: 'center' },
  heroBody: { fontSize: 15, color: GREY, lineHeight: 22, textAlign: 'center' },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: WHITE, marginTop: 6 },
  row: { flexDirection: 'row', gap: 12, backgroundColor: CARD, borderRadius: 16, borderWidth: 1, borderColor: BORDER, padding: 14, alignItems: 'flex-start' },
  check: { color: GREEN, fontSize: 18, fontWeight: '800' },
  lock: { fontSize: 16 },
  rowTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  rowTitle: { fontSize: 15, fontWeight: '700', color: WHITE },
  rowDetail: { fontSize: 13, color: GREY, lineHeight: 19, marginTop: 2 },
  noteCard: { backgroundColor: CARD, borderRadius: 16, borderWidth: 1, borderColor: GREEN, padding: 14, gap: 4 },
  planCard: { backgroundColor: CARD, borderRadius: 20, borderWidth: 1.5, borderColor: BORDER, padding: 16, gap: 4 },
  planSelected: { borderColor: GREEN, borderWidth: 2 },
  planBest: { borderWidth: 3, borderColor: GREEN },
  planHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  planLabel: { fontSize: 17, fontWeight: '800', color: WHITE },
  bestPill: { backgroundColor: GREEN, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  bestPillText: { color: '#0A0A0A', fontSize: 11, fontWeight: '800' },
  planPrice: { fontSize: 18, fontWeight: '800', color: GREEN },
  planState: { fontSize: 13, color: GREY, fontWeight: '700', marginTop: 4 },
  planStateOn: { color: GREEN },
  greenBtn: { borderRadius: 14, minHeight: 56, backgroundColor: GREEN, alignItems: 'center', justifyContent: 'center' },
  greenBtnText: { color: '#0A0A0A', fontSize: 16, fontWeight: '800' },
  ghostBtn: { borderRadius: 14, minHeight: 48, borderWidth: 1, borderColor: BORDER, backgroundColor: CARD, alignItems: 'center', justifyContent: 'center' },
  ghostBtnText: { color: WHITE, fontSize: 15, fontWeight: '600' },
  note: { fontSize: 13, color: GREY, lineHeight: 19, textAlign: 'center' },
});
