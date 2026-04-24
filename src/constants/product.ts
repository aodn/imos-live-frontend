/**
 * this is the single truth of all the products in this project, and
 * the single truth of product's layerId, sourceId.
 */
import speedColors from '../config/speed_colormap.json' with { type: 'json' };
import { convertLinearColorScaleToRamp, convertLogColorScaleToRamp } from '@/components';
import anomalySeaLevelColorMap from '@/config/anomaly_sea_level_colormap.json';
import type { ColorPalette } from '@/layers';

export const rdBuR: { colors: [number, number, number][] } = {
  colors: [
    [0.02, 0.188, 0.38], // dark blue
    [0.094, 0.31, 0.635],
    [0.22, 0.478, 0.745],
    [0.396, 0.647, 0.82],
    [0.62, 0.788, 0.882],
    [0.82, 0.898, 0.941],
    [0.969, 0.969, 0.969], // near white (centre)
    [0.992, 0.859, 0.78],
    [0.957, 0.694, 0.545],
    [0.89, 0.49, 0.337],
    [0.776, 0.275, 0.224],
    [0.62, 0.102, 0.118],
    [0.403, 0.0, 0.122], // dark red
  ],
};

export const gslaOverlayImageColors = anomalySeaLevelColorMap as [number, number, number][];

export const PRODUCT = {
  GSLA_OCEAN_GEOSTROPHIC_CURRENT: 'gsla-ocean-geostrophic-current',
  GSLA_ANOMALY_SEA_LEVELS: 'gsla-anomaly-sea-levels',
  GSLA_ANOMALY_SEA_LEVELS_WEBGL: 'gsla-anomaly-sea-levels-webgl',
  WAVE_BUOYS: 'wave-buoys',
  SST_ANOMALY_MOSAIC: 'sst-anom-mosaic',
  SST_ANOM_MOSAIC_WEBGL: 'sst-anom-mosaic-webgl',
} as const;

export type ProductType = (typeof PRODUCT)[keyof typeof PRODUCT];

export type WebGlLayerProduct = Exclude<
  ProductType,
  | typeof PRODUCT.WAVE_BUOYS
  | typeof PRODUCT.GSLA_ANOMALY_SEA_LEVELS
  | typeof PRODUCT.SST_ANOMALY_MOSAIC
>;

type ProductValue = {
  name: string;
  layerId: string;
  sourceId: string;
  bucketPath?: string;
};

export const GSLA_META_NAME = 'gsla_meta.json';
export const GSLA_DATA_NAME = 'gsla_data.json';

export const PRODUCTS = {
  [PRODUCT.GSLA_OCEAN_GEOSTROPHIC_CURRENT]: {
    name: 'GSLA Ocean Geostrophic Current',
    layerId: 'gsla-particle-layer',
    sourceId: 'gsla-particle-source',
    bucketPath: 'ocean_current_gsla_ucur_vcur',
  },
  [PRODUCT.SST_ANOM_MOSAIC_WEBGL]: {
    name: 'SST Anomaly Mosaic (WebGL)',
    layerId: 'sst-anom-mosaic-webgl-layer',
    sourceId: 'sst-anom-mosaic-webgl-source',
    bucketPath: 'austemp_sst_anomaly_sst_anom_mosaic',
  },
  [PRODUCT.GSLA_ANOMALY_SEA_LEVELS_WEBGL]: {
    name: 'GSLA Anomaly Sea Levels (WebGL)',
    layerId: 'gsla-anomaly-sea-levels-webgl-layer',
    sourceId: 'gsla-anomaly-sea-levels-webgl-source',
    bucketPath: 'ocean_current_gsla_gsla',
  },
  [PRODUCT.GSLA_ANOMALY_SEA_LEVELS]: {
    name: 'GSLA Anomaly Sea Levels',
    layerId: 'gsla-raster-layer',
    sourceId: 'gsla-raster-source',
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
    colors: speedColors as [number, number, number][],
    min: 0.01,
    max: MAX_VECTOR_SPEED,
    range: [0.01, MAX_VECTOR_SPEED],
  },
  [PRODUCT.GSLA_ANOMALY_SEA_LEVELS]: {
    scales: [-1.2, -0.5, -0.2, -0.1, 0, 0.1, 0.2, 0.5, 1.2],
    label: 'sea level anomaly (m)',
    range: [-1.2, 1.2],
  },
  [PRODUCT.SST_ANOMALY_MOSAIC]: {
    scales: [-4, -2, 0, 2, 4],
    label: 'degrees Celsius (°C)',
    range: [-4, 4],
  },
  [PRODUCT.SST_ANOM_MOSAIC_WEBGL]: {
    scales: [-4, -2, 0, 2, 4],
    label: 'degrees Celsius (°C)',
    range: [-4, 4],
    colors: rdBuR.colors,
    min: -4,
    max: 4,
    numStops: 256,
    threshold: 0.1,
  },
  [PRODUCT.GSLA_ANOMALY_SEA_LEVELS_WEBGL]: {
    scales: [-1.2, -0.5, -0.2, -0.1, 0, 0.1, 0.2, 0.5, 1.2],
    label: 'sea level anomaly (m)',
    range: [-1.2, 1.2],
    min: -1.2,
    max: 1.2,
    numStops: 256,
    colors: anomalySeaLevelColorMap as [number, number, number][],
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
  [PRODUCT.GSLA_ANOMALY_SEA_LEVELS_WEBGL]: {
    name: 'linear RdBu_r Sea Level Anomaly',
    colors: convertLinearColorScaleToRamp(PRODUCTLEGENDS[PRODUCT.GSLA_ANOMALY_SEA_LEVELS_WEBGL]),
  },
  [PRODUCT.SST_ANOM_MOSAIC_WEBGL]: {
    name: 'linear RdBu_r SST',
    colors: convertLinearColorScaleToRamp(PRODUCTLEGENDS[PRODUCT.SST_ANOM_MOSAIC_WEBGL]),
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
