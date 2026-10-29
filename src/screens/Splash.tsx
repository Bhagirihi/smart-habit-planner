import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { type } from '../theme';
import { useTheme } from '../useTheme';

export default function Splash(): React.JSX.Element {
  const c = useTheme();
  return (
    <LinearGradient colors={[...c.gradient]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.wrap}>
      <View style={styles.mark}>
        <Text style={styles.markText}>✓</Text>
      </View>
      <Text style={styles.title}>Smart Habit Planner</Text>
      <Text style={styles.sub}>Small habits. Long streaks.</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  mark: { width: 84, height: 84, borderRadius: 42, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  markText: { fontSize: 44, fontWeight: '800', color: '#0F766E' },
  title: { fontSize: type.title, fontWeight: '800', color: '#fff', textAlign: 'center' },
  sub: { fontSize: type.body, color: '#E6F4F1', textAlign: 'center' },
});
