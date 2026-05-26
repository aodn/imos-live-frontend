/**
 * this is the single truth of all the products in this project, and
 * the single truth of product's layerId, sourceId.
 */
import { anomalySeaLevel } from '@/config/colorPalettes';
import type { ColorOptionKey } from '@/config/colorPalettes';

export const gslaOverlayImageColors = anomalySeaLevel.colors as [number, number, number][];

export const PRODUCT = {
  GSLA_OCEAN_GEOSTROPHIC_CURRENT: 'model_sea_level_anomaly_gridded_realtime_vcur_ucur',
  GSLA_ANOMALY_SEA_LEVELS: 'model_sea_level_anomaly_gridded_realtime_gsla',
  AUSTEMP_HEATWAVE_SSTA_MOSAIC: 'satellite_austemp_heatwave_8day_ssta_mosaic',
  AUSTEMP_HEATWAVE_SST_MOSAIC: 'satellite_austemp_heatwave_8day_sst_mosaic',
  WAVE_BUOYS: 'wave-buoys',
} as const;

export type ProductType = (typeof PRODUCT)[keyof typeof PRODUCT];

export type TilesProduct = Exclude<ProductType, typeof PRODUCT.WAVE_BUOYS>;

type ProductValue = {
  name: string;
  layerId: string;
  sourceId: string;
  variables?: string[];
};

export const PRODUCTS = {
  [PRODUCT.GSLA_OCEAN_GEOSTROPHIC_CURRENT]: {
    name: 'GSLA Ocean Geostrophic Current',
    layerId: 'gsla-particle-layer',
    sourceId: 'gsla-particle-source',
    variables: ['UCUR', 'VCUR'],
  },
  [PRODUCT.GSLA_ANOMALY_SEA_LEVELS]: {
    name: 'GSLA Anomaly Sea Levels',
    layerId: 'gsla-raster-layer',
    sourceId: 'gsla-raster-source',
    variables: ['GSLA'],
  },
  [PRODUCT.WAVE_BUOYS]: {
    name: 'Wave Buoys',
    layerId: 'wave-buoys-layer',
    sourceId: 'wave-buoys-source',
  },
  [PRODUCT.AUSTEMP_HEATWAVE_SST_MOSAIC]: {
    name: 'Austemp heatwave SST Mosaic',
    layerId: 'austemp-heatwave-sst-mosaic-layer',
    sourceId: 'austemp-heatwave-sst-mosaic-source',
    variables: ['sst_mosaic'],
  },
  [PRODUCT.AUSTEMP_HEATWAVE_SSTA_MOSAIC]: {
    name: 'Austemp heatwave SSTA Mosaic',
    layerId: 'austemp-heatwave-ssta-mosaic-layer',
    sourceId: 'austemp-heatwave-ssta-mosaic-source',
    variables: ['ssta_mosaic'],
  },
} as const satisfies Record<ProductType, ProductValue>;

export const MAX_VECTOR_SPEED = 3.0 as const;

export type LegendArgs = {
  label: string;
  numStops?: number;
  colorKey: ColorOptionKey;
  range: [number, number];
  threshold?: number;
  scales?: number[];
  scale: 'log' | 'linear';
};

export const MHW_CATEGORY_LEGEND_COLORS = [
  '#8c0000', // none
  '#ff9701', // moderate
  '#67ff96', // strong
  '#007bff', // severe
  '#00078f', // extreme
];

export const HW_CATEGORY_LEGEND_LABELS = ['none', 'moderate', 'strong', 'severe', 'extreme'];

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
} as const satisfies Record<Exclude<ProductType, 'wave-buoys'>, LegendArgs>;

export type ProductLayerId = (typeof PRODUCTS)[ProductType]['layerId'];
export type ProductSourceId = (typeof PRODUCTS)[ProductType]['sourceId'];
export type ProductName = (typeof PRODUCTS)[ProductType]['name'];

export const sourceIdToProduct = (sourceId: ProductSourceId) => {
  return Object.entries(PRODUCTS).find(([, v]) => v.sourceId === sourceId)?.[0] as ProductType;
};

export const layerIdToProduct = (layerId: ProductLayerId) => {
  return Object.entries(PRODUCTS).find(([, v]) => v.layerId === layerId)?.[0] as ProductType;
};

export const TILES_GROUP = [
  PRODUCT.GSLA_ANOMALY_SEA_LEVELS,
  PRODUCT.AUSTEMP_HEATWAVE_SST_MOSAIC,
  PRODUCT.AUSTEMP_HEATWAVE_SSTA_MOSAIC,
] as const satisfies TilesProduct[];
