// Verdant Nightfall starting tokens, from Design.md (no Sleek file copied).
export const c = {
  bg: '#0A1211', surface: '#0D1917', surfaceAlt: '#0F1E1B', tonal: '#12312C',
  ink: '#E9F5F1', muted: '#A7C2BB', border: '#1B2F2B', primary: '#2DD4BF',
  onPrimary: '#06201C', accent: '#34D399', error: '#F43F5E', amber: '#FBBF24',
  white: '#FFFFFF',
  chart: ['#2DD4BF', '#60A5FA', '#A78BFA', '#FBBF24', '#FB7185'] as const,
};
export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24 };
export const radius = { sm: 8, md: 12, lg: 16, xl: 20, full: 9999 };
export const type = { title: 24, subtitle: 18, numeral: 28, body: 14, label: 14, small: 12, caption: 12 };
export const GOALS = ['Fitness', 'Study', 'Health', 'Productivity', 'Better Mornings'] as const;
export type Goal = (typeof GOALS)[number];
export type TimeSlot = 'morning' | 'afternoon' | 'evening';
export interface Habit {
  id: string; name: string; icon: string; color: string; slot: TimeSlot;
  streak: number; bestStreak: number; rate: number; target: string; reminder: string;
}
export interface Routine {
  id: string; name: string; startTime: string; percent: number; habitIds: string[];
}
export interface Suggestion {
  id: string; habitId: string; title: string; reason: string; state: 'new' | 'applied' | 'dismissed';
}
