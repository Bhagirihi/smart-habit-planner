import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { c, radius, spacing, type } from '../theme';
import { Btn, Note } from './ui';

export default function Paywall({ onClose }: { onClose: () => void }) {
  return (
    <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' }}>
      <View style={{ backgroundColor: c.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.xl }}>
        <Text style={{ color: c.ink, fontSize: type.subtitle, fontWeight: '800', textAlign: 'center' }}>Upgrade to Premium</Text>
        <Text style={{ color: c.muted, textAlign: 'center', marginTop: spacing.sm }}>Plan names only — no prices here. Prices will come from real products later, never hard-coded.</Text>
        {['Free', 'Premium Monthly', 'Premium Yearly', 'Premium Lifetime'].map((p) => (
          <View key={p} style={{ backgroundColor: c.surfaceAlt, borderColor: c.border, borderWidth: 1, borderRadius: radius.md, padding: spacing.md, marginTop: spacing.sm }}>
            <Text style={{ color: c.ink, fontWeight: '700' }}>{p}</Text>
            <Text style={{ color: c.muted, fontSize: type.small }}>{p === 'Free' ? '5 habits · 1 routine · core stats' : 'Unlimited habits & routines · advanced charts · widgets · backup/sync'}</Text>
          </View>
        ))}
        <Note>UI preview — tapping a plan does nothing and unlocks nothing. Closing this overlay returns to your current screen, with no draft lost.</Note>
        <Btn label="Close paywall" onPress={onClose} />
        <Pressable onPress={onClose} style={{ minHeight: 48, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: c.primary, fontWeight: '700' }}>Restore purchases (preview — not connected)</Text></Pressable>
      </View>
    </View>
  );
}
