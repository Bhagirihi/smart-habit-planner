import * as Notifications from 'expo-notifications';
import type { Habit, Settings } from '../types';
import { parseTime } from './dates';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

/** Ask the OS for notification permission. Returns true only when granted. */
export async function requestNotificationPermission(): Promise<boolean> {
  try {
    const existing = await Notifications.getPermissionsAsync();
    if (existing.status === 'granted') return true;
    const asked = await Notifications.requestPermissionsAsync();
    return asked.status === 'granted';
  } catch {
    return false;
  }
}

export async function cancelAllNotifications(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {
    // Notifications are best-effort; never crash the app over them.
  }
}

/**
 * Re-schedule every habit reminder plus the evening review, from scratch.
 * Called after any habit/settings change, so stale reminders never linger.
 */
export async function rescheduleAll(habits: Habit[], settings: Settings): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    if (!settings.notificationsEnabled) return;
    for (const h of habits) {
      if (!h.reminderEnabled || !h.reminderTime || h.paused) continue;
      const { hour, minute } = parseTime(h.reminderTime);
      await Notifications.scheduleNotificationAsync({
        content: { title: 'Time for your habit', body: `${h.name} is waiting. One tap keeps the streak alive.` },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute },
      });
    }
    const { hour, minute } = parseTime(settings.eveningReviewTime);
    await Notifications.scheduleNotificationAsync({
      content: { title: 'Evening review', body: 'Check what you finished today and plan tomorrow.' },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute },
    });
  } catch {
    // Best-effort on devices/emulators without notification support.
  }
}
