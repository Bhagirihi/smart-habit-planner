// Shared habit icon tile, used everywhere a habit is shown so icons stay
// readable on every habit colour. Tonal background (surfaceTonal), a border
// in the habit colour, and the emoji glyph inside — never a full
// habit-colour tile, which made light glyphs unreadable on bright colours.
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { c, radius } from '../theme';

export function IconTile({ icon, color, size = 44 }: { icon: string; color: string; size?: number }) {
  const glyph = Math.round(size * 0.5);
  return (
    <View style={[s.tile, { width: size, height: size, borderRadius: size >= 48 ? radius.lg : radius.md, borderColor: color }]}>
      <Text style={{ fontSize: glyph }}>{icon}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  tile: { backgroundColor: c.surfaceTonal, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
});
