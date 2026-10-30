// STEP 4 — Local notifications ONLY (expo-notifications).
//
// This is the only place the app talks to expo-notifications. Screens
// never import expo-notifications and never schedule anything directly;
// App.tsx owns the scheduling effect and Settings only displays the
// state this module reports. That keeps the "one control" rule honest:
// the Settings toggle is the single control, and it is wired to real
// scheduling/cancelling, not to UI state alone.
//
// What is scheduled (local, daily, no server):
//   - One reminder per habit, at that habit's reminder time (e.g. "7:30
//     AM" from its data). Identifier: `habit-<id>`.
//   - One evening review at 9:00 PM, matching the time Settings already
//     advertised. Identifier: `evening-review`.
// Rescheduling always cancels everything first, so enabling, editing a
// habit, or toggling can never double-schedule a reminder.
//
// What is NOT here (later steps, deliberately):
//   - No push server, no Firebase Cloud Messaging, no backend — a tap
//     only opens the app to Today. FCM/push, if wanted, is a later
//     Firebase step and needs a Firebase project + device build.
//   - No notification content beyond habit name/target and the evening
//     review prompt. No user data leaves the device for notifications.
//
// Permission, truthfully:
//   - getPermissionsAsync() is read-only and never prompts.
//   - requestPermissionsAsync() shows the system prompt ONCE per call
//     (the OS decides whether it can show again). We call it only when
//     the user turns notifications ON in Settings (or taps "Allow
//     notifications" there) — never silently on launch, never in a loop.
//   - If the result is not 'granted', NOTHING is scheduled, and the
//     denied/undetermined state is reported to Settings. When denied,
//     the OS will not show the prompt again, so Settings offers "Open
//     system settings" (Linking.openSettings) instead of re-prompting
//     into a wall.
//   - Android: a notification channel is created before scheduling, as
//     Android requires. Channel id: `habit-reminders`.
//
// Expo Go note: local notifications schedule and fire in Expo Go, so
// the toggle/permission/denied paths can be checked there. The final
// device check (prompt, delivery at the real reminder time, tap opens
// Today) still needs a phone — this step is typecheck/export-verified
// only, not device-tested (see README).

import { Linking, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import type { Habit } from './theme';

export type NotifPermission = 'granted' | 'denied' | 'undetermined' | 'unknown';

export const HABIT_CHANNEL_ID = 'habit-reminders';
export const EVENING_REVIEW_HOUR = 21;
export const EVENING_REVIEW_MINUTE = 0;

let handlerSet = false;

/** Install the foreground handler + Android channel. Idempotent. */
export async function setupNotifications(): Promise<void> {
  if (!handlerSet) {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
    handlerSet = true;
  }
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(HABIT_CHANNEL_ID, {
      name: 'Habit reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#2DD4BF',
    });
  }
}

/** Read-only permission check (never prompts). */
export async function getNotifPermission(): Promise<NotifPermission> {
  try {
    const res = await Notifications.getPermissionsAsync();
    const status = (res as { status?: string }).status;
    if (status === 'granted' || status === 'denied' || status === 'undetermined') return status;
    return 'unknown';
  } catch {
    return 'unknown';
  }
}

/**
 * Ask for permission via the system prompt. Callers must call this only
 * in response to a user action (toggle on / "Allow" button). Returns the
 * resulting status; the caller decides whether to schedule.
 */
export async function requestNotifPermission(): Promise<NotifPermission> {
  try {
    const res = await Notifications.requestPermissionsAsync();
    const status = (res as { status?: string }).status;
    if (status === 'granted' || status === 'denied' || status === 'undetermined') return status;
    return 'unknown';
  } catch {
    return 'unknown';
  }
}

/** Open the OS app-settings page (the only route when denied). */
export async function openNotifSettings(): Promise<void> {
  await Linking.openSettings();
}

/**
 * Parse a reminder string into { hour, minute } (local time).
 * Accepts "7:30 AM", "9:00 PM", "2:00 PM", and 24-hour "14:00".
 * Returns null for anything unparsable — that habit is simply skipped
 * by scheduling (never scheduled at a guessed time).
 */
export function parseReminderTime(reminder: string): { hour: number; minute: number } | null {
  const m = /^\s*(\d{1,2}):(\d{2})\s*([AaPp][Mm])?\s*$/.exec(reminder ?? '');
  if (!m) return null;
  let hour = Number(m[1]);
  const minute = Number(m[2]);
  const meridiem = m[3]?.toUpperCase();
  if (minute < 0 || minute > 59) return null;
  if (meridiem) {
    if (hour < 1 || hour > 12) return null;
    if (meridiem === 'AM') hour = hour === 12 ? 0 : hour;
    else hour = hour === 12 ? 12 : hour + 12;
  } else if (hour < 0 || hour > 23) {
    return null;
  }
  return { hour, minute };
}

/**
 * Cancel everything this app scheduled, then (re)schedule one daily
 * reminder per habit with a parsable reminder time + the evening review.
 * Returns how many habit reminders were scheduled (evening review is
 * extra and always scheduled when this runs). Callers must check
 * permission BEFORE calling this — it does not ask, and must never be
 * called when permission is not granted.
 */
export async function scheduleAllNotifications(habits: Habit[]): Promise<number> {
  await setupNotifications();
  await Notifications.cancelAllScheduledNotificationsAsync();
  let scheduled = 0;
  for (const habit of habits) {
    const time = parseReminderTime(habit.reminder);
    if (!time) continue; // unparsable reminder: skip, never guess a time
    await Notifications.scheduleNotificationAsync({
      identifier: `habit-${habit.id}`,
      content: {
        title: `${habit.icon} ${habit.name}`,
        body: `Time for ${habit.name} — ${habit.target}.`,
        data: { route: 'today', habitId: habit.id, kind: 'habit-reminder' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: time.hour,
        minute: time.minute,
        channelId: HABIT_CHANNEL_ID,
      },
    });
    scheduled++;
  }
  await Notifications.scheduleNotificationAsync({
    identifier: 'evening-review',
    content: {
      title: 'Evening review',
      body: 'How did today go? Check off any habits you still have time for.',
      data: { route: 'today', kind: 'evening-review' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: EVENING_REVIEW_HOUR,
      minute: EVENING_REVIEW_MINUTE,
      channelId: HABIT_CHANNEL_ID,
    },
  });
  return scheduled;
}

/** Cancel every notification this app scheduled. */
export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
