/**
 * this is the single truth of all the products in this project, and
 * the single truth of product's layerId, sourceId.
 */
export const Product = {
  GSLA_OCEAN_GEOSTROPHIC_CURRENT: 'gsla-ocean-geostrophic-current',
  GSLA_ANOMALY_SEA_LEVELS: 'gsla-anomaly-sea-levels',
  WAVE_BUOYS: 'wave-buoys',
  SST_ANOMALY_MOSAIC: 'sst-anom-mosaic',
} as const;

export type Product = (typeof Product)[keyof typeof Product];

type ProductValue = {
  name: string;
  layerId: string;
  sourceId: string;
};

export const Products = {
  [Product.GSLA_OCEAN_GEOSTROPHIC_CURRENT]: {
    name: 'GSLA Ocean Geostrophic Current',
    layerId: 'gsla-particle-layer',
    sourceId: 'gsla-particle-source',
  },
  [Product.GSLA_ANOMALY_SEA_LEVELS]: {
    name: 'GSLA Anomaly Sea Levels',
    layerId: 'gsla-overlay-layer',
    sourceId: 'gsla-overlay-source',
  },
  [Product.WAVE_BUOYS]: {
    name: 'Wave Buoys',
    layerId: 'wave-buoys-layer',
    sourceId: 'wave-buoys-source',
  },
  [Product.SST_ANOMALY_MOSAIC]: {
    name: 'SST Anomaly Mosaic',
    layerId: 'sst-anom-mosaic-layer',
    sourceId: 'sst-anom-mosaic-source',
  },
} as const satisfies Record<Product, ProductValue>;

export type ProductLayerId = (typeof Products)[Product]['layerId'];
export type ProductSourceId = (typeof Products)[Product]['sourceId'];

export const sourceIdToProduct = (sourceId: ProductSourceId) => {
  return Object.entries(Products).find(([, v]) => v.sourceId === sourceId)?.[0] as Product;
};

export const layerIdToProduct = (layerId: ProductLayerId) => {
  return Object.entries(Products).find(([, v]) => v.layerId === layerId)?.[0] as Product;
};
