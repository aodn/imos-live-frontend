/**
 * Single source of truth for product identities — slugs, layer IDs, source IDs,
 * and the variables each product carries. Legend metadata for each product
 * lives in `./legends`; palette data lives in `./colors`.
 */

export const PRODUCT = {
  GSLA_OCEAN_GEOSTROPHIC_CURRENT: 'model_sea_level_anomaly_gridded_realtime_vcur_ucur',
  GSLA_ANOMALY_SEA_LEVELS: 'model_sea_level_anomaly_gridded_realtime_gsla',
  AUSTEMP_HEATWAVE_SSTA_MOSAIC: 'satellite_austemp_heatwave_8day_ssta_mosaic',
  AUSTEMP_HEATWAVE_SST_MOSAIC: 'satellite_austemp_heatwave_8day_sst_mosaic',
  AUSTEMP_HEATWAVE_MCS_CATEGORY: 'satellite_austemp_heatwave_8day_mcs_category',
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
  [PRODUCT.AUSTEMP_HEATWAVE_MCS_CATEGORY]: {
    name: 'Austemp heatwave MCS Category',
    layerId: 'austemp-heatwave-mcs-category-layer',
    sourceId: 'austemp-heatwave-mcs-category-source',
    variables: ['MCS_category'],
  },
} as const satisfies Record<ProductType, ProductValue>;

export const MAX_VECTOR_SPEED = 3.0 as const;

export type ProductName = (typeof PRODUCTS)[ProductType]['name'];
export type BuoyLayer = (typeof PRODUCTS)[typeof PRODUCT.WAVE_BUOYS]['layerId'];
export type BuoySource = (typeof PRODUCTS)[typeof PRODUCT.WAVE_BUOYS]['sourceId'];

export const TILES_GROUP = [
  PRODUCT.GSLA_ANOMALY_SEA_LEVELS,
  PRODUCT.AUSTEMP_HEATWAVE_SST_MOSAIC,
  PRODUCT.AUSTEMP_HEATWAVE_SSTA_MOSAIC,
  PRODUCT.AUSTEMP_HEATWAVE_MCS_CATEGORY,
] as const satisfies TilesProduct[];
