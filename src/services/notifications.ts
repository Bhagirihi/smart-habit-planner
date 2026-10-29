// Local reminders via expo-notifications. Every function degrades cleanly:
// permission denial, removed habits, and restarts are handled by the caller
// showing the returned message instead of crashing. Exact-time delivery is
// not guaranteed by the platform; reminders are best-effort daily triggers.
//
// Reminder identity: each scheduled reminder's identifier is stored on the
// habit (Habit.notificationId) so a changed time, a disabled reminder, or a
// deleted habit can cancel exactly that notification instead of leaving a
// stale one scheduled. resolveReminderAction is the pure, unit-tested core
// of that decision; the async functions below are thin wrappers around the
// Expo API and are therefore not unit-tested (they need a device/emulator).
import * as Notifications from 'expo-notifications';
import type { Habit } from '../types';
Notifications.setNotificationHandler({ handleNotification: async () => ({ shouldShowAlert: true, shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }) });

export type ReminderAction = 'keep' | 'schedule' | 'cancel' | 'none';
// old: the habit as stored before this edit (null for a brand-new habit).
// next: the habit as it will be stored.
export function resolveReminderAction(old: Pick<Habit, 'name' | 'reminderEnabled' | 'reminderTime' | 'notificationId'> | null, next: Pick<Habit, 'name' | 'reminderEnabled' | 'reminderTime'>): ReminderAction {
  if (!next.reminderEnabled || !next.reminderTime) return old?.notificationId ? 'cancel' : 'none';
  if (old?.notificationId && old.reminderTime === next.reminderTime && old.name === next.name) return 'keep';
  return 'schedule';
}
export async function requestPermission(): Promise<boolean> {
  try { const s = await Notifications.getPermissionsAsync(); if (s.status === 'granted') return true; const r = await Notifications.requestPermissionsAsync(); return r.status === 'granted'; } catch { return false; }
}
export async function cancelReminder(id: string | null | undefined): Promise<void> {
  if (!id) return;
  try { await Notifications.cancelScheduledNotificationAsync(id); } catch { /* offline-safe */ }
}
export async function scheduleHabitReminder(h: Habit, previousId?: string | null): Promise<{ ok: boolean; message: string; notificationId: string | null }> {
  if (previousId) await cancelReminder(previousId);
  if (!h.reminderEnabled || !h.reminderTime) return { ok: true, message: 'No reminder set.', notificationId: null };
  try {
    const ok = await requestPermission();
    if (!ok) return { ok: false, message: 'Notification permission was denied, so this reminder could not be scheduled. Enable notifications in your device settings, then save the habit again. The habit itself was saved.', notificationId: null };
    const [hour, minute] = h.reminderTime.split(':').map(Number);
    const id = await Notifications.scheduleNotificationAsync({ content: { title: h.name, body: 'Time for your habit.' }, trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute } });
    return { ok: true, message: 'Reminder scheduled.', notificationId: id };
  } catch (e) { return { ok: false, message: `Reminder could not be scheduled: ${String(e)} The habit itself was saved.`, notificationId: null }; }
}
export async function cancelAllReminders(): Promise<void> { try { await Notifications.cancelAllScheduledNotificationsAsync(); } catch { /* offline-safe */ } }
