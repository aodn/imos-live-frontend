// Barrel for the Highcharts utils package. Splitting these into focused
// files (instead of the old monolithic `utils.ts`) lets the chart-option
// builders, series transformers, export pipeline, and direction-arrow
// renderer each evolve independently.

export { DEFAULT_THEME } from './theme';
export {
  buildAxisConfig,
  buildChartConfig,
  buildLegendConfig,
  buildNavigatorConfig,
  buildPlotOptionsConfig,
  buildRangeSelectorConfig,
  buildScrollbarConfig,
  buildTitleConfig,
  buildTooltipConfig,
} from './config';
export { buildExportingConfig } from './exporting';
export { calculateDataRange, calculateDateRange, generateDynamicButtons } from './dataRange';
export type { DataRange } from './dataRange';
export { createDirectionArrow, processDirectionData } from './directionArrow';
export { generateSeriesStyles, processSeries, sanitizeMarker } from './series';
