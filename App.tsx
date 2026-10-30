import React, { useCallback, useEffect, useState } from 'react';
import { BackHandler, Pressable, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { c, spacing, type } from './src/theme';
import type { Suggestion } from './src/theme';
import { INITIAL_DONE, SUGGESTIONS } from './src/data';
import type { Nav, Route, TabName, UiState } from './src/navigation';
import { isTabRoute, TAB_ROUTES } from './src/navigation';
import Splash from './src/screens/Splash';
import { Goal, Starter, Welcome } from './src/screens/Onboarding';
import Today from './src/screens/Today';
import { HabitDetail, HabitForm, HabitsGrid } from './src/screens/HabitScreens';
import { RoutineDetail, RoutineForm, Routines } from './src/screens/RoutineScreens';
import { Progress, WeeklyReport } from './src/screens/ProgressReport';
import { Legal, Settings } from './src/screens/SettingsLegal';
import { Forgot, Login, Signup } from './src/screens/AuthScreens';
import WidgetPreview from './src/screens/WidgetPreview';
import PaymentSetup from './src/screens/PaymentSetup';
import Paywall from './src/components/Paywall';

const TABS: { id: TabName; label: string; icon: string }[] = [
  { id: 'today', label: 'Today', icon: '🏠' },
  { id: 'routines', label: 'Routines', icon: '🗂️' },
  { id: 'progress', label: 'Progress', icon: '📊' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
];

export default function App() {
  const [stack, setStack] = useState<Route[]>([{ name: 'splash' }]);
  const [sheet, setSheet] = useState(false);
  const [paywall, setPaywall] = useState(false);
  const [done, setDone] = useState<Set<string>>(new Set(INITIAL_DONE));
  const [suggestions, setSuggestions] = useState<Suggestion[]>(SUGGESTIONS);
  const [runStep, setRunStep] = useState(0);
  const [tourDismissed, setTourDismissed] = useState(false);
  const [notifEnabled, setNotifEnabled] = useState(true);

  const route = stack[stack.length - 1] ?? { name: 'splash' };
  const push = useCallback((r: Route) => setStack((s) => [...s, r]), []);
  const back = useCallback(() => setStack((s) => (s.length > 1 ? s.slice(0, -1) : s)), []);
  const goTab = useCallback((t: TabName) => setStack([TAB_ROUTES[t]]), []);
  const nav: Nav = {
    route, push, back, goTab,
    openPaywall: () => setPaywall(true),
    closePaywall: () => setPaywall(false),
    openSheet: () => setSheet(true),
    closeSheet: () => setSheet(false),
  };
  const ui: UiState = {
    done,
    toggleDone: (id) => setDone((prev) => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; }),
    suggestions,
    applySuggestion: (id) => setSuggestions((prev) => prev.map((s) => (s.id === id ? { ...s, state: 'applied' } : s))),
    dismissSuggestion: (id) => setSuggestions((prev) => prev.map((s) => (s.id === id ? { ...s, state: 'dismissed' } : s))),
    runStep, setRunStep, tourDismissed, dismissTour: () => setTourDismissed(true),
    notifEnabled, toggleNotif: () => setNotifEnabled((v) => !v),
  };

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (sheet) { setSheet(false); return true; }
      if (paywall) { setPaywall(false); return true; }
      if (stack.length > 1) { back(); return true; }
      return false;
    });
    return () => sub.remove();
  }, [sheet, paywall, stack.length, back]);

  let content: React.ReactNode = null;
  switch (route.name) {
    case 'splash': content = <Splash nav={nav} ui={ui} />; break;
    case 'welcome': content = <Welcome nav={nav} ui={ui} />; break;
    case 'goal': content = <Goal nav={nav} ui={ui} />; break;
    case 'starter': content = <Starter nav={nav} ui={ui} />; break;
    case 'today': content = <Today nav={nav} ui={ui} />; break;
    case 'habitDetail': content = <HabitDetail nav={nav} ui={ui} />; break;
    case 'habitForm': content = <HabitForm nav={nav} ui={ui} />; break;
    case 'routines': content = <Routines nav={nav} ui={ui} />; break;
    case 'routineDetail': content = <RoutineDetail nav={nav} ui={ui} />; break;
    case 'routineForm': content = <RoutineForm nav={nav} ui={ui} />; break;
    case 'progress': content = <Progress nav={nav} ui={ui} />; break;
    case 'weeklyReport': content = <WeeklyReport nav={nav} ui={ui} />; break;
    case 'settings': content = <Settings nav={nav} ui={ui} />; break;
    case 'habitsGrid': content = <HabitsGrid nav={nav} ui={ui} />; break;
    case 'login': content = <Login nav={nav} ui={ui} />; break;
    case 'signup': content = <Signup nav={nav} ui={ui} />; break;
    case 'forgot': content = <Forgot nav={nav} ui={ui} />; break;
    case 'widgetPreview': content = <WidgetPreview nav={nav} ui={ui} />; break;
    case 'paymentSetup': content = <PaymentSetup nav={nav} ui={ui} />; break;
    case 'legal': content = <Legal nav={nav} ui={ui} />; break;
    default: content = <Today nav={nav} ui={ui} />;
  }
  const showTabs = isTabRoute(route);

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={['top', 'left', 'right', 'bottom']}>
        <View style={{ flex: 1 }}>
          {content}
          {showTabs && (
            <View style={{ flexDirection: 'row', backgroundColor: c.surface, borderTopColor: c.border, borderTopWidth: 1, paddingTop: spacing.sm, paddingBottom: spacing.sm, alignItems: 'center' }}>
              {TABS.slice(0, 2).map((t) => (
                <Pressable key={t.id} onPress={() => goTab(t.id)} style={{ flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 20 }}>{t.icon}</Text>
                  <Text style={{ color: route.name === t.id ? c.primary : c.muted, fontSize: type.small, fontWeight: route.name === t.id ? '700' : '400' }}>{t.label}</Text>
                </Pressable>
              ))}
              <Pressable onPress={() => setSheet(true)} style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: c.primary, alignItems: 'center', justifyContent: 'center', marginHorizontal: 4, shadowColor: c.primary, shadowOpacity: 0.4, shadowRadius: 10, elevation: 4 }}>
                <Text style={{ color: c.onPrimary, fontSize: 28, fontWeight: '800' }}>+</Text>
              </Pressable>
              {TABS.slice(2).map((t) => (
                <Pressable key={t.id} onPress={() => goTab(t.id)} style={{ flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 20 }}>{t.icon}</Text>
                  <Text style={{ color: route.name === t.id ? c.primary : c.muted, fontSize: type.small, fontWeight: route.name === t.id ? '700' : '400' }}>{t.label}</Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>
        {sheet && (
          <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
            <View style={{ backgroundColor: c.surface, padding: spacing.xl, borderTopLeftRadius: 24, borderTopRightRadius: 24 }}>
              <Text style={{ color: c.ink, fontWeight: '800', fontSize: type.subtitle, marginBottom: spacing.md }}>Add something</Text>
              <Pressable onPress={() => { setSheet(false); push({ name: 'habitForm' }); }} style={{ minHeight: 48, justifyContent: 'center' }}><Text style={{ color: c.ink }}>＋ Add habit</Text></Pressable>
              <Pressable onPress={() => { setSheet(false); push({ name: 'routineForm' }); }} style={{ minHeight: 48, justifyContent: 'center' }}><Text style={{ color: c.ink }}>＋ Create routine</Text></Pressable>
              <Pressable onPress={() => setSheet(false)} style={{ minHeight: 48, justifyContent: 'center' }}><Text style={{ color: c.primary, fontWeight: '700' }}>Cancel</Text></Pressable>
            </View>
          </View>
        )}
        {paywall && <Paywall onClose={() => setPaywall(false)} />}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
