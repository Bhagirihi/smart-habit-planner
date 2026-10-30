import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { c, radius, spacing, type } from '../theme';

export function Card({ children }: { children: React.ReactNode }) {
  return <View style={s.card}>{children}</View>;
}
export function Inset({ children }: { children: React.ReactNode }) {
  return <View style={s.inset}>{children}</View>;
}
export function SectionTitle({ children }: { children: React.ReactNode }) {
  return <Text style={s.section}>{children}</Text>;
}
export function PrimaryButton({ label, onPress }: { label: string; onPress: () => void }) {
  return <Pressable style={s.primary} onPress={onPress} accessibilityRole="button"><Text style={s.primaryText}>{label}</Text></Pressable>;
}
export function SecondaryButton({ label, onPress }: { label: string; onPress: () => void }) {
  return <Pressable style={s.secondary} onPress={onPress} accessibilityRole="button"><Text style={s.secondaryText}>{label}</Text></Pressable>;
}
export function GhostButton({ label, onPress, danger }: { label: string; onPress: () => void; danger?: boolean }) {
  return <Pressable style={s.ghost} onPress={onPress} accessibilityRole="button"><Text style={[s.ghostText, danger && { color: c.error }]}>{label}</Text></Pressable>;
}
export function Chip({ label, active, onPress }: { label: string; active?: boolean; onPress?: () => void }) {
  return <Pressable style={[s.chip, active && s.chipActive]} onPress={onPress} accessibilityRole="button"><Text style={[s.chipText, active && s.chipTextActive]}>{label}</Text></Pressable>;
}
export function ProgressBar({ pct, color }: { pct: number; color?: string }) {
  return <View style={s.barTrack}><View style={[s.barFill, { width: `${Math.max(0, Math.min(100, pct))}%`, backgroundColor: color ?? c.primary }]} /></View>;
}
export function ProgressRing({ pct, label }: { pct: number; label: string }) {
  return (
    <View style={s.ring}>
      <Text style={s.ringPct}>{pct}%</Text>
      <Text style={s.ringLabel}>{label}</Text>
    </View>
  );
}
export function EmptyState({ title, detail, actionLabel, onAction }: { title: string; detail: string; actionLabel?: string; onAction?: () => void }) {
  return <Card><Text style={s.emptyTitle}>{title}</Text><Text style={s.emptyBody}>{detail}</Text>{actionLabel && onAction ? <View style={{ marginTop: spacing.md }}><PrimaryButton label={actionLabel} onPress={onAction} /></View> : null}</Card>;
}
export function ErrorBanner({ message }: { message: string | null }) {
  if (!message) return null;
  return <View style={s.error}><Text style={s.errorText}>{message}</Text></View>;
}
const s = StyleSheet.create({
  card: { backgroundColor: c.surface, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.sm },
  inset: { backgroundColor: c.surfaceAlt, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.sm },
  section: { fontSize: type.subtitle, fontWeight: '600', color: c.ink, marginTop: spacing.sm },
  primary: { minHeight: 48, borderRadius: radius.md, backgroundColor: c.primary, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.lg },
  primaryText: { fontSize: type.label, fontWeight: '600', color: c.onPrimary },
  secondary: { minHeight: 48, borderRadius: radius.md, backgroundColor: c.surfaceTonal, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.md },
  secondaryText: { fontSize: type.label, fontWeight: '600', color: c.ink },
  ghost: { minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  ghostText: { fontSize: type.label, fontWeight: '600', color: c.primary },
  chip: { borderRadius: radius.full, backgroundColor: c.surfaceAlt, paddingHorizontal: spacing.sm, paddingVertical: 4 },
  chipActive: { backgroundColor: c.surfaceTonal },
  chipText: { fontSize: type.small, fontWeight: '500', color: c.muted },
  chipTextActive: { color: c.ink },
  barTrack: { height: 12, borderRadius: radius.full, backgroundColor: c.surfaceAlt, overflow: 'hidden' },
  barFill: { height: 12, borderRadius: radius.full },
  ring: { width: 128, height: 128, borderRadius: 64, backgroundColor: c.surfaceAlt, alignItems: 'center', justifyContent: 'center', gap: 2 },
  ringPct: { fontSize: type.numeral, fontWeight: '600', color: c.ink },
  ringLabel: { fontSize: type.caption, color: c.muted },
  emptyTitle: { fontSize: type.subtitle, fontWeight: '600', color: c.ink },
  emptyBody: { fontSize: type.body, color: c.muted, lineHeight: 20 },
  error: { backgroundColor: '#3B0A12', borderRadius: radius.md, padding: spacing.md },
  errorText: { fontSize: type.body, color: c.error },
});
