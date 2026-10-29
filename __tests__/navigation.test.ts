import { describe, expect, test } from '@jest/globals';
import { resolveBackAction, resolveEffectiveRoute } from '../src/navigation';

// Pure state machine for the Android hardware back button (App.tsx).
// Sheet closes first, then the paywall overlay, then the stack pops;
// only a root tab screen lets the event fall through and exit the app.
describe('resolveBackAction', () => {
  test('sheet closes before paywall and stack', () => {
    expect(resolveBackAction({ sheetOpen: true, paywallOpen: true, stackDepth: 3 })).toBe('close-sheet');
  });
  test('paywall overlay closes before a stack pop', () => {
    expect(resolveBackAction({ sheetOpen: false, paywallOpen: true, stackDepth: 3 })).toBe('close-paywall');
  });
  test('stack pops when no overlay is open', () => {
    expect(resolveBackAction({ sheetOpen: false, paywallOpen: false, stackDepth: 3 })).toBe('pop');
  });
  test('root tab screen exits', () => {
    expect(resolveBackAction({ sheetOpen: false, paywallOpen: false, stackDepth: 1 })).toBe('exit');
  });
});

// Splash-stuck regression (Expo Go screenshot, 2026-10-29): the stack starts
// at splash on every launch, so a returning user must not stay there.
describe('resolveEffectiveRoute', () => {
  test('loading stays on splash', () => {
    expect(resolveEffectiveRoute(false, true, { name: 'splash' })).toEqual({ name: 'splash' });
  });
  test('returning user on splash goes to today, not stuck on splash', () => {
    expect(resolveEffectiveRoute(true, true, { name: 'splash' })).toEqual({ name: 'today' });
  });
  test('fresh user on splash goes to welcome', () => {
    expect(resolveEffectiveRoute(true, false, { name: 'splash' })).toEqual({ name: 'welcome' });
  });
  test('onboarding in progress is preserved', () => {
    expect(resolveEffectiveRoute(true, false, { name: 'goal' })).toEqual({ name: 'goal' });
  });
  test('a real tab route is preserved for returning users', () => {
    expect(resolveEffectiveRoute(true, true, { name: 'progress' })).toEqual({ name: 'progress' });
  });
});
