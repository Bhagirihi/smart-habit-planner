import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DraggableFlatList, {
  type DragEndParams,
  type RenderItemParams,
} from 'react-native-draggable-flatlist';
import {
  Card,
  ErrorBanner,
  GhostButton,
  PrimaryButton,
  SecondaryButton,
} from '../components/ui';
import type { Nav } from '../navigation';
import { useStore } from '../store';
import { c, radius, spacing, type } from '../theme';
import { FREE_ROUTINE_LIMIT, type Habit } from '../types';

function isValidTime(value: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

export default function RoutineForm({ nav }: { nav: Nav }) {
  const { ready, loadError, routines, habits, isPremium, addRoutine, updateRoutine, reorderRoutineHabits } =
    useStore();
  const routineId = nav.route.name === 'routineForm' ? nav.route.routineId : undefined;
  const existing = routineId ? routines.find((r) => r.id === routineId) : undefined;
  const isEditing = existing !== undefined;

  const [name, setName] = useState(existing ? existing.name : '');
  const [startTime, setStartTime] = useState(existing ? existing.startTime : '07:00');
  const [selectedIds, setSelectedIds] = useState<string[]>(() => {
    if (!existing) return [];
    // The store already reconciles habitIds when a habit is deleted elsewhere,
    // so only keep ids that still resolve to a habit.
    return existing.habitIds.filter((id) => habits.some((h) => h.id === id));
  });
  const [filter, setFilter] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const selected: Habit[] = selectedIds
    .map((id) => habits.find((h) => h.id === id))
    .filter((h): h is Habit => h !== undefined);
  const query = filter.trim().toLowerCase();
  const available = habits.filter(
    (h) => query === '' || h.name.toLowerCase().includes(query),
  );

  function toggleSelect(id: string): void {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function move(id: string, direction: -1 | 1): void {
    setSelectedIds((prev) => {
      const index = prev.indexOf(id);
      const next = index + direction;
      if (index < 0 || next < 0 || next >= prev.length) return prev;
      const copy = [...prev];
      const [item] = copy.splice(index, 1);
      copy.splice(next, 0, item);
      return copy;
    });
  }

  function handleDragEnd({ data }: DragEndParams<Habit>): void {
    const ids = data.map((h) => h.id);
    setSelectedIds(ids);
    // Persist immediately when editing so the order survives leaving the form;
    // a fresh Save also persists the same order via updateRoutine.
    if (existing) reorderRoutineHabits(existing.id, ids);
  }

  function renderSelectedItem({ item, drag, isActive }: RenderItemParams<Habit>): React.ReactElement {
    const index = selectedIds.indexOf(item.id);
    return (
      <Pressable
        onLongPress={drag}
        style={[s.selectedRow, isActive && s.selectedRowActive]}
        accessibilityRole="button"
        accessibilityLabel={`Reorder ${item.name}, long press to drag`}
      >
        <Text style={s.dragHandle}>☰</Text>
        <View style={s.selectedText}>
          <Text style={s.rowName}>
            {item.icon} {item.name}
          </Text>
          <Text style={s.meta}>Position {index + 1}</Text>
        </View>
        <Pressable style={s.miniBtn} onPress={() => move(item.id, -1)} accessibilityRole="button">
          <Text style={s.miniBtnText}>↑</Text>
        </Pressable>
        <Pressable style={s.miniBtn} onPress={() => move(item.id, 1)} accessibilityRole="button">
          <Text style={s.miniBtnText}>↓</Text>
        </Pressable>
        <Pressable
          style={s.miniBtn}
          onPress={() => setSelectedIds((prev) => prev.filter((x) => x !== item.id))}
          accessibilityRole="button"
        >
          <Text style={[s.miniBtnText, { color: c.error }]}>Remove</Text>
        </Pressable>
      </Pressable>
    );
  }

  function handleSave(): void {
    setError(null);
    setSuccess(null);
    if (name.trim() === '') {
      setError('Give the routine a name.');
      return;
    }
    if (!isValidTime(startTime.trim())) {
      setError('Enter a start time as HH:MM, for example 07:00.');
      return;
    }
    if (!isEditing && !isPremium && routines.length >= FREE_ROUTINE_LIMIT) {
      // Keep local state untouched: do not clear the form, just open the paywall.
      nav.openPaywall(nav.route);
      return;
    }
    if (isEditing && existing) {
      updateRoutine({ ...existing, name: name.trim(), startTime: startTime.trim(), habitIds: selectedIds });
      setSuccess('Routine saved.');
      nav.back();
      return;
    }
    const result = addRoutine({ name: name.trim(), startTime: startTime.trim(), habitIds: selectedIds });
    if (!result.ok) {
      setError(result.message ?? 'Could not save the routine.');
      return;
    }
    setSuccess('Routine saved.');
    nav.back();
  }

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.content}>
        <Text style={s.title}>{isEditing ? 'Edit routine' : 'New routine'}</Text>
        <ErrorBanner message={loadError} />
        <ErrorBanner message={error} />
        {success ? (
          <Card>
            <Text style={s.successText}>{success}</Text>
          </Card>
        ) : null}
        {!ready ? (
          <Card>
            <Text style={s.body}>Loading…</Text>
          </Card>
        ) : (
          <>
            <Text style={s.label}>Name</Text>
            <TextInput
              style={s.input}
              value={name}
              onChangeText={setName}
              placeholder="Morning flow"
              placeholderTextColor={c.muted}
              accessibilityLabel="Routine name"
            />
            <Text style={s.label}>Start time (HH:MM)</Text>
            <TextInput
              style={s.input}
              value={startTime}
              onChangeText={setStartTime}
              placeholder="07:00"
              placeholderTextColor={c.muted}
              keyboardType="numbers-and-punctuation"
              maxLength={5}
              accessibilityLabel="Routine start time"
            />
            <Text style={s.label}>Selected habits ({selected.length})</Text>
            {selected.length === 0 ? (
              <Card>
                <Text style={s.body}>No habits selected yet. Choose habits below.</Text>
              </Card>
            ) : (
              <DraggableFlatList
                data={selected}
                keyExtractor={(h: Habit) => h.id}
                renderItem={renderSelectedItem}
                onDragEnd={handleDragEnd}
                scrollEnabled={false}
                activationDistance={8}
              />
            )}
            <Text style={s.hint}>
              Long press the handle to drag and reorder, or use the up and down buttons.
            </Text>
            <Text style={s.label}>Add habits</Text>
            <TextInput
              style={s.input}
              value={filter}
              onChangeText={setFilter}
              placeholder="Search habits by name"
              placeholderTextColor={c.muted}
              accessibilityLabel="Search habits"
            />
            {available.length === 0 ? (
              <Card>
                <Text style={s.body}>
                  {habits.length === 0
                    ? 'No habits yet. Create a habit first, then come back here.'
                    : 'No habits match that search.'}
                </Text>
              </Card>
            ) : (
              available.map((h) => {
                const isSelected = selectedIds.includes(h.id);
                return (
                  <Pressable key={h.id} onPress={() => toggleSelect(h.id)} accessibilityRole="button">
                    <Card>
                      <View style={s.availableRow}>
                        <Text style={s.rowName}>
                          {h.icon} {h.name}
                        </Text>
                        <Text style={isSelected ? s.selectedMark : s.meta}>
                          {isSelected ? 'Selected ✓' : 'Tap to add'}
                        </Text>
                      </View>
                    </Card>
                  </Pressable>
                );
              })
            )}
            <SecondaryButton label="Add habit" onPress={() => nav.push({ name: 'habitForm' })} />
            <PrimaryButton label="Save routine" onPress={handleSave} />
            <GhostButton label="Cancel" onPress={() => nav.back()} />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: c.bg },
  content: { padding: spacing.lg, gap: spacing.sm },
  title: { fontSize: type.title, fontWeight: '600', color: c.ink, marginBottom: spacing.sm },
  label: { fontSize: type.label, fontWeight: '600', color: c.ink, marginTop: spacing.sm },
  input: {
    minHeight: 48,
    borderRadius: radius.md,
    backgroundColor: c.surfaceAlt,
    borderWidth: 1,
    borderColor: c.border,
    color: c.ink,
    fontSize: type.body,
    paddingHorizontal: spacing.md,
  },
  body: { fontSize: type.body, color: c.muted, lineHeight: 20 },
  hint: { fontSize: type.small, color: c.muted, lineHeight: 18 },
  meta: { fontSize: type.body, color: c.muted },
  successText: { fontSize: type.body, fontWeight: '600', color: c.accent },
  selectedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: c.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  selectedRowActive: { backgroundColor: c.surfaceTonal },
  dragHandle: { fontSize: 20, color: c.muted, minWidth: 48, textAlign: 'center' },
  selectedText: { flex: 1, gap: 2 },
  rowName: { fontSize: type.label, fontWeight: '600', color: c.ink },
  availableRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  selectedMark: { fontSize: type.body, fontWeight: '600', color: c.accent },
  miniBtn: {
    minHeight: 48,
    minWidth: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  miniBtnText: { fontSize: type.label, fontWeight: '600', color: c.ink },
});
