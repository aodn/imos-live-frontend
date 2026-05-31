import { type StyleTitle } from '@/styles';
import { getLast10Dates, getLast60Dates, generateValueByPercentage } from '@/utils';
import mapboxgl from 'mapbox-gl';
import { PRODUCT } from './products';
import type { ProductEnabled } from '@/store';
import {
  type ParticleConfig,
  FADE_OPACITY_RANGE,
  SPEED_FACTOR_RANGE,
  POINT_SIZE_RANGE,
} from '@/AtlasRenderingSystem';

export const CLUSTER_MAX_ZOOM = 7;

export const MAX_ZOOM = CLUSTER_MAX_ZOOM;

export const INITIAL_ZOOM = 3;
export const INITIAL_STYLE: StyleTitle = 'Streets';
export const INITIAL_CENTER = new mapboxgl.LngLat(133.7751, -25.2744);
export const DATE_RANGE = getLast60Dates();
export const INITIAL_DATE = DATE_RANGE.at(-1)!;
export const INITIAL_WORLD_BOUNDARIES_ENABLED = true;
export const INITIAL_DISTANCE_MEASUREMENT_ENABLED = false;

export const QUERY_DATE_RANGE = getLast10Dates('yyyymmdd');

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
  [PRODUCT.AUSTEMP_HEATWAVE_MCS_CATEGORY]: false,
  [PRODUCT.WAVE_BUOYS]: true,
} as const satisfies ProductEnabled;
