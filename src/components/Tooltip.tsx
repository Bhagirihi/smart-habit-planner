import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { c, radius, spacing, type } from '../theme';
import type { TourRect, TourTarget } from '../navigation';
import { Btn } from './ui';

// Anchored tooltip-guided tour. Hand-rolled, no external tooltip library.
//
// COORDINATE CONTRACT (review fix — why the previous inset fix did not
// replicate on device):
//   - measureInWindow returns WINDOW coordinates (origin = top-left of the
//     whole screen, including the status bar / notch area).
//   - This overlay lives INSIDE the root <View flex:1> in App.tsx (which
//     itself lives inside SafeAreaView, so it still cannot go under a
//     system bar). App.tsx therefore converts every measured rect by
//     subtracting the ROOT view's own measured window rect:
//         rootRect = { x: windowRect.x - rootWindowRect.x,
//                      y: windowRect.y - rootWindowRect.y, width, height }
//     The root rect is MEASURED, never assumed from insets — so the frame
//     lands on the element regardless of how a given Android device's
//     SafeAreaView implements absolute-child positioning, status-bar
//     height, or notch. The inset conversion is kept only as a fallback
//     if the root view cannot be measured.
//   - This component receives safeWidth/safeHeight (= root size) as props
//     and never calls Dimensions itself, and NEVER assumes a status-bar
//     height, notch size, or navigation-bar height.
//   - Every frame and bubble is clamped to [0, safeWidth] x [0, safeHeight],
//     so nothing can go under the status bar, notch, or system nav bar.
//
// How it works: each step may name a TourTarget. Screens register a
// measurer for their targets (a ref + measureInWindow); App.tsx calls that
// measurer when the step changes and passes the resulting SAFE-AREA rect
// here. This component then renders a SPOTLIGHT, not a bottom sheet:
//   - four dim panels around the target rect (the target area itself is
//     left uncovered, so the user can still tap the highlighted element),
//   - an emerald frame around the target rect,
//   - a tooltip bubble placed at the top of the safe area when the target
//     is in the lower half, or at the bottom when it is in the upper half,
//     with a small ▲/▼ arrow pointing toward the target's centre.
// If a step has no target, or its target is not mounted / off-screen /
// unmeasurable, this falls back to the old behaviour: a full-screen dim
// plus a bottom bubble. It never crashes and never points at nothing.

// Shared measurer factory for screens: given a ref, return a function
// App can call to get that element's window rect (or null if unmounted).
export function tourMeasure(ref: React.RefObject<any>): import('../navigation').TourMeasure {
  return () => new Promise((resolve) => {
    const node = ref.current;
    if (!node) return resolve(null);
    node.measureInWindow((x: number, y: number, width: number, height: number) =>
      resolve(width > 0 ? { x, y, width, height } : null));
  });
}

export type TourDestination =
  | 'today'
  | 'routines'
  | 'progress'
  | 'settings'
  | 'weeklyReport'
  | 'habitsGrid'
  | 'paymentSetup';

export interface TourStep {
  title: string;
  body: string;
  target?: TourTarget;
  goToLabel?: string;
  goTo?: TourDestination;
}

export const TOUR_STEPS: TourStep[] = [
  {
    title: 'Your Today ring — here',
    body: 'This ring shows how many of today\'s scheduled habits you have done, like 3 of 6. It only counts habits scheduled for today.',
    target: 'today-ring',
    goToLabel: 'Go to Today',
    goTo: 'today',
  },
  {
    title: 'Free tier — this pill',
    body: 'This pill shows your free tier: 5 habits, 1 routine, and 12 days left in this preview. It is a static demo value, not a real subscription.',
    target: 'today-free-tier',
    goToLabel: 'Go to Today',
    goTo: 'today',
  },
  {
    title: 'Help — this ? button',
    body: 'Tap this ? anytime to replay this tour. You can also replay it from Settings → How to use this app.',
    target: 'today-help',
    goToLabel: 'Go to Today',
    goTo: 'today',
  },
  {
    title: 'A habit row — tap here',
    body: 'Tap a habit row like this one to see its detail and streak. You can still tap the highlighted row while this tour is open.',
    target: 'today-first-habit',
    goToLabel: 'Go to Today',
    goTo: 'today',
  },
  {
    title: 'Check it off — this button',
    body: 'Tap this ✓ / ○ button to check a habit off for this session, or to undo it. Reloading resets it in this preview.',
    target: 'today-first-check',
    goToLabel: 'Go to Today',
    goTo: 'today',
  },
  {
    title: 'The + button — here',
    body: 'Tap + at the bottom to add something new. Choose Add habit for a single habit, or Create routine for a set of steps.',
    target: 'tab-plus',
  },
  {
    title: 'Bottom tabs — here',
    body: 'These tabs are always at the bottom: Today, Routines, Progress, and Settings, with + in the middle. The highlighted tab is Today.',
    target: 'tab-today',
  },
  {
    title: 'Routines — this card',
    body: 'A routine is a list of habits done in order, with a start time. Open a routine to see its steps, then Run Mode walks you through them with Next and Restart.',
    target: 'routines-first',
    goToLabel: 'Go to Routines',
    goTo: 'routines',
  },
  {
    title: 'Progress — this score card',
    body: 'Progress shows your Habit Score and per-habit rates. Switch between This Week and This Month, and read the heatmaps to spot strong and weak days.',
    target: 'progress-score',
    goToLabel: 'Go to Progress',
    goTo: 'progress',
  },
  {
    title: 'Weekly Report — this suggestion',
    body: 'Each week you get totals, your best day, and your lowest habit. Tap Apply on a suggestion to accept it, or Dismiss to ignore it.',
    target: 'report-first',
    goToLabel: 'Go to Weekly Report',
    goTo: 'weeklyReport',
  },
  {
    title: 'Habits Grid — this card',
    body: 'The grid shows every habit as a card with a heatmap. A filled cell means done, a faint cell means not done or unscheduled. Tap a card for detail.',
    target: 'grid-first',
    goToLabel: 'Go to Habits Grid',
    goTo: 'habitsGrid',
  },
  {
    title: 'Payment — this Skip button',
    body: 'Payment Setup is optional and has a Skip button. Plan cards show names only, with no prices, and nothing here charges you.',
    target: 'payment-skip',
    goToLabel: 'Go to Payment Setup',
    goTo: 'paymentSetup',
  },
  {
    title: 'Settings — this row',
    body: 'Settings holds your account, notifications, and evening review. It also has Help, Terms, Privacy, and the Home widget preview. This row replays the tour.',
    target: 'settings-tour',
    goToLabel: 'Go to Settings',
    goTo: 'settings',
  },
  {
    title: "You're ready",
    body: 'That is the whole app. This tour opened automatically the first time you reached Today in this session. Reloading resets it — replay anytime from Settings or the ? on Today.',
  },
];

interface TourTooltipProps {
  stepIndex: number;
  // Rect in SAFE-AREA coordinates (see contract above), or null for fallback.
  targetRect: TourRect | null;
  // Safe-area size: screen size minus live insets. The overlay, frame, and
  // bubble are all clamped to this, never to the full window.
  safeWidth: number;
  safeHeight: number;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
  onClose: () => void;
  onGoTo: (destination: TourDestination) => void;
}

function Bubble({ step, stepIndex, anchored, onNext, onBack, onSkip, onClose, onGoTo }: {
  step: TourStep; stepIndex: number; anchored: boolean;
  onNext: () => void; onBack: () => void; onSkip: () => void; onClose: () => void; onGoTo: (d: TourDestination) => void;
}) {
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === TOUR_STEPS.length - 1;
  return (
    <View style={{ backgroundColor: c.surface, borderColor: c.primary, borderWidth: 1, borderRadius: 24, padding: spacing.xl, shadowColor: c.primary, shadowOpacity: 0.3, shadowRadius: 12, elevation: 4 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ color: c.ink, fontWeight: '800', fontSize: type.subtitle, flex: 1 }}>{step.title}</Text>
        <Pressable onPress={onClose} style={{ width: 48, height: 48, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: c.muted, fontSize: 22, fontWeight: '700' }}>✕</Text>
        </Pressable>
      </View>
      <Text style={{ color: c.muted, fontSize: type.body, marginTop: spacing.sm }}>{step.body}</Text>
      {!anchored && step.target && (
        <Text style={{ color: c.amber, fontSize: type.small, marginTop: spacing.sm }}>That item is not on this screen right now — use its “Go to …” button, then step back here to see it highlighted.</Text>
      )}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: spacing.md }}>
        {TOUR_STEPS.map((_, i) => (
          <View key={i} style={{ width: i === stepIndex ? 16 : 8, height: 8, borderRadius: 4, backgroundColor: i === stepIndex ? c.primary : c.surfaceAlt, borderColor: c.border, borderWidth: 1, marginRight: 4 }} />
        ))}
        <Text style={{ color: c.muted, fontSize: type.small, marginLeft: spacing.sm }}>Step {stepIndex + 1} of {TOUR_STEPS.length}</Text>
      </View>
      {step.goTo && step.goToLabel && (
        <Btn label={step.goToLabel} ghost onPress={() => onGoTo(step.goTo!)} />
      )}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Pressable onPress={onBack} disabled={isFirst} style={{ minHeight: 48, minWidth: 72, justifyContent: 'center', opacity: isFirst ? 0.4 : 1 }}>
          <Text style={{ color: c.primary, fontWeight: '700' }}>‹ Back</Text>
        </Pressable>
        <Pressable onPress={onSkip} style={{ minHeight: 48, minWidth: 72, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: c.muted, fontWeight: '700' }}>Skip</Text>
        </Pressable>
        <Pressable onPress={onNext} style={{ minHeight: 48, minWidth: 96, alignItems: 'center', justifyContent: 'center', backgroundColor: c.primary, borderRadius: radius.lg, paddingHorizontal: spacing.lg }}>
          <Text style={{ color: c.onPrimary, fontWeight: '800' }}>{isLast ? 'Done ✓' : 'Next ›'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

export function TourTooltip({ stepIndex, targetRect, safeWidth, safeHeight, onNext, onBack, onSkip, onClose, onGoTo }: TourTooltipProps) {
  const step = TOUR_STEPS[stepIndex] ?? TOUR_STEPS[0];
  const bubbleProps = { step, stepIndex, onNext, onBack, onSkip, onClose, onGoTo };
  // Bubble is scrollable inside a max-height box so long text can never
  // overflow the safe area on a small screen or a large-font device.
  const bubbleBox = (anchored: boolean) => (
    <ScrollView style={{ maxHeight: Math.max(200, safeHeight * 0.65) }} showsVerticalScrollIndicator={false}>
      <Bubble {...bubbleProps} anchored={anchored} />
    </ScrollView>
  );

  if (!targetRect) {
    // Fallback: no target, or target not mounted / off-screen / unmeasurable.
    // Positioned inside the safe area (this overlay lives inside
    // SafeAreaView), so the bubble can never sit under the nav bar.
    return (
      <View pointerEvents="box-none" style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}>
        <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)' }} />
        <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: spacing.lg }}>
          {bubbleBox(!step.target)}
        </View>
      </View>
    );
  }

  // Anchored spotlight: dim everything EXCEPT the target rect, frame it,
  // and put the bubble on the opposite half of the safe area with an arrow.
  // W/H are SAFE-AREA sizes, not window sizes. The frame is clamped on all
  // four sides: a rect measured while scrolling, or on a device whose
  // insets changed, can never draw outside the safe area or under a bar.
  const W = safeWidth;
  const H = safeHeight;
  const pad = 6;
  const x = Math.max(0, Math.min(targetRect.x - pad, W - 1));
  const y = Math.max(0, Math.min(targetRect.y - pad, H - 1));
  const w = Math.max(8, Math.min(targetRect.width + pad * 2, W - x));
  const h = Math.max(8, Math.min(targetRect.height + pad * 2, H - y));
  const bubbleAtTop = y + h > H / 2;
  // Arrow points at the centre of the (clamped) frame, clamped to the
  // bubble's horizontal padding so it never leaves the bubble's edge.
  const arrowX = Math.min(Math.max(x + w / 2 - 10, 24), Math.max(24, W - 44 - spacing.lg));
  const dim = 'rgba(0,0,0,0.6)';
  return (
    <View pointerEvents="box-none" style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}>
      {/* Dim panels around the target — the target area itself stays open. */}
      <View style={{ position: 'absolute', left: 0, right: 0, top: 0, height: y, backgroundColor: dim }} />
      <View style={{ position: 'absolute', left: 0, right: 0, top: y + h, bottom: 0, backgroundColor: dim }} />
      <View style={{ position: 'absolute', left: 0, top: y, width: x, height: h, backgroundColor: dim }} />
      <View style={{ position: 'absolute', left: x + w, right: 0, top: y, height: h, backgroundColor: dim }} />
      {/* Emerald frame around the target — exactly the measured element. */}
      <View pointerEvents="none" style={{ position: 'absolute', left: x, top: y, width: w, height: h, borderWidth: 2, borderColor: c.primary, borderRadius: 12 }} />
      {/* Bubble + arrow, on the opposite half from the target, inside safe area. */}
      <View style={{ position: 'absolute', left: spacing.lg, right: spacing.lg, top: bubbleAtTop ? spacing.lg : undefined, bottom: bubbleAtTop ? undefined : spacing.lg }}>
        {!bubbleAtTop && <Text style={{ color: c.primary, fontSize: 18, marginLeft: Math.max(0, arrowX - spacing.lg), marginBottom: -4 }}>▲</Text>}
        {bubbleBox(true)}
        {bubbleAtTop && <Text style={{ color: c.primary, fontSize: 18, marginLeft: Math.max(0, arrowX - spacing.lg), marginTop: -4 }}>▼</Text>}
      </View>
    </View>
  );
}
