import { type StyleTitle } from '@/styles';
import { formatUtcInstant, generateValueByPercentage } from '@/utils';
import mapboxgl from 'mapbox-gl';
import { PRODUCT } from './products';
import type { ProductEnabled, TIMEZONE } from '@/store';
import {
  type ParticleConfig,
  FADE_OPACITY_RANGE,
  SPEED_FACTOR_RANGE,
  POINT_SIZE_RANGE,
} from '@/AtlasRenderingSystem';

export const CLUSTER_MAX_ZOOM = 7;

export const MAX_ZOOM = CLUSTER_MAX_ZOOM;

export const INITIAL_TIMEZONE: TIMEZONE = 'UTC';
export const INITIAL_ZOOM = 3;
export const INITIAL_STYLE: StyleTitle = 'Streets';
export const INITIAL_CENTER = new mapboxgl.LngLat(133.7751, -25.2744);
// Naive (timezone-free) 'YYYY-MM-DD' bounds. `end` is "today" for INITIAL_TIMEZONE,
// snapshotted once at load — it's only used as the initial default below.
// Live consumers (e.g. useDateSliderDates) re-derive "today" from the current
// timezone via formatUtcInstant rather than reading this stale snapshot.
export const DATE_RANGE = {
  start: '2024-01-01',
  // Because UTC or local timezone could be different calendar day
  end: formatUtcInstant(new Date(), INITIAL_TIMEZONE),
};
export const INITIAL_DATE = DATE_RANGE.end;
export const INITIAL_WORLD_BOUNDARIES_ENABLED = true;
export const INITIAL_DISTANCE_MEASUREMENT_ENABLED = false;

// Minimum map width in CSS (logical) pixels below which the export button is disabled.
export const MIN_EXPORT_MAP_WIDTH = 640;

export const INITIAL_PARTICLE_CONFIG: ParticleConfig = {
  nParticles: 30000,
  // opacity of background screen, leading to fading of trails, related to trail length.
  fadeOpacity: generateValueByPercentage({
    percentage: 0.9,
    range: FADE_OPACITY_RANGE,
    decimals: 2,
  }),
  speedFactor: generateValueByPercentage({
    percentage: 0.5,
    range: SPEED_FACTOR_RANGE,
    decimals: 1,
  }),
  // chance per frame that a particle will be deleted and moved to a new position
  dropRate: 0.002,
  // prevents faster moving regions from visually dominating
  dropRateBump: 0.05,
  pointSize: generateValueByPercentage({ percentage: 0.1, range: POINT_SIZE_RANGE, decimals: 1 }),
};

export const INITIAL_PRODUCT_ENABLED = {
  [PRODUCT.GSLA_OCEAN_GEOSTROPHIC_CURRENT]: true,
  [PRODUCT.GSLA_ANOMALY_SEA_LEVELS]: true,
  [PRODUCT.AUSTEMP_HEATWAVE_SST_MOSAIC]: false,
  [PRODUCT.AUSTEMP_HEATWAVE_SSTA_MOSAIC]: false,
  [PRODUCT.AUSTEMP_HEATWAVE_MHW_CATEGORY_MOSAIC]: false,
  [PRODUCT.WAVE_BUOYS]: true,
  [PRODUCT.MOORING_TIMESERIES_REALTIME]: false,
} as const satisfies ProductEnabled;

function buildProductBooleanMap(value: boolean): ProductEnabled {
  return Object.fromEntries(Object.values(PRODUCT).map(p => [p, value])) as ProductEnabled;
}

export const INITIAL_PRODUCT_ERROR = buildProductBooleanMap(false);
export const INITIAL_PRODUCT_LOADING = buildProductBooleanMap(false);
