/**
 * this is the single truth of all the products in this project, and
 * the single truth of product's layerId, sourceId.
 */
import { convertLinearColorScaleToRamp, convertLogColorScaleToRamp } from '@/components';
import { rdBuR, particles, anomalySeaLevel } from '@/config/colorPalettes';
import type { ColorPalette } from '@/layers';

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

export type VectorLegendArgs = {
  label: string;
  numStops?: number;
  colors?: [number, number, number][];
  min?: number;
  max?: number;
  range?: [number, number];
  threshold?: number;
};
export type RasterLegendArgs = {
  scales?: number[];
  label: string;
  range?: [number, number];
};

export const PRODUCTLEGENDS = {
  [PRODUCT.GSLA_OCEAN_GEOSTROPHIC_CURRENT]: {
    label: 'ocean current speed (m/s)',
    numStops: 256,
    colors: particles.colors as [number, number, number][],
    min: 0.01,
    max: MAX_VECTOR_SPEED,
    range: [0.01, MAX_VECTOR_SPEED],
  },
  [PRODUCT.SST_ANOMALY_MOSAIC]: {
    scales: [-4, -2, 0, 2, 4],
    label: 'degrees Celsius (°C)',
    range: [-4, 4],
    colors: rdBuR.colors,
    min: -4,
    max: 4,
    numStops: 256,
  },
  [PRODUCT.GSLA_ANOMALY_SEA_LEVELS]: {
    scales: [-1.2, -0.6, 0, 0.6, 1.2],
    label: 'sea level anomaly (m)',
    range: [-1.2, 1.2],
    min: -1.2,
    max: 1.2,
    numStops: 256,
    colors: anomalySeaLevel.colors as [number, number, number][],
  },
  [PRODUCT.MARINE_HEATWAVE_DHD_MOSAIC]: {
    scales: [0, 35, 70, 105, 140, 175, 200],
    min: 0,
    max: 200,
    range: [0, 200],
    colors: rdBuR.colors,
    label: 'degrees Celsius (°C)',
    numStops: 256,
  },
  [PRODUCT.MARINE_HEATWAVE_SSTA_MOSAIC]: {
    scales: [-4, -2, 0, 2, 4],
    label: 'degrees Celsius (°C)',
    range: [-4, 4],
    colors: rdBuR.colors,
    min: -4,
    max: 4,
    numStops: 256,
  },
} as const satisfies Record<
  Exclude<ProductType, 'wave-buoys'>,
  VectorLegendArgs | RasterLegendArgs
>;

export const PRODUCTCOLORPALETTES = {
  [PRODUCT.GSLA_OCEAN_GEOSTROPHIC_CURRENT]: {
    name: 'linear Viridis Ocean Current',
    colors: convertLogColorScaleToRamp(PRODUCTLEGENDS[PRODUCT.GSLA_OCEAN_GEOSTROPHIC_CURRENT]),
  },
  [PRODUCT.GSLA_ANOMALY_SEA_LEVELS]: {
    name: 'linear RdBu_r Sea Level Anomaly',
    colors: convertLinearColorScaleToRamp(PRODUCTLEGENDS[PRODUCT.GSLA_ANOMALY_SEA_LEVELS]),
  },
  [PRODUCT.SST_ANOMALY_MOSAIC]: {
    name: 'linear RdBu_r SST',
    colors: convertLinearColorScaleToRamp(PRODUCTLEGENDS[PRODUCT.SST_ANOMALY_MOSAIC]),
  },
  [PRODUCT.MARINE_HEATWAVE_DHD_MOSAIC]: {
    name: 'linear RdBu_r SST',
    colors: convertLinearColorScaleToRamp(PRODUCTLEGENDS[PRODUCT.MARINE_HEATWAVE_DHD_MOSAIC]),
  },
  [PRODUCT.MARINE_HEATWAVE_SSTA_MOSAIC]: {
    name: 'linear RdBu_r SST',
    colors: convertLinearColorScaleToRamp(PRODUCTLEGENDS[PRODUCT.MARINE_HEATWAVE_SSTA_MOSAIC]),
  },
} as const satisfies Record<WebGlLayerProduct, ColorPalette>;

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
