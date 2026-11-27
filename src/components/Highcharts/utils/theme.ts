import { SERIES_COLORS, THEME_COLORS } from '@/constants/theme';
/**
 * Fallback theme values applied when a `ThemeConfig` field is missing.
 * Treated by every config-builder as "what Highcharts effectively ships
 * with, made explicit" so behaviour is deterministic regardless of the
 * caller's theme.
 */
export const DEFAULT_THEME = {
  colors: [...SERIES_COLORS],
  backgroundColor: 'transparent',
  textColor: THEME_COLORS.ink,
  gridColor: THEME_COLORS.line,
  lineColor: THEME_COLORS.line,
};
