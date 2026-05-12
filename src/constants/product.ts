/**
 * this is the single truth of all the products in this project, and
 * the single truth of product's layerId, sourceId.
 */
import type { RasterDataType } from '@/helpers';
import speedColors from '../config/speed_colormap.json' with { type: 'json' };

export const PRODUCT = {
  GSLA_OCEAN_GEOSTROPHIC_CURRENT: 'gsla-ocean-geostrophic-current',
  GSLA_ANOMALY_SEA_LEVELS: 'gsla-anomaly-sea-levels',
  WAVE_BUOYS: 'wave-buoys',
  AUSTEMP_SSTA_MOSAIC: 'austemp-ssta-mosaic',
  AUSTEMP_DHD_MOSAIC: 'austemp-dhd-mosaic',
  AUSTEMP_SST_MOSAIC: 'austemp-sst-mosaic',
  AUSTEMP_MHW_CATEGORY_MOSAIC: 'austemp-mhw-category-mosaic',
} as const;

export type ProductType = (typeof PRODUCT)[keyof typeof PRODUCT];

type ProductValue = {
  name: string;
  layerId: string;
  sourceId: string;
  dataType?: RasterDataType;
  // categorical means the data in the grid dataset is in category. Each data point value can only be like 0,1,2,3,4. We cannot have COLORSCALERANGE and configed styles passed to the WMS service, which is not supported. It only has the default-categorical style.
  // https://reading-escience-centre.gitbooks.io/ncwms-user-guide/content/05-data_formats.html#categorical
  // continous is the normal one, each data point can be any number
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
    dataType: 'continous',
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
    dataType: 'continous',
  },
  [PRODUCT.AUSTEMP_DHD_MOSAIC]: {
    name: 'AusTemp DHD Mosaic',
    layerId: 'austemp-dhd-mosaic-layer',
    sourceId: 'austemp-dhd-mosaic-source',
    dataType: 'continous',
  },
  [PRODUCT.AUSTEMP_SST_MOSAIC]: {
    name: 'AusTemp SST Mosaic',
    layerId: 'austemp-sst-mosaic-layer',
    sourceId: 'austemp-sst-mosaic-source',
    dataType: 'continous',
  },
  [PRODUCT.AUSTEMP_MHW_CATEGORY_MOSAIC]: {
    name: 'AusTemp MHW category mosaic',
    layerId: 'austemp-mhw-category-mosaic-layer',
    sourceId: 'austemp-mhw-category-mosaic-source',
    dataType: 'categorical',
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
export type CategoryLegendArgs = {
  colors: string[];
  labels: string[];
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
    numStops: 256,
    colors: speedColors as [number, number, number][],
    min: 0.01,
    max: MAX_VECTOR_SPEED,
  },
  [PRODUCT.GSLA_ANOMALY_SEA_LEVELS]: {
    scales: [-1.2, -0.8, -0.4, 0, 0.4, 0.8, 1.2],
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
    scales: [0, 35, 70, 105, 140, 175, 200],
    min: 0,
    max: 200,
    colors: 'div-RdBu-inv',
    label: 'degrees Celsius (°C)',
  },
  [PRODUCT.AUSTEMP_SST_MOSAIC]: {
    scales: [0, 10, 20, 30, 40, 50],
    min: 0,
    max: 50,
    colors: 'x-Sst',
    label: 'degrees Celsius (°C)',
  },
  [PRODUCT.AUSTEMP_MHW_CATEGORY_MOSAIC]: {
    colors: MHW_CATEGORY_LEGEND_COLORS,
    labels: HW_CATEGORY_LEGEND_LABELS,
    label: '',
  },
} as const satisfies Record<
  Exclude<ProductType, 'wave-buoys'>,
  VectorLegendArgs | RasterLegendArgs | CategoryLegendArgs
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
