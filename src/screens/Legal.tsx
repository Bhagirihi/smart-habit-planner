// In-app Terms, Privacy, and Help sub-screens. These are sub-screens, not
// new primary screens: the primary count stays at 14. The legal texts are
// generic descriptions of this offline build, not legal advice, and no
// account, name, or email is invented anywhere in them.
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, GhostButton, SectionTitle } from '../components/ui';
import type { Nav } from '../navigation';
import { c, spacing, type } from '../theme';

function Shell({ nav, title, children }: { nav: Nav; title: string; children: React.ReactNode }) {
  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.content}>
        <GhostButton label="Back" onPress={() => nav.back()} />
        <Text style={s.title}>{title}</Text>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

function Para({ children }: { children: React.ReactNode }) {
  return <Text style={s.body}>{children}</Text>;
}

export function TermsScreen({ nav }: { nav: Nav }) {
  return (
    <Shell nav={nav} title="Terms of Service">
      <Card>
        <Para>These terms describe use of Smart Habit &amp; Routine Planner as a personal habit tracker on your device.</Para>
        <Para>You use the app at your own pace. Habit, routine, and streak information is a personal record, not medical, fitness, or professional advice, and it does not replace advice from a qualified professional.</Para>
        <Para>Premium features are not sold in this build: the paywall runs in demo mode, no subscription products are configured, no payment is taken, and nothing is unlocked by tapping a plan.</Para>
        <Para>This text is a general description of how this build works. It is not legal advice.</Para>
      </Card>
    </Shell>
  );
}

export function PrivacyScreen({ nav }: { nav: Nav }) {
  return (
    <Shell nav={nav} title="Privacy Policy">
      <Card>
        <Para>This offline build collects and sends no data. Your habits, completions, routines, and preferences are stored only in a local database on your device.</Para>
        <Para>There is no account, no sign-in, no analytics, no advertising, and no cloud backup in this build. Nothing leaves the device, so there is no server copy to request or delete.</Para>
        <Para>Reminders are local notifications scheduled on your device. Deleting your data from Settings removes your local habits, completions, routines, and preferences and cancels scheduled reminders.</Para>
        <Para>If a future build adds an account or cloud backup, this policy must be updated before that build is released, and it will state exactly what is collected and where it is stored.</Para>
        <Para>This text is a general description of how this build works. It is not legal advice.</Para>
      </Card>
    </Shell>
  );
}

const FAQS: { q: string; a: string }[] = [
  { q: 'How do streaks work?', a: 'Marking a habit done on a day it is scheduled adds to its streak. A missed scheduled day resets the streak to 0. Days a habit is not scheduled do not count for or against it.' },
  { q: 'What about rest days and skips?', a: 'Planned skip or rest days entered on the habit form are never counted as failures, so they do not break a streak. Marking a habit skipped in advance also does not break it.' },
  { q: 'What is free, and what is Premium?', a: 'Free allows up to 5 active habits and 1 routine, with basic progress and reminders. Premium would allow unlimited habits and routines, advanced analytics, custom reminders, and personalised weekly suggestions.' },
  { q: 'Why does the paywall not charge me?', a: 'This build runs in demo mode. No subscription products are configured, so the plan prices shown are demo samples only. Tapping a plan or Restore takes no payment and unlocks nothing.' },
  { q: 'Does the app work offline?', a: 'Yes. Everything is stored on your device and works without an internet connection or an account. There is no cloud backup in this build.' },
  { q: 'Why did my reminder not arrive?', a: 'Reminders need notification permission, and exact delivery times are not guaranteed by the platform. Check device notification settings, then save the habit again so its reminder can be rescheduled.' },
];

export function HelpScreen({ nav }: { nav: Nav }) {
  return (
    <Shell nav={nav} title="Help & Support">
      {FAQS.map((f) => (
        <View key={f.q}>
          <SectionTitle>{f.q}</SectionTitle>
          <Card>
            <Para>{f.a}</Para>
          </Card>
        </View>
      ))}
      <Card>
        <Para>Still stuck? There is no in-app support inbox in this build. Contact the developer through the store listing once the app is published.</Para>
      </Card>
    </Shell>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: c.bg },
  content: { padding: spacing.lg, gap: spacing.lg },
  title: { fontSize: type.title, fontWeight: '600', color: c.ink },
  body: { fontSize: type.body, color: c.muted, lineHeight: 22 },
});
