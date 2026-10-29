import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { StoreProvider, useStore } from './store';
import { colors, type } from './theme';
import type { Nav, Route, Tab } from './navigation';
import Splash from './screens/Splash';
import Onboarding from './screens/Onboarding';
import Today from './screens/Today';
import HabitDetail from './screens/HabitDetail';
import HabitForm from './screens/HabitForm';
import { RoutineDetail, RoutineForm, RoutinesList } from './screens/Routines';
import Progress from './screens/Progress';
import WeeklyReport from './screens/WeeklyReport';
import Paywall from './screens/Paywall';
import Settings from './screens/Settings';
import { Card } from './components/ui';

const TAB_LABELS: { key: Tab; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'routines', label: 'Routines' },
  { key: 'progress', label: 'Progress' },
  { key: 'settings', label: 'Settings' },
];

function routeTitle(r: Route): string {
  switch (r.name) {
    case 'today': return 'Today';
    case 'habitDetail': return 'Habit';
    case 'habitForm': return r.habitId ? 'Edit Habit' : 'New Habit';
    case 'routineDetail': return 'Routine';
    case 'routineForm': return r.routineId ? 'Edit Routine' : 'New Routine';
    case 'weeklyReport': return 'Weekly Report';
    case 'paywall': return 'Premium';
  }
}

function Shell(): React.JSX.Element {
  const { loaded, state } = useStore();
  const [tab, setTab] = useState<Tab>('today');
  const [stack, setStack] = useState<Route[]>([]);
  const [plusOpen, setPlusOpen] = useState(false);

  const nav: Nav = {
    tab,
    goTab: (t) => {
      setTab(t);
      setStack([]);
      setPlusOpen(false);
    },
    push: (r) => setStack((s) => [...s, r]),
    pop: () => setStack((s) => (s.length > 0 ? s.slice(0, -1) : s)),
    openPaywall: () => setStack((s) => [...s, { name: 'paywall' }]),
  };

  if (!loaded) return <Splash />;

  if (!state.onboarded) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom', 'left', 'right']}>
        <Onboarding />
      </SafeAreaView>
    );
  }

  const top = stack[stack.length - 1];
  const inStack = Boolean(top);

  function renderRoute(r: Route): React.JSX.Element {
    switch (r.name) {
      case 'habitDetail': return <HabitDetail nav={nav} habitId={r.habitId} />;
      case 'habitForm': return <HabitForm nav={nav} habitId={r.habitId} />;
      case 'routineDetail': return <RoutineDetail nav={nav} routineId={r.routineId} />;
      case 'routineForm': return <RoutineForm nav={nav} routineId={r.routineId} />;
      case 'weeklyReport': return <WeeklyReport nav={nav} />;
      case 'paywall': return <Paywall nav={nav} />;
      case 'today': return <Today nav={nav} />;
    }
  }

  function renderTab(): React.JSX.Element {
    switch (tab) {
      case 'today': return <Today nav={nav} />;
      case 'routines': return <RoutinesList nav={nav} />;
      case 'progress': return <Progress nav={nav} />;
      case 'settings': return <Settings nav={nav} />;
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom', 'left', 'right']}>
      {inStack && top ? (
        <View style={styles.header}>
          <Pressable onPress={nav.pop} style={styles.back} hitSlop={8} accessibilityRole="button">
            <Text style={styles.backText}>‹ Back</Text>
          </Pressable>
          <Text style={styles.headerTitle}>{routeTitle(top)}</Text>
          <View style={styles.back} />
        </View>
      ) : null}
      <View style={styles.content}>{inStack && top ? renderRoute(top) : renderTab()}</View>

      {plusOpen ? (
        <View style={styles.plusMenu}>
          <Card>
            <Text style={styles.plusTitle}>Add something new</Text>
            <Pressable style={styles.plusItem} onPress={() => { setPlusOpen(false); nav.push({ name: 'habitForm' }); }}>
              <Text style={styles.plusItemText}>+ New habit</Text>
            </Pressable>
            <Pressable style={styles.plusItem} onPress={() => { setPlusOpen(false); nav.push({ name: 'routineForm' }); }}>
              <Text style={styles.plusItemText}>+ New routine</Text>
            </Pressable>
            <Pressable style={styles.plusItem} onPress={() => setPlusOpen(false)}>
              <Text style={styles.plusItemText}>Cancel</Text>
            </Pressable>
          </Card>
        </View>
      ) : null}

      {!inStack ? (
        <View style={styles.tabBar}>
          {TAB_LABELS.slice(0, 2).map((t) => (
            <TabButton key={t.key} label={t.label} active={tab === t.key} onPress={() => nav.goTab(t.key)} />
          ))}
          <Pressable onPress={() => setPlusOpen((v) => !v)} style={styles.plusButton} accessibilityRole="button" accessibilityLabel="Add habit or routine">
            <Text style={styles.plusText}>+</Text>
          </Pressable>
          {TAB_LABELS.slice(2).map((t) => (
            <TabButton key={t.key} label={t.label} active={tab === t.key} onPress={() => nav.goTab(t.key)} />
          ))}
        </View>
      ) : null}
    </SafeAreaView>
  );
}

function TabButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }): React.JSX.Element {
  return (
    <Pressable onPress={onPress} style={styles.tabButton} accessibilityRole="button" accessibilityState={{ selected: active }}>
      <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{label}</Text>
    </Pressable>
  );
}

export default function App(): React.JSX.Element {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <StoreProvider>
        <Shell />
      </StoreProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10, backgroundColor: colors.bg },
  back: { minWidth: 64, minHeight: 44, justifyContent: 'center' },
  backText: { fontSize: type.body, color: colors.primary, fontWeight: '700' },
  headerTitle: { fontSize: type.subtitle, fontWeight: '800', color: colors.ink },
  content: { flex: 1 },
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  tabButton: { flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  tabLabel: { fontSize: type.small, color: colors.muted, fontWeight: '600' },
  tabLabelActive: { color: colors.primary, fontWeight: '800' },
  plusButton: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginHorizontal: 4, elevation: 3, shadowColor: '#111827', shadowOpacity: 0.2, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
  plusText: { fontSize: 30, color: '#fff', fontWeight: '800', lineHeight: 32 },
  plusMenu: { position: 'absolute', left: 16, right: 16, bottom: 92 },
  plusTitle: { fontSize: type.subtitle, fontWeight: '700', color: colors.ink, marginBottom: 8 },
  plusItem: { minHeight: 48, justifyContent: 'center', borderTopWidth: 1, borderTopColor: colors.border },
  plusItemText: { fontSize: type.body, color: colors.ink, fontWeight: '600' },
});
