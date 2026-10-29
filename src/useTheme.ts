import { darkColors, lightColors, type Palette } from './theme';
import { useStore } from './store';

/** Current palette, driven by Settings > Appearance. Default is Light.
 * Every themed component must call this (not import the static `colors`),
 * otherwise its StyleSheet colours will never switch in Dark mode. */
export function useTheme(): Palette {
  const { state } = useStore();
  return state.settings.themeMode === 'dark' ? darkColors : lightColors;
}
