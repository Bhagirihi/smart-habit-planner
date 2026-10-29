export type Tab = 'today' | 'routines' | 'progress' | 'settings';

export type Route =
  | { name: 'today' }
  | { name: 'habitDetail'; habitId: string }
  | { name: 'habitForm'; habitId?: string }
  | { name: 'routineDetail'; routineId: string }
  | { name: 'routineForm'; routineId?: string }
  | { name: 'weeklyReport' }
  | { name: 'paywall' };

export interface Nav {
  tab: Tab;
  goTab: (t: Tab) => void;
  push: (r: Route) => void;
  pop: () => void;
  openPaywall: () => void;
}
