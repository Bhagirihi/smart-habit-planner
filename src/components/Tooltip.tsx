import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { c, radius, spacing, type } from '../theme';
import { Btn } from './ui';

// Reusable tooltip-guided tour. Hand-rolled, no external tooltip library.
// The tour is an overlay bubble anchored to the bottom of the screen (the
// existing sheet/paywall pattern): it dims the screen behind it but never
// blocks navigation permanently — Skip and X are always visible, and each
// step with a destination has a "Go to …" button that navigates there while
// the tour stays open on top. Next/Back only move the bubble; they never
// push a route, so there are no dead-ends and no duplicate stack entries.

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
  goToLabel?: string;
  goTo?: TourDestination;
}

export const TOUR_STEPS: TourStep[] = [
  {
    title: 'Your Today ring',
    body: "The ring shows how many of today's scheduled habits you have done, like 3 of 6. It only counts habits scheduled for today.",
    goToLabel: 'Go to Today',
    goTo: 'today',
  },
  {
    title: 'Checking off a habit',
    body: 'Tap a habit row to see its detail and streak. Tap ✓ to check it off for this session, or ○ to undo it.',
    goToLabel: 'Go to Today',
    goTo: 'today',
  },
  {
    title: 'The + button',
    body: 'Tap + at the bottom to add something new. Choose Add habit for a single habit, or Create routine for a set of steps.',
  },
  {
    title: 'Routines',
    body: 'A routine is a list of habits done in order, with a start time. Open a routine to see its steps, then Run Mode walks you through them with Next and Restart.',
    goToLabel: 'Go to Routines',
    goTo: 'routines',
  },
  {
    title: 'Progress',
    body: 'Progress shows your Habit Score and per-habit rates. Switch between This Week and This Month, and read the heatmaps to spot strong and weak days.',
    goToLabel: 'Go to Progress',
    goTo: 'progress',
  },
  {
    title: 'Weekly Report',
    body: 'Each week you get totals, your best day, and your lowest habit. Tap Apply on a suggestion to accept it, or Dismiss to ignore it.',
    goToLabel: 'Go to Weekly Report',
    goTo: 'weeklyReport',
  },
  {
    title: 'Habits Grid',
    body: 'The grid shows every habit as a row and the last days as coloured cells. A filled cell means done, a faint cell means not done or unscheduled.',
    goToLabel: 'Go to Habits Grid',
    goTo: 'habitsGrid',
  },
  {
    title: 'Free tier and payment',
    body: 'Free tier allows 5 habits and 1 routine, with 12 days left in this preview. Payment Setup is optional and has a Skip button; the Paywall is under Settings → Upgrade.',
    goToLabel: 'Go to Payment Setup',
    goTo: 'paymentSetup',
  },
  {
    title: 'Settings',
    body: 'Settings holds your account, notifications, and evening review. It also has Help, Terms, Privacy, and the Home widget preview.',
    goToLabel: 'Go to Settings',
    goTo: 'settings',
  },
  {
    title: "You're ready",
    body: 'That is the whole app. You can replay this tour anytime from Settings or the ? button on Today.',
  },
];

interface TourTooltipProps {
  stepIndex: number;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
  onClose: () => void;
  onGoTo: (destination: TourDestination) => void;
}

export function TourTooltip({ stepIndex, onNext, onBack, onSkip, onClose, onGoTo }: TourTooltipProps) {
  const step = TOUR_STEPS[stepIndex] ?? TOUR_STEPS[0];
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === TOUR_STEPS.length - 1;
  return (
    <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
      <View style={{ backgroundColor: c.surface, borderColor: c.primary, borderWidth: 1, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.xl, shadowColor: c.primary, shadowOpacity: 0.3, shadowRadius: 12, elevation: 4 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ color: c.ink, fontWeight: '800', fontSize: type.subtitle, flex: 1 }}>{step.title}</Text>
          <Pressable onPress={onClose} style={{ width: 48, height: 48, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: c.muted, fontSize: 22, fontWeight: '700' }}>✕</Text>
          </Pressable>
        </View>
        <Text style={{ color: c.muted, fontSize: type.body, marginTop: spacing.sm }}>{step.body}</Text>
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
    </View>
  );
}
