import { describe, expect, test } from '@jest/globals';
import { resolveReminderAction } from '../src/services/notifications';

// Only the pure decision is unit-tested here. The Expo scheduling calls
// themselves (permission prompt, scheduleNotificationAsync) need a device or
// emulator and are deliberately not faked in tests.
const stored = { name: 'Drink water', reminderEnabled: true, reminderTime: '09:00', notificationId: 'notif-1' };

describe('resolveReminderAction', () => {
  test('unchanged reminder is kept, never rescheduled', () => {
    expect(resolveReminderAction(stored, { name: 'Drink water', reminderEnabled: true, reminderTime: '09:00' })).toBe('keep');
  });
  test('changed time reschedules (old identifier is cancelled first by the caller)', () => {
    expect(resolveReminderAction(stored, { name: 'Drink water', reminderEnabled: true, reminderTime: '10:00' })).toBe('schedule');
  });
  test('renamed habit reschedules so the notification title stays correct', () => {
    expect(resolveReminderAction(stored, { name: 'Drink more water', reminderEnabled: true, reminderTime: '09:00' })).toBe('schedule');
  });
  test('disabled reminder cancels the stored notification', () => {
    expect(resolveReminderAction(stored, { name: 'Drink water', reminderEnabled: false, reminderTime: null })).toBe('cancel');
  });
  test('no stored identifier and no reminder is a no-op', () => {
    expect(resolveReminderAction(null, { name: 'New habit', reminderEnabled: false, reminderTime: null })).toBe('none');
  });
  test('brand-new habit with a reminder schedules', () => {
    expect(resolveReminderAction(null, { name: 'New habit', reminderEnabled: true, reminderTime: '08:00' })).toBe('schedule');
  });
});
