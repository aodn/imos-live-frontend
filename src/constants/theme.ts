// JS mirror of the @theme colors in src/index.css (Mapbox, SVG and Highcharts can't read Tailwind classes).
// theme.spec.ts fails if a value here drifts from index.css.
export const THEME_COLORS = {
  primary: '#3b6e8f',
  primaryDark: '#2f566f',
  primarySoft: '#c5d8e7',
  accentAqua: '#a7e9f3',
  accentSky: '#7fb6d1',
  ink: '#1a2a3a',
  inkMuted: '#4a5b68',
  inkSubtle: '#7a8a97',
  line: '#d3e0ea',
  surfaceMuted: '#f3f6f9',
  danger: '#d32f2f',
  warning: '#f59e0b',
  success: '#2e7d32',
  dataWaveBuoy: '#11b4da',
  dataMooring: '#f97316',
} as const;

// Site cluster fills (small to large); light enough for the dark cluster labels
export const CLUSTER_COLORS = [THEME_COLORS.accentAqua, THEME_COLORS.accentSky, '#5a93b5'] as const;

// Categorical series palette for charts, led by the brand colors
export const SERIES_COLORS = [
  THEME_COLORS.primary,
  THEME_COLORS.dataWaveBuoy,
  THEME_COLORS.dataMooring,
  '#8b5cf6',
  THEME_COLORS.success,
  THEME_COLORS.danger,
  THEME_COLORS.accentSky,
  THEME_COLORS.warning,
] as const;
