// Typed custom navigation (documented choice, not Expo Router):
// a blank project with a small, fixed screen set does not need file-based
// routing; a single typed stack + tab state keeps EAS Android export simple
// and avoids router peer-version risk on SDK 58. Every route is typed here.
export type Route =
  | { name: 'splash' } | { name: 'welcome' } | { name: 'goal' } | { name: 'starter' }
  | { name: 'today' } | { name: 'routines' } | { name: 'progress' } | { name: 'settings' }
  | { name: 'habitDetail'; habitId: string } | { name: 'habitForm'; habitId?: string }
  | { name: 'routineDetail'; routineId: string } | { name: 'routineForm'; routineId?: string }
  | { name: 'paywall'; from?: Route } | { name: 'weeklyReport' };
export type TabName = 'today' | 'routines' | 'progress' | 'settings';
export interface Nav {
  route: Route; push: (r: Route) => void; back: () => void; goTab: (t: TabName) => void;
  openPaywall: (from?: Route) => void;
}
export const TAB_ROUTES: Record<TabName, Route> = {
  today: { name: 'today' }, routines: { name: 'routines' }, progress: { name: 'progress' }, settings: { name: 'settings' },
};
