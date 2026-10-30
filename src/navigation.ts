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
