/** Colour system. `colors` stays as the light palette for any non-component use.
 * Components must use `useTheme()` (src/useTheme.ts) so Light / Dark mode
 * actually switches every screen — static StyleSheet colours cannot do that. */

export const lightColors = {
  bg: '#FAF9F6',
  surface: '#FFFFFF',
  surface2: '#F1EFEA',
  ink: '#111827',
  muted: '#6B7280',
  faint: '#9CA3AF',
  border: '#E7E3DC',
  primary: '#0F766E',
  primaryDark: '#0B5E57',
  primarySoft: '#E6F4F1',
  amber: '#F59E0B',
  amberSoft: '#FEF3C7',
  red: '#DC2626',
  redSoft: '#FEE2E2',
  green: '#059669',
  greenSoft: '#D1FAE5',
  violet: '#7C3AED',
  violetSoft: '#EDE9FE',
  pink: '#DB2777',
  pinkSoft: '#FCE7F3',
  blue: '#2563EB',
  blueSoft: '#DBEAFE',
  orange: '#F97316',
  orangeSoft: '#FFEDD5',
  gradient: ['#0F766E', '#7C3AED'] as [string, string],
  onGradient: '#FFFFFF',
  shadow: '#111827',
};

export type Palette = typeof lightColors;

/** Dark mode: readable, not just inverted — lighter surfaces, brighter accents. */
export const darkColors: Palette = {
  bg: '#0B1220',
  surface: '#1E293B',
  surface2: '#334155',
  ink: '#F8FAFC',
  muted: '#94A3B8',
  faint: '#64748B',
  border: '#334155',
  primary: '#2DD4BF',
  primaryDark: '#14B8A6',
  primarySoft: '#134E4A',
  amber: '#FBBF24',
  amberSoft: '#78350F',
  red: '#F87171',
  redSoft: '#7F1D1D',
  green: '#34D399',
  greenSoft: '#14532D',
  violet: '#A78BFA',
  violetSoft: '#312E81',
  pink: '#F472B6',
  pinkSoft: '#500724',
  blue: '#60A5FA',
  blueSoft: '#1E3A8A',
  orange: '#FB923C',
  orangeSoft: '#7C2D12',
  gradient: ['#14B8A6', '#8B5CF6'] as [string, string],
  onGradient: '#FFFFFF',
  shadow: '#000000',
};

export const colors = lightColors;

export const radii = { sm: 12, md: 18, lg: 22, xl: 26 };
export const spacing = { xs: 6, sm: 10, md: 16, lg: 22, xl: 28 };

export const type = {
  display: 34,
  hero: 30,
  title: 22,
  subtitle: 17,
  body: 15,
  small: 13,
  caption: 12,
};

/** One distinct, attractive colour per habit — teal, blue, violet, pink, orange, green, red, cyan. */
export const HABIT_COLORS = ['#0F766E', '#2563EB', '#7C3AED', '#DB2777', '#F97316', '#059669', '#DC2626', '#0891B2'];

/** Soft tint of a hex colour, e.g. for a habit card background. */
export function soft(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  if ([r, g, b].some((v) => Number.isNaN(v))) return hex;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
