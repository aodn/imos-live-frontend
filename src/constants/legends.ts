import type { ColorOptionKey } from './colors';
import { CATEGORY_PRODUCT_COLOR_OPTIONS } from './colors';
import { PRODUCT, type TilesProduct, MAX_VECTOR_SPEED } from './products';

const ALL_CATEGORY_COLOR_KEYS = Object.keys(CATEGORY_PRODUCT_COLOR_OPTIONS) as ColorOptionKey[];

type BaseLegendArgs = {
  label: string;
  numStops?: number;
  colorKey: ColorOptionKey;
  colorKeyOptions: ColorOptionKey[];
  threshold?: number;
};

// Continuous legends own their colour-ramp range and tick values.
type ContinuousLegendArgs = BaseLegendArgs & {
  scale: 'log' | 'linear';
  range: [number, number];
  scales?: number[];
};

// Categorical legends carry neither: the value range, flag values and labels
// all come from the product manifest's CF `flag_values` / `flag_meanings`.
type CategoryLegendArgs = BaseLegendArgs & {
  scale: 'category';
  range?: never;
  scales?: never;
};

export type LegendArgs = ContinuousLegendArgs | CategoryLegendArgs;

export const PRODUCTLEGENDS = {
  [PRODUCT.GSLA_OCEAN_GEOSTROPHIC_CURRENT]: {
    label: 'ocean current speed (m/s)',
    colorKey: 'Ocean to Terrain' as ColorOptionKey,
    colorKeyOptions: [
      'Ocean to Terrain',
      'Cmocean Thermal',
      'RdBu_r',
      'Classic Rainbow',
    ] as ColorOptionKey[],
    range: [0.01, MAX_VECTOR_SPEED],
    scale: 'log',
  },
  [PRODUCT.GSLA_ANOMALY_SEA_LEVELS]: {
    scales: [-1.2, -0.6, 0, 0.6, 1.2],
    label: 'sea level anomaly (m)',
    range: [-1.2, 1.2],
    colorKey: 'X Rainbow' as ColorOptionKey,
    colorKeyOptions: ['X Rainbow'] as ColorOptionKey[],
    scale: 'linear',
  },
  [PRODUCT.AUSTEMP_HEATWAVE_SSTA_MOSAIC]: {
    scales: [-4, -2, 0, 2, 4],
    label: 'degrees Celsius (°C)',
    range: [-4, 4],
    colorKey: 'RdBu_r' as ColorOptionKey,
    colorKeyOptions: ['RdBu_r'] as ColorOptionKey[],
    scale: 'linear',
  },
  [PRODUCT.AUSTEMP_HEATWAVE_SST_MOSAIC]: {
    scales: [0, 10, 20, 30, 40],
    label: 'degrees Celsius (°C)',
    range: [0, 40],
    colorKey: 'Classic Rainbow' as ColorOptionKey,
    colorKeyOptions: ['Cmocean Thermal', 'Classic Rainbow'] as ColorOptionKey[],
    scale: 'linear',
  },
  [PRODUCT.AUSTEMP_HEATWAVE_MHW_CATEGORY_MOSAIC]: {
    label: 'MHW Category mosaic',
    colorKey: 'MHW_CATEGORY_LEGEND_COLORS' as ColorOptionKey,
    colorKeyOptions: ALL_CATEGORY_COLOR_KEYS,
    scale: 'category',
  },
} as const satisfies Record<TilesProduct, LegendArgs>;
