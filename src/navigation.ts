import type { Suggestion } from './theme';

export type TabName = 'today' | 'routines' | 'progress' | 'settings';
export type Route =
  | { name: 'splash' }
  | { name: 'welcome' }
  | { name: 'goal' }
  | { name: 'starter' }
  | { name: 'today' }
  | { name: 'habitDetail'; habitId: string }
  | { name: 'habitForm'; habitId?: string }
  | { name: 'routines' }
  | { name: 'routineDetail'; routineId: string }
  | { name: 'routineForm'; routineId?: string }
  | { name: 'progress' }
  | { name: 'weeklyReport' }
  | { name: 'settings' }
  | { name: 'habitsGrid' }
  | { name: 'login' }
  | { name: 'signup' }
  | { name: 'forgot' }
  | { name: 'widgetPreview' }
  | { name: 'paymentSetup' }
  | { name: 'legal'; page: 'Terms' | 'Privacy' | 'Help' };

export interface Nav {
  route: Route;
  push: (r: Route) => void;
  back: () => void;
  goTab: (t: TabName) => void;
  openPaywall: () => void;
  closePaywall: () => void;
  openSheet: () => void;
  closeSheet: () => void;
}

export type TourTarget =
  | 'today-completed'
  | 'today-free-tier'
  | 'today-help'
  | 'today-first-habit'
  | 'today-first-check'
  | 'tab-plus'
  | 'tab-today'
  | 'tab-routines'
  | 'tab-progress'
  | 'tab-settings'
  | 'routines-first'
  | 'progress-score'
  | 'report-first'
  | 'grid-first'
  | 'payment-skip'
  | 'settings-tour';

export interface TourRect { x: number; y: number; width: number; height: number; }
export type TourMeasure = () => Promise<TourRect | null>;

export interface UiState {
  done: Set<string>;
  toggleDone: (id: string) => void;
  suggestions: Suggestion[];
  applySuggestion: (id: string) => void;
  dismissSuggestion: (id: string) => void;
  runStep: number;
  setRunStep: (n: number) => void;
  tourDismissed: boolean;
  dismissTour: () => void;
  startTour: () => void;
  tourActive: boolean;
  tourStep: number;
  registerTourTarget: (key: TourTarget, measure: TourMeasure) => void;
  unregisterTourTarget: (key: TourTarget) => void;
  // Ask App to re-measure the current tour target (e.g. after a ScrollView
  // scroll settles). Incrementing this nonce re-runs App's measurement
  // effect; it is NOT a navigation action and never changes the step.
  requestTourRemeasure: () => void;
  notifEnabled: boolean;
  toggleNotif: () => void;
}

export const TAB_ROUTES: Record<TabName, Route> = {
  today: { name: 'today' },
  routines: { name: 'routines' },
  progress: { name: 'progress' },
  settings: { name: 'settings' },
};

export function routeTab(r: Route): TabName | null {
  if (r.name === 'today') return 'today';
  if (r.name === 'routines') return 'routines';
  if (r.name === 'progress') return 'progress';
  if (r.name === 'settings') return 'settings';
  return null;
}

export function isTabRoute(r: Route): boolean {
  return routeTab(r) !== null;
}
