// Local reminders via expo-notifications. Every function degrades cleanly:
// permission denial, removed habits, and restarts are handled by the caller
// showing the returned message instead of crashing. Exact-time delivery is
// not guaranteed by the platform; reminders are best-effort daily triggers.
import * as Notifications from 'expo-notifications';
import type { Habit } from '../types';
Notifications.setNotificationHandler({ handleNotification: async () => ({ shouldShowAlert: true, shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }) });
export async function requestPermission(): Promise<boolean> {
  try { const s = await Notifications.getPermissionsAsync(); if (s.status === 'granted') return true; const r = await Notifications.requestPermissionsAsync(); return r.status === 'granted'; } catch { return false; }
}
export async function scheduleHabitReminder(h: Habit): Promise<{ ok: boolean; message: string }> {
  if (!h.reminderEnabled || !h.reminderTime) return { ok: true, message: 'No reminder set.' };
  try {
    const ok = await requestPermission();
    if (!ok) return { ok: false, message: 'Notification permission was denied, so this reminder could not be scheduled. Enable notifications in system settings to use reminders.' };
    const [hour, minute] = h.reminderTime.split(':').map(Number);
    await Notifications.scheduleNotificationAsync({ content: { title: h.name, body: 'Time for your habit.' }, trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute } });
    return { ok: true, message: 'Reminder scheduled.' };
  } catch (e) { return { ok: false, message: `Reminder could not be scheduled: ${String(e)}` }; }
}
export async function cancelAllReminders(): Promise<void> { try { await Notifications.cancelAllScheduledNotificationsAsync(); } catch { /* offline-safe */ } }
