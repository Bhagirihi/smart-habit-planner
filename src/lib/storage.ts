import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AppState } from '../types';

export const STORAGE_KEY = '@smart-habit-planner/state/v1';

export const defaultState: AppState = {
  onboarded: false,
  habits: [],
  routines: [],
  checkIns: {},
  settings: {
    goal: '',
    wakeTime: '07:00',
    notificationsEnabled: false,
    eveningReviewTime: '21:00',
    premiumDemo: false,
  },
};

export async function loadState(): Promise<AppState | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<AppState>;
    return { ...defaultState, ...parsed, settings: { ...defaultState.settings, ...(parsed.settings ?? {}) } };
  } catch {
    return null;
  }
}

export async function saveState(state: AppState): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Offline-first: a failed save must not crash the app; next save retries.
  }
}

export async function clearState(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}
