import React, { useCallback, useEffect, useRef, useState } from 'react';
import { BackHandler, Dimensions, Pressable, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { c, spacing, type } from './src/theme';
import type { Suggestion } from './src/theme';
import { INITIAL_DONE, SUGGESTIONS } from './src/data';
import type { Nav, Route, TabName, TourMeasure, TourRect, TourTarget, UiState } from './src/navigation';
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
import { TOUR_STEPS, TourTooltip, type TourDestination } from './src/components/Tooltip';

const TABS: { id: TabName; label: string; icon: string }[] = [
  { id: 'today', label: 'Today', icon: '🏠' },
  { id: 'routines', label: 'Routines', icon: '🗂️' },
  { id: 'progress', label: 'Progress', icon: '📊' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
];

// AppInner runs INSIDE SafeAreaProvider, so useSafeAreaInsets() works.
//
// REVIEW FIX (why the previous fix did not replicate on device):
// The previous fix converted window rects by subtracting live insets and
// rendered the overlay as a direct child of SafeAreaView. That is still
// ambiguous on Android: an absolute child of SafeAreaView is positioned
// relative to SafeAreaView's own box, whose origin is NOT guaranteed to
// equal the safe-area content origin on every device / SafeAreaView
// implementation — so the frame could land shifted by the inset again,
// in either direction, depending on the device. The only coordinate
// system that cannot be wrong is the overlay's own parent:
//   - the overlay now lives INSIDE the root <View flex:1> (inside
//     SafeAreaView, so it still cannot go under a system bar),
//   - every target rect is converted by subtracting the ROOT view's own
//     window rect (measured at the same moment), NOT by subtracting
//     insets from a theory about SafeAreaView.
// rootRect is measured, never assumed. If root measurement fails, the
// old inset conversion is kept as a fallback only.
function AppInner() {
  const insets = useSafeAreaInsets();
  const rootRef = useRef<any>(null);
  const [stack, setStack] = useState<Route[]>([{ name: 'splash' }]);
  const [sheet, setSheet] = useState(false);
  const [paywall, setPaywall] = useState(false);
  const [done, setDone] = useState<Set<string>>(new Set(INITIAL_DONE));
  const [suggestions, setSuggestions] = useState<Suggestion[]>(SUGGESTIONS);
  const [runStep, setRunStep] = useState(0);
  const [tourDismissed, setTourDismissed] = useState(false);
  const [tourActive, setTourActive] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  const [targetRect, setTargetRect] = useState<TourRect | null>(null);
  // Incremented by ui.requestTourRemeasure() (e.g. after a ScrollView
  // scroll settles) to re-run the measurement effect below.
  const [remeasureNonce, setRemeasureNonce] = useState(0);
  const [notifEnabled, setNotifEnabled] = useState(true);
  // Tour target measurers: screens register a measureInWindow function for
  // each target key they render. Stored in a ref (not state) so registering
  // never re-renders the app; App reads it when the tour step changes.
  const tourMeasurers = useRef(new Map<TourTarget, TourMeasure>());
  const tourAutoShown = useRef(false);
  const tabRefs = useRef<Record<string, any>>({});
  const registerTourTarget = useCallback((key: TourTarget, measure: TourMeasure) => {
    tourMeasurers.current.set(key, measure);
  }, []);
  const unregisterTourTarget = useCallback((key: TourTarget) => {
    tourMeasurers.current.delete(key);
  }, []);

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
    startTour: () => { setTourStep(0); setTourActive(true); },
    tourActive, tourStep, registerTourTarget, unregisterTourTarget,
    requestTourRemeasure: () => setRemeasureNonce((n) => n + 1),
    notifEnabled, toggleNotif: () => setNotifEnabled((v) => !v),
  };

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (sheet) { setSheet(false); return true; }
      if (paywall) { setPaywall(false); return true; }
      if (tourActive) { setTourActive(false); return true; }
      if (stack.length > 1) { back(); return true; }
      return false;
    });
    return () => sub.remove();
  }, [sheet, paywall, tourActive, stack.length, back]);

  // Register the bottom tab bar + central + button as tour targets. These
  // are rendered by App itself, so they are always measurable on tab screens.
  useEffect(() => {
    const makeMeasure = (key: string): TourMeasure => () => new Promise((resolve) => {
      const node = tabRefs.current[key];
      if (!node) return resolve(null);
      node.measureInWindow((x: number, y: number, width: number, height: number) => resolve(width > 0 ? { x, y, width, height } : null));
    });
    (['today', 'routines', 'progress', 'settings'] as const).forEach((t) => {
      registerTourTarget(`tab-${t}` as TourTarget, makeMeasure(`tab-${t}`));
    });
    registerTourTarget('tab-plus', makeMeasure('tab-plus'));
    // No cleanup: tab bar refs live as long as App does.
  }, [registerTourTarget]);

  // AUTO-SHOW FOR NEW USERS: the first time the app reaches the Today
  // screen in a session, start the tour once. Dismissing/Skipping it sets
  // tourActive false but tourAutoShown stays true, so returning to Today
  // later in the same session never restarts it. Manual replay via ?,
  // intro card, Settings, or Help still works. Reload resets the flag
  // (session-only, no persistence in this UI build).
  useEffect(() => {
    if (route.name === 'today' && !tourAutoShown.current && !tourActive) {
      tourAutoShown.current = true;
      setTourStep(0);
      setTourActive(true);
    }
  }, [route.name, tourActive]);

  // Measure the current step's target in ROOT coordinates (see the
  // AppInner comment above). Root = the <View flex:1> that wraps content
  // + tabs and also contains the tour overlay, so a rect converted as
  // (target window rect − root window rect) is exactly where the overlay
  // must draw it, on every Android device, with no assumption about
  // SafeAreaView's absolute-child origin, status-bar height, or notch.
  // Re-runs on step/route/inset/re-measure changes, tries immediately,
  // 150ms and 400ms, and keeps the LAST valid rect. A missing measurer,
  // a zero-size rect, or a rect fully outside the root yields null, and
  // TourTooltip falls back to the bottom bubble.
  useEffect(() => {
    if (!tourActive) { setTargetRect(null); return; }
    const step = TOUR_STEPS[tourStep] ?? TOUR_STEPS[0];
    if (!step.target) { setTargetRect(null); return; }
    const W = Dimensions.get('window').width;
    const H = Dimensions.get('window').height;
    const safeW = Math.max(1, W - insets.left - insets.right);
    const safeH = Math.max(1, H - insets.top - insets.bottom);
    let cancelled = false;
    const measureNode = (node: any): Promise<TourRect | null> => new Promise((resolve) => {
      if (!node) return resolve(null);
      node.measureInWindow((x: number, y: number, width: number, height: number) =>
        resolve(width > 0 ? { x, y, width, height } : null));
    });
    const attempt = async () => {
      const measure = tourMeasurers.current.get(step.target!);
      if (!measure) { if (!cancelled) setTargetRect(null); return; }
      try {
        const rect = await measure();
        if (cancelled || !rect) { if (!cancelled) setTargetRect(null); return; }
        const rootRect = await measureNode(rootRef.current);
        // Root-relative rect (preferred, exact) or inset fallback.
        const safeRect: TourRect = rootRect
          ? { x: rect.x - rootRect.x, y: rect.y - rootRect.y, width: rect.width, height: rect.height }
          : { x: rect.x - insets.left, y: rect.y - insets.top, width: rect.width, height: rect.height };
        const boundW = rootRect ? rootRect.width : safeW;
        const boundH = rootRect ? rootRect.height : safeH;
        if (safeRect.x + safeRect.width < 0 || safeRect.x > boundW ||
            safeRect.y + safeRect.height < 0 || safeRect.y > boundH) {
          setTargetRect(null); return;
        }
        setTargetRect(safeRect);
      } catch { if (!cancelled) setTargetRect(null); }
    };
    attempt();
    const t1 = setTimeout(attempt, 150);
    const t2 = setTimeout(attempt, 400);
    return () => { cancelled = true; clearTimeout(t1); clearTimeout(t2); };
  }, [tourActive, tourStep, route.name, insets.top, insets.bottom, insets.left, insets.right, remeasureNonce]);

  const goToTourDestination = useCallback((destination: TourDestination) => {
    // Guarded: never push a route that is already on top, never duplicate a tab.
    if (destination === 'today' || destination === 'routines' || destination === 'progress' || destination === 'settings') {
      if (route.name !== destination) goTab(destination);
    } else if (route.name !== destination) {
      push({ name: destination });
    }
  }, [route.name, goTab, push]);

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

  const safeWidth = Math.max(1, Dimensions.get('window').width - insets.left - insets.right);
  const safeHeight = Math.max(1, Dimensions.get('window').height - insets.top - insets.bottom);

  return (
    <>
      <StatusBar style="light" />
      <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={['top', 'left', 'right', 'bottom']}>
        <View ref={rootRef} collapsable={false} style={{ flex: 1 }}>
          {content}
          {showTabs && (
            <View style={{ flexDirection: 'row', backgroundColor: c.surface, borderTopColor: c.border, borderTopWidth: 1, paddingTop: spacing.sm, paddingBottom: spacing.sm, alignItems: 'center' }}>
              {TABS.slice(0, 2).map((t) => (
                <Pressable key={t.id} ref={(el) => { tabRefs.current[`tab-${t.id}`] = el; }} collapsable={false} onPress={() => goTab(t.id)} style={{ flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 20 }}>{t.icon}</Text>
                  <Text style={{ color: route.name === t.id ? c.primary : c.muted, fontSize: type.small, fontWeight: route.name === t.id ? '700' : '400' }}>{t.label}</Text>
                </Pressable>
              ))}
              <Pressable ref={(el) => { tabRefs.current['tab-plus'] = el; }} collapsable={false} onPress={() => setSheet(true)} style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: c.primary, alignItems: 'center', justifyContent: 'center', marginHorizontal: 4, shadowColor: c.primary, shadowOpacity: 0.4, shadowRadius: 10, elevation: 4 }}>
                <Text style={{ color: c.onPrimary, fontSize: 28, fontWeight: '800' }}>+</Text>
              </Pressable>
              {TABS.slice(2).map((t) => (
                <Pressable key={t.id} ref={(el) => { tabRefs.current[`tab-${t.id}`] = el; }} collapsable={false} onPress={() => goTab(t.id)} style={{ flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 20 }}>{t.icon}</Text>
                  <Text style={{ color: route.name === t.id ? c.primary : c.muted, fontSize: type.small, fontWeight: route.name === t.id ? '700' : '400' }}>{t.label}</Text>
                </Pressable>
              ))}
            </View>
          )}
          {/* Tour overlay INSIDE the root View (which is inside
              SafeAreaView), over content + tabs, in ROOT coordinates
              (see the AppInner comment). Its origin is therefore exactly
              the origin the target rects were converted to — this is
              what makes the frame land on the element on every device,
              instead of depending on SafeAreaView's absolute-child origin.
              It still cannot sit under a system bar, because the root
              View's bounds are the safe-area bounds. */}
          {tourActive && (
            <TourTooltip
              stepIndex={tourStep}
              targetRect={targetRect}
              safeWidth={safeWidth}
              safeHeight={safeHeight}
              onNext={() => { if (tourStep >= TOUR_STEPS.length - 1) setTourActive(false); else setTourStep((s) => s + 1); }}
              onBack={() => setTourStep((s) => Math.max(0, s - 1))}
              onSkip={() => setTourActive(false)}
              onClose={() => setTourActive(false)}
              onGoTo={goToTourDestination}
            />
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
    </>
  );
}

// Root: provider must wrap the component that calls useSafeAreaInsets().
export default function App() {
  return (
    <SafeAreaProvider>
      <AppInner />
    </SafeAreaProvider>
  );
}
