import type { ColorOptionKey } from './colors';
import { PRODUCT, type TilesProduct, MAX_VECTOR_SPEED } from './products';

export type LegendArgs = {
  label: string;
  numStops?: number;
  colorKey: ColorOptionKey;
  range: [number, number];
  threshold?: number;
  scales?: (number | string)[];
  scale: 'log' | 'linear' | 'category';
};

// Initial-render fallback for the MCS Category product's popup labels and
// legend tick labels. The real source of truth is the CF `flag_meanings` on
// the product manifest: the popup reads it via React Query
// (`productManifestQueryOptions`) and `useAtlasLayer` overwrites the legend's
// `scales` field with the manifest's `flag_meanings` after the manifest loads.
// This map is only used until the manifest is in the cache.
// `validateCategoricalManifest` warns in dev if this fallback drifts away
// from the manifest data.
export const MHW_CATEGORY_LOOKUP = {
  0: 'none',
  1: 'moderate',
  2: 'strong',
  3: 'severe',
  4: 'extreme',
} as const;

export const MHW_CATEGORY_LEGEND_SCALES = Object.values(MHW_CATEGORY_LOOKUP);

export const PRODUCTLEGENDS = {
  [PRODUCT.GSLA_OCEAN_GEOSTROPHIC_CURRENT]: {
    label: 'ocean current speed (m/s)',
    colorKey: 'Ocean to Terrain' as ColorOptionKey,
    range: [0.01, MAX_VECTOR_SPEED],
    scale: 'log',
  },
  [PRODUCT.GSLA_ANOMALY_SEA_LEVELS]: {
    scales: [-1.2, -0.6, 0, 0.6, 1.2],
    label: 'sea level anomaly (m)',
    range: [-1.2, 1.2],
    colorKey: 'X Rainbow' as ColorOptionKey,
    scale: 'linear',
  },
  [PRODUCT.AUSTEMP_HEATWAVE_SSTA_MOSAIC]: {
    scales: [-4, -2, 0, 2, 4],
    label: 'degrees Celsius (°C)',
    range: [-4, 4],
    colorKey: 'RdBu_r' as ColorOptionKey,
    scale: 'linear',
  },
  [PRODUCT.AUSTEMP_HEATWAVE_SST_MOSAIC]: {
    scales: [0, 10, 20, 30, 40, 50],
    label: 'degrees Celsius (°C)',
    range: [0, 50],
    colorKey: 'X SST' as ColorOptionKey,
    scale: 'linear',
  },
  [PRODUCT.AUSTEMP_HEATWAVE_MHW_CATEGORY_MOSAIC]: {
    scales: MHW_CATEGORY_LEGEND_SCALES,
    range: [0, 4],
    label: 'MHW Category mosaic',
    colorKey: 'MHW_CATEGORY_LEGEND_COLORS' as ColorOptionKey,
    scale: 'category',
  },
} as const satisfies Record<TilesProduct, LegendArgs>;
