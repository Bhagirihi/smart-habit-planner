import React, { useEffect, useMemo, useState } from 'react';
import { BackHandler, Pressable, StyleSheet, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { StoreProvider, useStore } from './src/store';
import { resolveBackAction, resolveEffectiveRoute, TAB_ROUTES, type Nav, type Route, type TabName } from './src/navigation';
import { c, radius, spacing, type } from './src/theme';
import Splash from './src/screens/Splash';
import OnboardingWelcome from './src/screens/OnboardingWelcome';
import OnboardingGoal from './src/screens/OnboardingGoal';
import OnboardingStarter from './src/screens/OnboardingStarter';
import Today from './src/screens/Today';
import HabitDetail from './src/screens/HabitDetail';
import HabitForm from './src/screens/HabitForm';
import Routines from './src/screens/Routines';
import RoutineDetail from './src/screens/RoutineDetail';
import RoutineForm from './src/screens/RoutineForm';
import Progress from './src/screens/Progress';
import { Paywall } from './src/screens/Paywall';
import WeeklyReport from './src/screens/WeeklyReport';
import HabitsGrid from './src/screens/HabitsGrid';
import { Settings } from './src/screens/Settings';
import { HelpScreen, PrivacyScreen, TermsScreen } from './src/screens/Legal';

const TABS: { key: TabName; label: string }[] = [
  { key: 'today', label: 'Today' }, { key: 'routines', label: 'Routines' },
  { key: 'progress', label: 'Progress' }, { key: 'settings', label: 'Settings' },
];

function Shell() {
  const { ready, prefs } = useStore();
  const [stack, setStack] = useState<Route[]>([{ name: 'splash' }]);
  const [showSheet, setShowSheet] = useState(false);
  // Paywall is an OVERLAY, not a stack screen: opening it must not unmount
  // the form underneath, so a new habit/routine draft survives open + close
  // with its input intact. The stack below is left untouched while open.
  const [paywallOpen, setPaywallOpen] = useState(false);
  const route = stack[stack.length - 1] ?? { name: 'splash' as const };
  const nav: Nav = useMemo(() => ({
    route,
    push: (r) => setStack((s) => [...s, r]),
    back: () => setStack((s) => (s.length > 1 ? s.slice(0, -1) : s)),
    goTab: (t) => setStack([TAB_ROUTES[t]]),
    openPaywall: () => setPaywallOpen(true),
    closePaywall: () => setPaywallOpen(false),
  }), [route]);
  // Android hardware back: sheet first, then paywall overlay, then stack pop;
  // only at a root tab screen does the event fall through and exit the app.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      const action = resolveBackAction({ sheetOpen: showSheet, paywallOpen, stackDepth: stack.length });
      if (action === 'close-sheet') setShowSheet(false);
      else if (action === 'close-paywall') setPaywallOpen(false);
      else if (action === 'pop') setStack((s) => (s.length > 1 ? s.slice(0, -1) : s));
      else return false;
      return true;
    });
    return () => sub.remove();
  }, [showSheet, paywallOpen, stack.length]);
  const currentTab: TabName | null =
    route.name === 'today' ? 'today' : route.name === 'routines' ? 'routines' : route.name === 'progress' ? 'progress' : route.name === 'settings' ? 'settings' : null;
  // Decide the effective screen via the tested helper in navigation.ts.
  // Returning users must never stay on splash after loading: splash resolves
  // to Today once ready, fresh users resolve to Welcome.
  const effective: Route = resolveEffectiveRoute(ready, prefs.onboardingComplete, route);
  const screenNav: Nav = { ...nav, route: effective };
  const renderScreen = (r: Route) => {
    switch (r.name) {
      case 'splash': return <Splash nav={screenNav} />;
      case 'welcome': return <OnboardingWelcome nav={screenNav} />;
      case 'goal': return <OnboardingGoal nav={screenNav} />;
      case 'starter': return <OnboardingStarter nav={screenNav} />;
      case 'today': return <Today nav={screenNav} />;
      case 'habitDetail': return <HabitDetail nav={screenNav} />;
      case 'habitForm': return <HabitForm nav={screenNav} />;
      case 'habitsGrid': return <HabitsGrid nav={screenNav} />;
      case 'routines': return <Routines nav={screenNav} />;
      case 'routineDetail': return <RoutineDetail nav={screenNav} />;
      case 'routineForm': return <RoutineForm nav={screenNav} />;
      case 'progress': return <Progress nav={screenNav} />;
      case 'paywall': return <Paywall nav={screenNav} />;
      case 'weeklyReport': return <WeeklyReport nav={screenNav} />;
      case 'settings': return <Settings nav={screenNav} />;
      case 'terms': return <TermsScreen nav={screenNav} />;
      case 'privacy': return <PrivacyScreen nav={screenNav} />;
      case 'help': return <HelpScreen nav={screenNav} />;
      default: return <Today nav={screenNav} />;
    }
  };
  const showTabs = currentTab !== null && prefs.onboardingComplete;
  return (
    <SafeAreaView style={s.wrap} edges={['top', 'bottom']}>
      <StatusBar style="light" />
      <View style={s.content}>{renderScreen(effective)}</View>
      {showTabs ? (
        <View style={s.tabBar}>
          {TABS.slice(0, 2).map((t) => (
            <Pressable key={t.key} style={[s.tab, currentTab === t.key && s.tabActive]} onPress={() => nav.goTab(t.key)} accessibilityRole="button">
              <Text style={[s.tabLabel, currentTab === t.key && s.tabLabelActive]}>{t.label}</Text>
            </Pressable>
          ))}
          <Pressable
            style={s.plus} accessibilityRole="button" accessibilityLabel="Add habit or routine"
            onPress={() => { void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowSheet(true); }}
          >
            <Text style={s.plusText}>+</Text>
          </Pressable>
          {TABS.slice(2).map((t) => (
            <Pressable key={t.key} style={[s.tab, currentTab === t.key && s.tabActive]} onPress={() => nav.goTab(t.key)} accessibilityRole="button">
              <Text style={[s.tabLabel, currentTab === t.key && s.tabLabelActive]}>{t.label}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
      {showSheet ? (
        <View style={s.sheetBackdrop}>
          <View style={s.sheet}>
            <Pressable style={s.sheetBtn} onPress={() => { setShowSheet(false); nav.push({ name: 'habitForm' }); }}><Text style={s.sheetText}>Add habit</Text></Pressable>
            <Pressable style={s.sheetBtn} onPress={() => { setShowSheet(false); nav.push({ name: 'routineForm' }); }}><Text style={s.sheetText}>Add routine</Text></Pressable>
            <Pressable style={s.sheetBtn} onPress={() => setShowSheet(false)}><Text style={[s.sheetText, { color: c.muted }]}>Cancel</Text></Pressable>
          </View>
        </View>
      ) : null}
      {paywallOpen ? (
        <View style={s.paywallOverlay}>
          <Paywall nav={screenNav} />
        </View>
      ) : null}
    </SafeAreaView>
  );
}
export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StoreProvider><Shell /></StoreProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: c.bg },
  content: { flex: 1 },
  tabBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: c.bg, borderTopWidth: 1, borderTopColor: c.border, paddingHorizontal: spacing.sm, paddingVertical: spacing.sm, gap: 4 },
  tab: { flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: radius.md },
  tabActive: { backgroundColor: c.surfaceAlt },
  tabLabel: { fontSize: type.small, fontWeight: '500', color: c.muted },
  tabLabelActive: { color: c.primary },
  plus: { width: 56, height: 56, borderRadius: radius.lg, backgroundColor: c.primary, alignItems: 'center', justifyContent: 'center', marginHorizontal: 4 },
  plusText: { fontSize: 28, fontWeight: '600', color: c.onPrimary },
  sheetBackdrop: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end', padding: spacing.lg },
  sheet: { backgroundColor: c.surface, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.sm },
  sheetBtn: { minHeight: 48, justifyContent: 'center' },
  sheetText: { fontSize: type.label, fontWeight: '600', color: c.ink },
  paywallOverlay: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: c.bg },
});
