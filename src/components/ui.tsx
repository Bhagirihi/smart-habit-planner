import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { radii, spacing, type, type Palette } from '../theme';
import { useTheme } from '../useTheme';

function makeStyles(c: Palette) {
  return StyleSheet.create({
    card: {
      backgroundColor: c.surface,
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: c.border,
      padding: spacing.md,
      shadowColor: c.shadow,
      shadowOpacity: 0.08,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
      elevation: 2,
    },
    sectionTitle: { fontSize: type.subtitle, fontWeight: '700', color: c.ink, marginBottom: spacing.sm },
    primaryWrap: { borderRadius: radii.md, overflow: 'hidden', minHeight: 52 },
    primary: { minHeight: 52, paddingHorizontal: spacing.md, alignItems: 'center', justifyContent: 'center' },
    primaryText: { color: '#fff', fontSize: type.body, fontWeight: '700' },
    ghost: {
      borderRadius: radii.md,
      minHeight: 48,
      paddingHorizontal: spacing.md,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
    },
    ghostText: { color: c.ink, fontSize: type.body, fontWeight: '600' },
    pressed: { opacity: 0.85 },
    disabled: { opacity: 0.45 },
    chip: {
      borderRadius: 999,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
      paddingHorizontal: 14,
      minHeight: 40,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing.xs,
      marginBottom: spacing.xs,
    },
    chipSelected: { backgroundColor: c.primary, borderColor: c.primary },
    chipText: { fontSize: type.small, color: c.ink, fontWeight: '600' },
    chipTextSelected: { color: c.bg === '#0B1220' ? '#0B1220' : '#fff' },
    barTrack: { height: 10, borderRadius: 999, backgroundColor: c.surface2, overflow: 'hidden' },
    barFill: { height: '100%', borderRadius: 999 },
    empty: { alignItems: 'flex-start', gap: 8 },
    emptyTitle: { fontSize: type.subtitle, fontWeight: '700', color: c.ink },
    emptyDetail: { fontSize: type.body, color: c.muted, lineHeight: 22 },
  });
}

export function Card({ children, style }: { children: React.ReactNode; style?: object }): React.JSX.Element {
  const c = useTheme();
  const styles = useMemo(() => makeStyles(c), [c]);
  return <View style={[styles.card, style]}>{children}</View>;
}

export function SectionTitle({ children }: { children: React.ReactNode }): React.JSX.Element {
  const c = useTheme();
  const styles = useMemo(() => makeStyles(c), [c]);
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

export function PrimaryButton({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}): React.JSX.Element {
  const c = useTheme();
  const styles = useMemo(() => makeStyles(c), [c]);
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [styles.primaryWrap, pressed && styles.pressed, disabled && styles.disabled]}
      accessibilityRole="button"
    >
      <LinearGradient colors={[...c.gradient]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.primary}>
        <Text style={styles.primaryText}>{label}</Text>
      </LinearGradient>
    </Pressable>
  );
}

export function GhostButton({ label, onPress }: { label: string; onPress: () => void }): React.JSX.Element {
  const c = useTheme();
  const styles = useMemo(() => makeStyles(c), [c]);
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.ghost, pressed && styles.pressed]} accessibilityRole="button">
      <Text style={styles.ghostText}>{label}</Text>
    </Pressable>
  );
}

export function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}): React.JSX.Element {
  const c = useTheme();
  const styles = useMemo(() => makeStyles(c), [c]);
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, selected && styles.chipSelected]}
      accessibilityRole="button"
      accessibilityState={{ selected }}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </Pressable>
  );
}

/** Simple, font-scale-friendly progress bar (no SVG dependency). */
export function ProgressBar({ value, color }: { value: number; color?: string }): React.JSX.Element {
  const c = useTheme();
  const styles = useMemo(() => makeStyles(c), [c]);
  const pct = Math.max(0, Math.min(100, value));
  return (
    <View style={styles.barTrack}>
      <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: color ?? c.primary }]} />
    </View>
  );
}

export function EmptyState({ title, detail, actionLabel, onAction }: { title: string; detail: string; actionLabel?: string; onAction?: () => void }): React.JSX.Element {
  const c = useTheme();
  const styles = useMemo(() => makeStyles(c), [c]);
  return (
    <Card style={styles.empty}>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyDetail}>{detail}</Text>
      {actionLabel && onAction ? <PrimaryButton label={actionLabel} onPress={onAction} /> : null}
    </Card>
  );
}
