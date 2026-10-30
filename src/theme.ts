// Deep Teal Console Mobile — exact DESIGN.MD tokens. Single dark theme.
export const c = {
  bg: '#0A1211', surface: '#0D1917', surfaceAlt: '#0F1E1B', surfaceTonal: '#12312C',
  ink: '#E9F5F1', muted: '#A7C2BB', border: '#1B2F2B', primary: '#2DD4BF', onPrimary: '#06201C',
  accent: '#34D399', error: '#F43F5E', amber: '#FBBF24',
  chart: ['#2DD4BF', '#60A5FA', '#A78BFA', '#FBBF24', '#FB7185'] as const,
};
export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24 };
export const radius = { sm: 8, md: 12, lg: 16, xl: 20, full: 9999 };
export const type = { title: 24, subtitle: 18, numeral: 24, body: 14, label: 14, small: 12, caption: 12 };
export const HABIT_COLORS = [
  { id: 'teal', value: '#2DD4BF' }, { id: 'blue', value: '#60A5FA' }, { id: 'violet', value: '#A78BFA' },
  { id: 'amber', value: '#FBBF24' }, { id: 'coral', value: '#FB7185' }, { id: 'green', value: '#34D399' },
];
export const HABIT_ICONS = ['✓', '💧', '🚶', '📖', '🧘', '🥗', '😴', '🏋️', '✍️', '🎯', '🧹', '💻', '👣', '🏃', '🍎', '🎵', '💰', '🧠', '🚰'];
export const GOALS = ['Fitness', 'Study', 'Health', 'Productivity', 'Better Mornings'] as const;
export type Goal = (typeof GOALS)[number];
