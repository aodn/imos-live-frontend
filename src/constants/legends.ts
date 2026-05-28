import type { ColorOptionKey } from './colors';
import { PRODUCT, type ProductType, MAX_VECTOR_SPEED } from './products';

export type LegendArgs = {
  label: string;
  numStops?: number;
  colorKey: ColorOptionKey;
  range: [number, number];
  threshold?: number;
  scales?: (number | string)[];
  scale: 'log' | 'linear' | 'category';
};

export const HW_CATEGORY_LOOKUP = {
  0: 'none',
  1: 'moderate',
  2: 'strong',
  3: 'severe',
  4: 'extreme',
} as const;

export const HW_CATEGORY_LEGEND_SCALES = Object.values(HW_CATEGORY_LOOKUP);

export const PRODUCTLEGENDS = {
  [PRODUCT.GSLA_OCEAN_GEOSTROPHIC_CURRENT]: {
    label: 'ocean current speed (m/s)',
    colorKey: 'Particles' as ColorOptionKey,
    range: [0.01, MAX_VECTOR_SPEED],
    scale: 'log',
  },
  [PRODUCT.GSLA_ANOMALY_SEA_LEVELS]: {
    scales: [-1.2, -0.6, 0, 0.6, 1.2],
    label: 'sea level anomaly (m)',
    range: [-1.2, 1.2],
    colorKey: 'Anomaly Sea Level' as ColorOptionKey,
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
    colorKey: 'RdBu_r' as ColorOptionKey,
    scale: 'linear',
  },
  [PRODUCT.AUSTEMP_HEATWAVE_MCS_CATEGORY]: {
    scales: HW_CATEGORY_LEGEND_SCALES,
    range: [0, 4],
    label: 'MCS Category',
    colorKey: 'MHW_CATEGORY_LEGEND_COLORS' as ColorOptionKey,
    scale: 'category',
  },
} as const satisfies Record<Exclude<ProductType, 'wave-buoys'>, LegendArgs>;
