import React, { useState } from 'react';
import { Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { c, spacing, type } from '../theme';
import { Back, Btn, Card, Note, Row, Screen, Sub, Title } from '../components/ui';
import type { ScreenProps } from './props';

function SettingRow({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={{ minHeight: 48, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: c.surface, borderColor: c.border, borderWidth: 1, borderRadius: 12, padding: spacing.md, marginBottom: spacing.sm }}>
      <Text style={{ color: c.ink }}>{label}</Text><Text style={{ color: c.primary }}>›</Text>
    </Pressable>
  );
}

export function Settings({ nav, ui }: ScreenProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Title>Settings</Title>
        <Card>
          <Row><Text style={{ color: c.ink, fontWeight: '700' }}>Account</Text><Text style={{ color: c.muted }}>Not signed in (UI preview)</Text></Row>
          <Btn label="Log in / Sign up" ghost onPress={() => nav.push({ name: 'login' })} />
        </Card>
        <Card>
          <Row><Text style={{ color: c.ink }}>Notifications</Text><Switch value={ui.notifEnabled} onValueChange={ui.toggleNotif} trackColor={{ true: c.primary, false: c.surfaceAlt }} thumbColor={c.ink} /></Row>
          <Text style={{ color: c.muted, marginTop: spacing.sm }}>Evening review time: 9:00 PM (static preview)</Text>
        </Card>
        <Text style={{ color: c.ink, fontWeight: '700', marginBottom: spacing.sm }}>Help & Legal</Text>
        <SettingRow label="Help — Show guide again" onPress={() => nav.push({ name: 'legal', page: 'Help' })} />
        <SettingRow label="Terms of Use" onPress={() => nav.push({ name: 'legal', page: 'Terms' })} />
        <SettingRow label="Privacy Policy" onPress={() => nav.push({ name: 'legal', page: 'Privacy' })} />
        <Btn label="Upgrade to Premium" onPress={nav.openPaywall} />
        <Card>
          <Text style={{ color: c.error, fontWeight: '700' }}>Delete my data (UI only)</Text>
          <Text style={{ color: c.muted, marginTop: 4 }}>In the full app this is a two-step flow and resets onboarding. Here it does nothing and deletes nothing.</Text>
          {!confirmDelete ? (
            <Btn label="Delete my data" ghost onPress={() => setConfirmDelete(true)} />
          ) : (
            <View><Text style={{ color: c.muted, marginTop: spacing.sm }}>Are you sure? This is a preview — nothing will be deleted.</Text><Btn label="Yes, delete (preview only, no action)" onPress={() => setConfirmDelete(false)} /></View>
          )}
        </Card>
        <Note>UI preview — static data only. No account, sync, or purchase is connected.</Note>
      </ScrollView>
    </Screen>
  );
}

export function Legal({ nav }: ScreenProps) {
  const route = nav.route;
  const page = route.name === 'legal' ? route.page : 'Help';
  const body = page === 'Terms'
    ? 'UI preview Terms: this is placeholder text for the design preview only. It is not a legal document for a released app.'
    : page === 'Privacy'
      ? 'UI preview Privacy: in this preview no data leaves the device, because there is no backend, no sync, and no analytics. A released app needs a real privacy policy before it collects anything.'
      : 'UI preview Help: tap a habit row for detail, tap ✓ to check it off for this session, use + to add a habit or routine, and open Weekly Report to try Apply / Dismiss on suggestions. Reloading resets everything.';
  return (
    <Screen>
      <Back label="‹ Back" onPress={nav.back} />
      <Title>{page}</Title>
      <Sub>Sub-screen, reached from Settings. Static preview text only.</Sub>
      <Card><Text style={{ color: c.ink, fontSize: type.body }}>{body}</Text></Card>
      {page === 'Help' && <Btn label="Show guide again (goes to Today)" onPress={() => nav.goTab('today')} />}
    </Screen>
  );
}
