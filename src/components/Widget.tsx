import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { c, radius, spacing, type } from '../theme';
import { HABITS, last7Cell, last7Color } from '../data';
import type { UiState } from '../navigation';

// Compact 7-day grid shared by the Today widget card and the preview.
// Days 0-5: static history. Day 6 (today): session done-set.
export function HabitGrid7({ done }: { done: Set<string> }) {
  return (
    <View>
      {HABITS.map((h) => (
        <View key={h.id} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
          <Text style={{ color: c.ink, fontSize: type.small, width: 110 }} numberOfLines={1}>{h.icon} {h.name}</Text>
          <View style={{ flexDirection: 'row', flex: 1, justifyContent: 'space-between' }}>
            {Array.from({ length: 7 }, (_, i) => {
              const state = i === 6 ? (done.has(h.id) ? 'done' : 'faint') : last7Cell(h.id, i);
              return <View key={i} style={{ width: 14, height: 14, borderRadius: 3, backgroundColor: last7Color(state, h.color), borderWidth: i === 6 ? 1 : 0, borderColor: h.color }} />;
            })}
          </View>
        </View>
      ))}
      <View style={{ flexDirection: 'row', marginTop: 4 }}>
        <Text style={{ color: c.muted, fontSize: type.caption }}>■ Done  </Text>
        <Text style={{ color: c.muted, fontSize: type.caption }}>■ Partial  </Text>
        <Text style={{ color: c.muted, fontSize: type.caption }}>■ Missed  </Text>
        <Text style={{ color: c.muted, fontSize: type.caption }}>■ Future / unscheduled</Text>
      </View>
    </View>
  );
}

export function WidgetCard({ ui, onPress }: { ui: UiState; onPress: () => void }) {
  const doneCount = HABITS.filter((h) => ui.done.has(h.id)).length;
  const pct = Math.round((doneCount / HABITS.length) * 100);
  return (
    <Pressable onPress={onPress} style={{ backgroundColor: c.surface, borderColor: c.primary, borderWidth: 1, borderRadius: radius.xl, padding: spacing.lg, marginBottom: spacing.md, shadowColor: c.primary, shadowOpacity: 0.3, shadowRadius: 12, elevation: 3 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ color: c.ink, fontWeight: '800', fontSize: type.subtitle }}>📱 Dashboard widget</Text>
        <Text style={{ color: c.primary, fontWeight: '700' }}>{doneCount} of {HABITS.length} · {pct}% ›</Text>
      </View>
      <Text style={{ color: c.muted, fontSize: type.small, marginTop: 4, marginBottom: spacing.md }}>Today's completion + habit grid. Tap to preview the home widget.</Text>
      <HabitGrid7 done={ui.done} />
    </Pressable>
  );
}
