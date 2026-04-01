/**
 * this is the single truth of all the products in this project, and
 * the single truth of product's layerId, sourceId.
 */
import speedColors from '../config/speed_colormap.json' with { type: 'json' };

export const PRODUCT = {
  GSLA_OCEAN_GEOSTROPHIC_CURRENT: 'gsla-ocean-geostrophic-current',
  GSLA_ANOMALY_SEA_LEVELS: 'gsla-anomaly-sea-levels',
  WAVE_BUOYS: 'wave-buoys',
  SST_ANOMALY_MOSAIC: 'sst-anom-mosaic',
} as const;

export type ProductType = (typeof PRODUCT)[keyof typeof PRODUCT];

type ProductValue = {
  name: string;
  layerId: string;
  sourceId: string;
};

export const PRODUCTS = {
  [PRODUCT.GSLA_OCEAN_GEOSTROPHIC_CURRENT]: {
    name: 'GSLA Ocean Geostrophic Current',
    layerId: 'gsla-particle-layer',
    sourceId: 'gsla-particle-source',
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
};
export type RasterLegendArgs = {
  scales?: number[];
  label: string;
};

export const PRODUCTLEGENDS = {
  [PRODUCT.GSLA_OCEAN_GEOSTROPHIC_CURRENT]: {
    label: 'ocean current speed (m/s)',
    numStops: 256,
    colors: speedColors as [number, number, number][],
    min: 0.01,
    max: MAX_VECTOR_SPEED,
  },
  [PRODUCT.GSLA_ANOMALY_SEA_LEVELS]: {
    scales: [-1.2, -0.5, -0.2, -0.1, 0, 0.1, 0.2, 0.5, 1.2],
    label: 'sea level anomaly (m)',
  },
  [PRODUCT.SST_ANOMALY_MOSAIC]: {
    scales: [-4, -2, 0, 2, 4],
    label: 'degrees Celsius (°C)',
  },
} as const satisfies Record<
  Exclude<ProductType, 'wave-buoys'>,
  VectorLegendArgs | RasterLegendArgs
>;

export type ProductLayerId = (typeof PRODUCTS)[ProductType]['layerId'];
export type ProductSourceId = (typeof PRODUCTS)[ProductType]['sourceId'];
export type ProductName = (typeof PRODUCTS)[ProductType]['name'];

export const sourceIdToProduct = (sourceId: ProductSourceId) => {
  return Object.entries(PRODUCTS).find(([, v]) => v.sourceId === sourceId)?.[0] as ProductType;
};

export const layerIdToProduct = (layerId: ProductLayerId) => {
  return Object.entries(PRODUCTS).find(([, v]) => v.layerId === layerId)?.[0] as ProductType;
};
