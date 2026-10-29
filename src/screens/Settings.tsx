import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, GhostButton, Inset, SectionTitle } from '../components/ui';
import type { Nav } from '../navigation';
import { useStore } from '../store';
import { syncStatus } from '../services/sync';
import { c, radius, spacing, type } from '../theme';

const DELETE_WARNING =
  'This deletes all habits, completions, routines and preferences on this device and cancels scheduled reminders. Cloud data is not connected, so nothing is uploaded to delete.';
const SUBSCRIPTION_MESSAGE =
  'No subscription is configured in this build, so there is nothing to manage. This app runs in demo mode and no purchase has been made.';

function isValidTime(value: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function Row({ label, detail, onPress }: { label: string; detail?: string; onPress?: () => void }) {
  return (
    <Pressable style={s.row} onPress={onPress} disabled={!onPress} accessibilityRole={onPress ? 'button' : undefined}>
      <View style={s.rowTextWrap}>
        <Text style={s.rowLabel}>{label}</Text>
        {detail ? <Text style={s.rowDetail}>{detail}</Text> : null}
      </View>
      {onPress ? <Text style={s.chevron}>›</Text> : null}
    </Pressable>
  );
}

export function Settings({ nav }: { nav: Nav }) {
  const { prefs, setPrefs, deleteAllData } = useStore();
  const [message, setMessage] = useState<string | null>(null);
  const [reviewTime, setReviewTime] = useState(prefs.eveningReviewTime);
  const [timeError, setTimeError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const saveReviewTime = () => {
    if (!isValidTime(reviewTime)) {
      setTimeError('Enter a valid time in HH:MM format (00:00 to 23:59).');
      return;
    }
    setTimeError(null);
    setPrefs({ eveningReviewTime: reviewTime });
    setMessage('Evening review time saved.');
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteAllData();
      setConfirmingDelete(false);
      setMessage('All local data has been deleted.');
    } catch {
      setMessage('Data could not be deleted. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.content}>
        <Text style={s.title}>Settings</Text>

        <SectionTitle>Profile</SectionTitle>
        <Card>
          <View style={s.profileRow}>
            <View style={s.avatar}>
              <Text style={s.avatarText}>👤</Text>
            </View>
            <View style={s.rowTextWrap}>
              <Text style={s.rowLabel}>Local profile</Text>
              <Text style={s.rowDetail}>On this device</Text>
            </View>
          </View>
          <Text style={s.body}>Local profile — no account signed in</Text>
          <Text style={s.body}>
            There is no account in this build, so no name or email is stored. Your habits live only on this device.
          </Text>
        </Card>

        <SectionTitle>Backup and sync</SectionTitle>
        <Card>
          <Text style={s.body}>{syncStatus()}</Text>
          <Text style={s.body}>Continue offline — the app works fully without a connection.</Text>
        </Card>

        <SectionTitle>Notifications</SectionTitle>
        <Card>
          <View style={s.toggleRow}>
            <View style={s.rowTextWrap}>
              <Text style={s.rowLabel}>Notifications</Text>
              <Text style={s.rowDetail}>Habit reminders and the evening review</Text>
            </View>
            <Switch
              value={prefs.notificationsEnabled}
              onValueChange={(value) => setPrefs({ notificationsEnabled: value })}
            />
          </View>
          <Text style={s.label}>Evening review time (HH:MM)</Text>
          <TextInput
            style={s.input}
            value={reviewTime}
            onChangeText={(value) => {
              setReviewTime(value);
              setTimeError(null);
            }}
            onBlur={saveReviewTime}
            onSubmitEditing={saveReviewTime}
            placeholder="21:00"
            placeholderTextColor={c.muted}
            keyboardType="numbers-and-punctuation"
            maxLength={5}
          />
          {timeError ? <Text style={s.errorText}>{timeError}</Text> : null}
          <Text style={s.body}>Saved time: {prefs.eveningReviewTime}</Text>
        </Card>

        <SectionTitle>Appearance</SectionTitle>
        <Card>
          <Row label="Theme" detail="Dark (Deep Teal Console)" />
          <Text style={s.body}>The theme is dark-only in this build.</Text>
        </Card>

        <SectionTitle>Help and support</SectionTitle>
        <Card>
          <Row label="Help & Support" detail="Streaks, rest days, free limits, demo paywall, offline use" onPress={() => nav.push({ name: 'help' })} />
        </Card>

        <SectionTitle>Premium</SectionTitle>
        <Card>
          <Row label="Upgrade to Premium" onPress={() => nav.openPaywall(nav.route)} />
          <Row label="Manage subscription" onPress={() => setMessage(SUBSCRIPTION_MESSAGE)} />
        </Card>

        <SectionTitle>Legal</SectionTitle>
        <Card>
          <Row label="Privacy Policy" detail="Stored only on this device" onPress={() => nav.push({ name: 'privacy' })} />
          <Row label="Terms of Service" detail="General description, not legal advice" onPress={() => nav.push({ name: 'terms' })} />
        </Card>

        <SectionTitle>Data</SectionTitle>
        <Card>
          {!confirmingDelete ? (
            <Row label="Delete my data" onPress={() => setConfirmingDelete(true)} />
          ) : (
            <View style={s.deleteBox}>
              <Text style={s.body}>{DELETE_WARNING}</Text>
              <Text style={s.body}>Are you sure you want to delete all local data?</Text>
              <GhostButton label={deleting ? 'Deleting…' : 'Delete all data'} onPress={() => void handleDelete()} danger />
              <GhostButton label="Keep my data" onPress={() => setConfirmingDelete(false)} />
            </View>
          )}
        </Card>

        {message ? (
          <Inset>
            <Text style={s.body}>{message}</Text>
          </Inset>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: c.bg },
  content: { padding: spacing.lg, gap: spacing.sm, paddingBottom: spacing.xxl },
  title: { fontSize: type.title, fontWeight: '600', color: c.ink },
  body: { fontSize: type.body, color: c.muted, lineHeight: 20 },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: { width: 48, height: 48, borderRadius: radius.md, backgroundColor: c.surfaceTonal, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 24 },
  row: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  rowTextWrap: { flex: 1, gap: 2 },
  rowLabel: { fontSize: type.label, fontWeight: '600', color: c.ink },
  rowDetail: { fontSize: type.small, color: c.muted, lineHeight: 18 },
  chevron: { fontSize: 20, color: c.muted },
  toggleRow: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  label: { fontSize: type.label, fontWeight: '600', color: c.ink },
  input: {
    minHeight: 48,
    backgroundColor: c.surfaceAlt,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    fontSize: type.label,
    color: c.ink,
  },
  errorText: { fontSize: type.body, color: c.error, lineHeight: 20 },
  deleteBox: { gap: spacing.sm },
});
