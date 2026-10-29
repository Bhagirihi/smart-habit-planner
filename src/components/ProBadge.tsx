import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

/**
 * Small orange PRO pill, used on Premium rows and locked gates.
 * It is a label only — it never unlocks anything by itself.
 */
export default function ProBadge(): React.JSX.Element {
  return (
    <View style={styles.pill}>
      <Text style={styles.text}>PRO</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    backgroundColor: '#FB923C',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  text: { color: '#0A0A0A', fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
});
