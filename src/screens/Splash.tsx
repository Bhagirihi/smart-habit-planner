import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, type } from '../theme';

export default function Splash(): React.JSX.Element {
  return (
    <View style={styles.wrap}>
      <View style={styles.mark}>
        <Text style={styles.markText}>S</Text>
      </View>
      <Text style={styles.title}>Smart Habit Planner</Text>
      <Text style={styles.sub}>Small habits. Long streaks.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  mark: { width: 84, height: 84, borderRadius: 42, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  markText: { fontSize: 44, fontWeight: '800', color: colors.primary },
  title: { fontSize: type.title, fontWeight: '800', color: '#fff', textAlign: 'center' },
  sub: { fontSize: type.body, color: '#D1FAE5', textAlign: 'center' },
});
