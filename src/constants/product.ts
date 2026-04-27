/**
 * this is the single truth of all the products in this project, and
 * the single truth of product's layerId, sourceId.
 */
import { anomalySeaLevel } from '@/config/colorPalettes';
import type { ColorOptionKey } from '@/config/colorPalettes';

export const gslaOverlayImageColors = anomalySeaLevel.colors as [number, number, number][];

export const PRODUCT = {
  GSLA_OCEAN_GEOSTROPHIC_CURRENT: 'gsla-ocean-geostrophic-current',
  GSLA_ANOMALY_SEA_LEVELS: 'gsla-anomaly-sea-levels',
  WAVE_BUOYS: 'wave-buoys',
  SST_ANOMALY_MOSAIC: 'sst-anom-mosaic',
  MARINE_HEATWAVE_SSTA_MOSAIC: 'marine-heatwave-ssta-mosaic',
  MARINE_HEATWAVE_DHD_MOSAIC: 'marine-heatwave-dhd-mosaic',
} as const;

export type ProductType = (typeof PRODUCT)[keyof typeof PRODUCT];

export type WebGlLayerProduct = Exclude<ProductType, typeof PRODUCT.WAVE_BUOYS>;

type ProductValue = {
  name: string;
  layerId: string;
  sourceId: string;
  bucketPath?: string;
};

export const PRODUCTS = {
  [PRODUCT.GSLA_OCEAN_GEOSTROPHIC_CURRENT]: {
    name: 'GSLA Ocean Geostrophic Current',
    layerId: 'gsla-particle-layer',
    sourceId: 'gsla-particle-source',
    bucketPath: 'ocean_current_gsla_ucur_vcur',
  },
  [PRODUCT.GSLA_ANOMALY_SEA_LEVELS]: {
    name: 'GSLA Anomaly Sea Levels',
    layerId: 'gsla-raster-layer',
    sourceId: 'gsla-raster-source',
    bucketPath: 'ocean_current_gsla_gsla',
  },
  [PRODUCT.WAVE_BUOYS]: {
    name: 'Wave Buoys',
    layerId: 'wave-buoys-layer',
    sourceId: 'wave-buoys-source',
  },
  [PRODUCT.SST_ANOMALY_MOSAIC]: {
    name: 'SST Anomaly Mosaic',
    layerId: 'sst-anom-mosaic-layer',
    sourceId: 'sst-anom-mosaic-source',
    bucketPath: 'austemp_sst_anomaly_sst_anom_mosaic',
  },
  [PRODUCT.MARINE_HEATWAVE_DHD_MOSAIC]: {
    name: 'Marine heatwave DHD Mosaic',
    layerId: 'marine-heatwave-dhd-mosaic-layer',
    sourceId: 'marine-heatwave-dhd-mosaic-source',
    bucketPath: 'ausTemp_marine_heatwave_aus_dhd_mosaic',
  },
  [PRODUCT.MARINE_HEATWAVE_SSTA_MOSAIC]: {
    name: 'Marine heatwave SSTA Mosaic',
    layerId: 'marine-heatwave-ssta-mosaic-layer',
    sourceId: 'marine-heatwave-ssta-mosaic-source',
    bucketPath: 'ausTemp_marine_heatwave_aus_ssta_mosaic',
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

export const PRODUCTLEGENDS = {
  [PRODUCT.GSLA_OCEAN_GEOSTROPHIC_CURRENT]: {
    label: 'ocean current speed (m/s)',
    colorKey: 'Particles' as ColorOptionKey,
    range: [0.01, MAX_VECTOR_SPEED],
    scale: 'log',
  },
  [PRODUCT.SST_ANOMALY_MOSAIC]: {
    scales: [-4, -2, 0, 2, 4],
    label: 'degrees Celsius (°C)',
    range: [-4, 4],
    colorKey: 'RdBu_r' as ColorOptionKey,
    scale: 'linear',
  },
  [PRODUCT.GSLA_ANOMALY_SEA_LEVELS]: {
    scales: [-1.2, -0.6, 0, 0.6, 1.2],
    label: 'sea level anomaly (m)',
    range: [-1.2, 1.2],
    colorKey: 'Anomaly Sea Level' as ColorOptionKey,
    scale: 'linear',
  },
  [PRODUCT.MARINE_HEATWAVE_DHD_MOSAIC]: {
    scales: [0, 35, 70, 105, 140, 175, 200],
    range: [0, 200],
    colorKey: 'RdBu_r' as ColorOptionKey,
    label: 'degrees Celsius (°C)',
    scale: 'linear',
  },
  [PRODUCT.MARINE_HEATWAVE_SSTA_MOSAIC]: {
    scales: [-4, -2, 0, 2, 4],
    label: 'degrees Celsius (°C)',
    range: [-4, 4],
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

export const HEATMAP_GROUP = [
  PRODUCT.GSLA_ANOMALY_SEA_LEVELS,
  PRODUCT.SST_ANOMALY_MOSAIC,
  PRODUCT.MARINE_HEATWAVE_DHD_MOSAIC,
  PRODUCT.MARINE_HEATWAVE_SSTA_MOSAIC,
] as const satisfies ProductType[];

export const GSLA_PARTICLE_LAYER_ID = PRODUCTS[PRODUCT.GSLA_OCEAN_GEOSTROPHIC_CURRENT].layerId;
export const GSLA_ANOMALY_LAYER_ID = PRODUCTS[PRODUCT.GSLA_ANOMALY_SEA_LEVELS].layerId;
export const SST_ANOMALY_MOSAIC_LAYER_ID = PRODUCTS[PRODUCT.SST_ANOMALY_MOSAIC].layerId;
export const MARINE_HEATWAVE_DHD_MOSAIC_LAYER_ID =
  PRODUCTS[PRODUCT.MARINE_HEATWAVE_DHD_MOSAIC].layerId;
export const MARINE_HEATWAVE_SSTA_MOSAIC_LAYER_ID =
  PRODUCTS[PRODUCT.MARINE_HEATWAVE_SSTA_MOSAIC].layerId;
export const WAVE_BUOYS_LAYER_ID = PRODUCTS[PRODUCT.WAVE_BUOYS].layerId;
export const WAVE_BUOYS_SOURCE_ID = PRODUCTS[PRODUCT.WAVE_BUOYS].sourceId;

export type BuoySource = typeof WAVE_BUOYS_SOURCE_ID;
export type BuoyLayer = typeof WAVE_BUOYS_LAYER_ID;
