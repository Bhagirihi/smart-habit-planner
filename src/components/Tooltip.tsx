// Reusable tooltips and the guided tour. No new dependency, no copied
// text: all wording is the app's own. The tour is shown once (see Today);
// the (?) buttons open a one-paragraph tip for that screen only.
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Card, GhostButton, PrimaryButton } from './ui';
import { c, radius, spacing, type } from '../theme';

export function InfoTip({ text, label }: { text: string; label: string }) {
  const [open, setOpen] = useState(false);
  return (
    <View style={s.wrap}>
      <Pressable
        style={s.q}
        onPress={() => setOpen((v) => !v)}
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        <Text style={s.qText}>?</Text>
      </Pressable>
      {open ? (
        <Card>
          <Text style={s.tipText}>{text}</Text>
          <GhostButton label="Got it" onPress={() => setOpen(false)} />
        </Card>
      ) : null}
    </View>
  );
}

export interface TourStep { title: string; body: string }

export function GuidedTour({ steps, visible, onClose }: { steps: TourStep[]; visible: boolean; onClose: () => void }) {
  const [step, setStep] = useState(0);
  useEffect(() => { if (visible) setStep(0); }, [visible]);
  if (!visible || steps.length === 0) return null;
  const current = steps[step] ?? steps[0]!;
  const last = step === steps.length - 1;
  return (
    <View style={s.overlay}>
      <View style={s.sheet}>
        <Text style={s.tourTitle}>{current.title}</Text>
        <Text style={s.tipText}>{current.body}</Text>
        <Text style={s.stepText}>Step {step + 1} of {steps.length}</Text>
        <View style={s.row}>
          {step > 0 ? <GhostButton label="Back" onPress={() => setStep(step - 1)} /> : null}
          <View style={s.flex} />
          <GhostButton label="Skip" onPress={onClose} />
          {last ? (
            <PrimaryButton label="Done" onPress={onClose} />
          ) : (
            <PrimaryButton label="Next" onPress={() => setStep(step + 1)} />
          )}
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { gap: spacing.sm },
  q: { width: 32, height: 32, borderRadius: 16, backgroundColor: c.surfaceTonal, alignItems: 'center', justifyContent: 'center' },
  qText: { fontSize: type.label, fontWeight: '600', color: c.ink },
  tipText: { fontSize: type.body, color: c.ink, lineHeight: 20 },
  overlay: {
    position: 'absolute', left: 0, right: 0, top: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end', padding: spacing.lg,
  },
  sheet: { backgroundColor: c.surface, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.sm },
  tourTitle: { fontSize: type.subtitle, fontWeight: '600', color: c.ink },
  stepText: { fontSize: type.small, color: c.muted },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  flex: { flex: 1 },
});
