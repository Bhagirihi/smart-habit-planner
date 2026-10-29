import React, { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useStore } from '../store';
import { spacing, type, type Palette } from '../theme';
import { useTheme } from '../useTheme';
import { Card, Chip, GhostButton, PrimaryButton } from '../components/ui';
import ProBadge from '../components/ProBadge';
import type { Nav } from '../navigation';
import { requestNotificationPermission } from '../lib/notifications';

const REVIEW_TIMES = ['19:00', '20:00', '21:00', '22:00'];

function makeStyles(c: Palette) {
  return StyleSheet.create({
    wrap: { flexGrow: 1, padding: spacing.lg, gap: 14, backgroundColor: c.bg },
    hero: { fontSize: type.title, fontWeight: '800', color: c.ink },
    cardTitle: { fontSize: type.subtitle, fontWeight: '700', color: c.ink },
    body: { fontSize: type.body, color: c.muted, lineHeight: 22, marginVertical: 4 },
    label: { fontSize: type.body, fontWeight: '700', color: c.ink, marginTop: 10 },
    chips: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 6 },
    danger: { borderColor: c.red },
  });
}

export default function Settings({ nav }: { nav: Nav }): React.JSX.Element {
  const c = useTheme();
  const styles = useMemo(() => makeStyles(c), [c]);
  const { state, updateSettings, resetAll, isPremium } = useStore();
  const [confirmStep, setConfirmStep] = useState(0);

  async function enableNotifications() {
    const granted = await requestNotificationPermission();
    if (granted) {
      updateSettings({ notificationsEnabled: true });
      Alert.alert('Reminders on', 'Habit reminders and the evening review are now scheduled on this phone.');
    } else {
      Alert.alert('Permission not granted', 'Reminders stay off. You can allow them later from your phone Settings, then toggle this switch again.');
    }
  }

  function deleteAll() {
    if (confirmStep === 0) {
      setConfirmStep(1);
      return;
    }
    // Second confirmation, then wipe.
    Alert.alert('Delete everything?', 'This removes all habits, routines, check-ins and settings from this phone.', [
      { text: 'Cancel', style: 'cancel', onPress: () => setConfirmStep(0) },
      {
        text: 'Delete everything',
        style: 'destructive',
        onPress: () => {
          resetAll();
          setConfirmStep(0);
        },
      },
    ]);
  }

  return (
    <ScrollView contentContainerStyle={styles.wrap}>
      <Text style={styles.hero}>Settings</Text>

      <Card>
        <Text style={styles.cardTitle}>Appearance</Text>
        <Text style={styles.body}>Light is bright and colourful. Dark is easy on the eyes at night. The choice is saved on this phone.</Text>
        <View style={styles.chips}>
          <Chip label="Light" selected={state.settings.themeMode !== 'dark'} onPress={() => updateSettings({ themeMode: 'light' })} />
          <Chip label="Dark" selected={state.settings.themeMode === 'dark'} onPress={() => updateSettings({ themeMode: 'dark' })} />
        </View>
      </Card>

      <Card>
        <Text style={styles.cardTitle}>Notifications</Text>
        <Text style={styles.body}>Reminders are local to this phone. Nothing is sent to a server in v1.</Text>
        <View style={styles.chips}>
          <Chip label="Reminders on" selected={state.settings.notificationsEnabled} onPress={() => void enableNotifications()} />
          <Chip label="Reminders off" selected={!state.settings.notificationsEnabled} onPress={() => updateSettings({ notificationsEnabled: false })} />
        </View>
        <Text style={styles.label}>Evening review time</Text>
        <View style={styles.chips}>
          {REVIEW_TIMES.map((t) => (
            <Chip key={t} label={t} selected={state.settings.eveningReviewTime === t} onPress={() => updateSettings({ eveningReviewTime: t })} />
          ))}
        </View>
      </Card>

      <Card>
        <Text style={styles.cardTitle}>Backup and sync</Text>
        <Text style={styles.body}>v1 stores everything on this phone only (AsyncStorage). Cloud backup and cross-device sync are TODO for v2, and need a backend before they are promised to users.</Text>
        <Text style={styles.body}>Goal: {state.settings.goal || 'Not set'} · Wake time: {state.settings.wakeTime}</Text>
        <Text style={styles.body}>Habits: {state.habits.length} · Routines: {state.routines.length}</Text>
      </Card>

      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={styles.cardTitle}>Premium</Text>
          <ProBadge />
        </View>
        <Text style={styles.body}>{isPremium ? 'Premium preview is ON (demo switch below).' : 'You are on the Free plan.'}</Text>
        <GhostButton label="See Premium plans" onPress={() => nav.openPaywall()} />
        <View style={{ height: 10 }} />
        <Text style={styles.label}>Demo only: preview Premium gates</Text>
        <Text style={styles.body}>This switch is for testing the paywall gates. It is NOT a purchase and must not be presented to users as one.</Text>
        <View style={styles.chips}>
          <Chip label="Preview on" selected={state.settings.premiumDemo} onPress={() => updateSettings({ premiumDemo: true })} />
          <Chip label="Preview off" selected={!state.settings.premiumDemo} onPress={() => updateSettings({ premiumDemo: false })} />
        </View>
      </Card>

      <Card>
        <Text style={styles.cardTitle}>About</Text>
        <Text style={styles.body}>Smart Habit Planner v1.0.0 · Offline-first · No account required · No ads in v1.</Text>
      </Card>

      <Card style={styles.danger}>
        <Text style={styles.cardTitle}>Delete all my data</Text>
        <Text style={styles.body}>{confirmStep === 0 ? 'This removes everything from this phone.' : 'Are you sure? Tap again and you will get one final confirmation.'}</Text>
        <PrimaryButton label={confirmStep === 0 ? 'Delete all my data' : 'Tap again to confirm'} onPress={deleteAll} />
        {confirmStep === 1 ? <GhostButton label="Cancel, keep my data" onPress={() => setConfirmStep(0)} /> : null}
      </Card>
    </ScrollView>
  );
}
