import { describe, expect, test } from '@jest/globals';
import { resolveBackAction } from '../src/navigation';

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
