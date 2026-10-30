import React from 'react';
import { Text, View } from 'react-native';
import { c, type } from '../theme';
import { HABITS, last7Cell, last7Color } from '../data';

// Compact 7-day grid used by the home-widget preview screen.
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
