// JS mirror of the @theme colors in src/index.css (Mapbox, SVG and Highcharts can't read Tailwind classes).
export const THEME_COLORS = {
  primary: '#3b6e8f',
  primaryDark: '#2f566f',
  primarySoft: '#c5d8e7',
  ink: '#1a2a3a',
  inkMuted: '#4a5b68',
  inkSubtle: '#7a8a97',
  line: '#d3e0ea',
  danger: '#d32f2f',
  dataWaveBuoy: '#11b4da',
  dataMooring: '#f97316',
  surfaceMuted: '#f3f6f9',
} as const;

// Site cluster fills (small to large); light enough for the dark cluster labels
export const CLUSTER_COLORS = ['#a7e9f3', '#7fb6d1', '#5a93b5'] as const;

// Categorical series palette for charts, led by the brand colors
export const SERIES_COLORS = [
  '#3b6e8f',
  '#11b4da',
  '#f97316',
  '#8b5cf6',
  '#2e7d32',
  '#d32f2f',
  '#7fb6d1',
  '#f59e0b',
] as const;
