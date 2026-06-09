/**
 * Fallback theme values applied when a `ThemeConfig` field is missing.
 * Treated by every config-builder as "what Highcharts effectively ships
 * with, made explicit" so behaviour is deterministic regardless of the
 * caller's theme.
 */
export const DEFAULT_THEME = {
  colors: [
    '#7cb5ec',
    '#434348',
    '#90ed7d',
    '#f7a35c',
    '#8085e9',
    '#f15c80',
    '#e4d354',
    '#2b908f',
    '#f45b5b',
    '#91e8e1',
  ],
  backgroundColor: 'transparent',
  textColor: '#333333',
  gridColor: '#e6e6e6',
  lineColor: '#ccd6eb',
};
