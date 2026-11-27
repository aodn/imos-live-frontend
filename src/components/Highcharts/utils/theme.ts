import { SERIES_COLORS, THEME_COLORS } from '@/constants/theme';
/**
 * Fallback theme values applied when a `ThemeConfig` field is missing.
 * Uses the app theme (see `constants/theme.ts`), not the Highcharts defaults,
 * so charts without an explicit theme match the rest of the UI.
 */
export const DEFAULT_THEME = {
  colors: [...SERIES_COLORS],
  backgroundColor: 'transparent',
  textColor: THEME_COLORS.ink,
  gridColor: THEME_COLORS.line,
  lineColor: THEME_COLORS.line,
};
