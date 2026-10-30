import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { c, type, spacing } from '../theme';
import { Btn, Screen } from '../components/ui';
import type { ScreenProps } from './props';

export default function Splash({ nav }: ScreenProps) {
  return (
    <Screen>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 72 }}>🌿</Text>
        <Text style={{ color: c.ink, fontSize: 28, fontWeight: '800', marginTop: spacing.lg, textAlign: 'center' }}>Smart Habit</Text>
        <Text style={{ color: c.muted, fontSize: type.body, marginTop: spacing.sm, textAlign: 'center' }}>Build better habits. A healthier, happier you.</Text>
        <Text style={{ color: c.muted, fontSize: type.small, marginTop: spacing.xxl }}>UI preview — static data only, nothing is saved.</Text>
        <Text style={{ color: c.muted, fontSize: type.small, marginTop: spacing.sm }}>v1.0.1 · Tour: root-measured frames · Widget: week-top</Text>
      </View>
      <Btn label="Continue as a returning user → Today" onPress={() => nav.goTab('today')} />
      <Btn label="Start onboarding → Welcome" ghost onPress={() => nav.push({ name: 'welcome' })} />
      <Pressable onPress={() => nav.push({ name: 'login' })} style={{ minHeight: 48, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: c.primary, fontWeight: '700' }}>Log in (UI preview)</Text>
      </Pressable>
    </Screen>
  );
}
