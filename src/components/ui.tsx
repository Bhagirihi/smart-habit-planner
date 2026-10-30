import React from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { c, radius, spacing, type } from '../theme';

export function Screen({ children }: { children: React.ReactNode }) {
  return <View style={{ flex: 1, backgroundColor: c.bg, paddingHorizontal: spacing.lg, paddingTop: spacing.md }}>{children}</View>;
}
export function Title({ children }: { children: React.ReactNode }) {
  return <Text style={{ color: c.ink, fontSize: type.title, fontWeight: '700', marginBottom: spacing.sm }}>{children}</Text>;
}
export function Sub({ children }: { children: React.ReactNode }) {
  return <Text style={{ color: c.muted, fontSize: type.body, marginBottom: spacing.lg }}>{children}</Text>;
}
export function Card({ children }: { children: React.ReactNode }) {
  return <View style={{ backgroundColor: c.surface, borderColor: c.border, borderWidth: 1, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.md }}>{children}</View>;
}
export function Row({ children }: { children: React.ReactNode }) {
  return <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>{children}</View>;
}
export function Btn({ label, onPress, ghost = false }: { label: string; onPress: () => void; ghost?: boolean }) {
  return (
    <Pressable onPress={onPress} style={{ minHeight: 48, justifyContent: 'center', alignItems: 'center', backgroundColor: ghost ? c.surface : c.primary, borderColor: c.border, borderWidth: ghost ? 1 : 0, borderRadius: radius.lg, paddingHorizontal: spacing.lg, marginVertical: spacing.sm, shadowColor: ghost ? 'transparent' : c.primary, shadowOpacity: ghost ? 0 : 0.35, shadowRadius: 10, elevation: ghost ? 0 : 3 }}>
      <Text style={{ color: ghost ? c.ink : c.onPrimary, fontSize: type.label, fontWeight: '700' }}>{label}</Text>
    </Pressable>
  );
}
export function Back({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={{ minHeight: 48, justifyContent: 'center' }}>
      <Text style={{ color: c.primary, fontSize: type.label, fontWeight: '700' }}>{label}</Text>
    </Pressable>
  );
}
export function Field({ label, value, onChange, secure = false, placeholder = '' }: { label: string; value: string; onChange: (v: string) => void; secure?: boolean; placeholder?: string }) {
  return (
    <View style={{ marginBottom: spacing.md }}>
      <Text style={{ color: c.ink, fontSize: type.label, fontWeight: '600', marginBottom: spacing.sm }}>{label}</Text>
      <TextInput value={value} onChangeText={onChange} secureTextEntry={secure} placeholder={placeholder} placeholderTextColor={c.muted} style={{ minHeight: 48, backgroundColor: c.surface, color: c.ink, borderColor: c.border, borderWidth: 1, borderRadius: radius.md, paddingHorizontal: spacing.md, fontSize: type.body }} />
    </View>
  );
}
export function IconTile({ icon, color }: { icon: string; color: string }) {
  return (
    <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: c.tonal, borderColor: color, borderWidth: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: 22 }}>{icon}</Text>
    </View>
  );
}
export function Heatmap({ color, habitId, cells = 42 }: { color: string; habitId: string; cells?: number }) {
  const { heatCell, heatColor } = require('../data');
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
      {Array.from({ length: cells }, (_, i) => (
        <View key={i} style={{ width: 12, height: 12, borderRadius: 3, margin: 2, backgroundColor: heatColor(heatCell(habitId, i), color) }} />
      ))}
    </View>
  );
}
export function Ring({ done, total }: { done: number; total: number }) {
  return (
    <View style={{ width: 180, height: 180, borderRadius: 90, borderWidth: 10, borderColor: c.primary, backgroundColor: c.surface, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginVertical: spacing.lg, shadowColor: c.primary, shadowOpacity: 0.4, shadowRadius: 16, elevation: 4 }}>
      <Text style={{ color: c.ink, fontSize: 36, fontWeight: '800' }}>{done} of {total}</Text>
      <Text style={{ color: c.muted, fontSize: type.small, textAlign: 'center' }}>Habits completed today</Text>
    </View>
  );
}
export function Note({ children }: { children: React.ReactNode }) {
  return (
    <View style={{ backgroundColor: c.tonal, borderColor: c.border, borderWidth: 1, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md }}>
      <Text style={{ color: c.muted, fontSize: type.small }}>{children}</Text>
    </View>
  );
}
