/**
 * this is the single truth of all the products in this project, and
 * the single truth of product's layerId, sourceId.
 */
import speedColors from '../config/speed_colormap.json' with { type: 'json' };

export const PRODUCT = {
  GSLA_OCEAN_GEOSTROPHIC_CURRENT: 'gsla-ocean-geostrophic-current',
  GSLA_ANOMALY_SEA_LEVELS: 'gsla-anomaly-sea-levels',
  WAVE_BUOYS: 'wave-buoys',
  AUSTEMP_SSTA_MOSAIC: 'austemp-ssta-mosaic',
  AUSTEMP_DHD_MOSAIC: 'austemp-dhd-mosaic',
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
  [PRODUCT.AUSTEMP_SSTA_MOSAIC]: {
    name: 'AusTemp SSTA Mosaic',
    layerId: 'austemp-ssta-mosaic-layer',
    sourceId: 'austemp-ssta-mosaic-source',
  },
  [PRODUCT.AUSTEMP_DHD_MOSAIC]: {
    name: 'AusTemp DHD Mosaic',
    layerId: 'austemp-dhd-mosaic-layer',
    sourceId: 'austemp-dhd-mosaic-source',
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
  colors: string;
  min: number;
  max: number;
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
    min: -1.2,
    max: 1.2,
    colors: 'x-Rainbow',
    label: 'sea level anomaly (m)',
  },
  [PRODUCT.AUSTEMP_SSTA_MOSAIC]: {
    scales: [-4, -2, 0, 2, 4],
    min: -4,
    max: 4,
    colors: 'div-RdBu-inv',
    label: 'degrees Celsius (°C)',
  },
  [PRODUCT.AUSTEMP_DHD_MOSAIC]: {
    scales: [0, 25, 50, 75, 100], //TODO: confirm the scale values for DHD anomaly mosaic
    min: 0,
    max: 100,
    colors: 'div-RdBu-inv',
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
