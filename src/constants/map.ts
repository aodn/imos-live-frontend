import type { ProductSourceId, ProductType } from './product';
import { PRODUCTS, PRODUCT } from './product';

//product layer id and source id, keep single truth from: import { PRODUCTS } from "./product";
export const GSLA_PARTICLE_LAYER_ID = PRODUCTS['gsla-ocean-geostrophic-current'].layerId;
export const GSLA_PARTICLE_SOURCE_ID = PRODUCTS['gsla-ocean-geostrophic-current'].sourceId;
export const GSLA_RASTER_LAYER_ID = PRODUCTS['gsla-anomaly-sea-levels'].layerId;
export const GSLA_RASTER_SOURCE_ID = PRODUCTS['gsla-anomaly-sea-levels'].sourceId;
export const AUSTEMP_SSTA_MOSAIC_RASTER_SOURCE_ID = PRODUCTS['austemp-ssta-mosaic'].sourceId;
export const AUSTEMP_SSTA_MOSAIC_RASTER_LAYER_ID = PRODUCTS['austemp-ssta-mosaic'].layerId;
export const AUSTEMP_DHD_MOSAIC_RASTER_SOURCE_ID = PRODUCTS['austemp-dhd-mosaic'].sourceId;
export const AUSTEMP_DHD_MOSAIC_RASTER_LAYER_ID = PRODUCTS['austemp-dhd-mosaic'].layerId;
export const AUSTEMP_SST_MOSAIC_RASTER_SOURCE_ID = PRODUCTS['austemp-sst-mosaic'].sourceId;
export const AUSTEMP_SST_MOSAIC_RASTER_LAYER_ID = PRODUCTS['austemp-sst-mosaic'].layerId;
export const AUSTEMP_MHW_CATEGORY_MOSAIC_RASTER_SOURCE_ID =
  PRODUCTS['austemp-mhw-category-mosaic'].sourceId;
export const AUSTEMP_MHW_CATEGORY_MOSAIC_RASTER_LAYER_ID =
  PRODUCTS['austemp-mhw-category-mosaic'].layerId;
export const WAVE_BUOYS_LAYER_ID = PRODUCTS['wave-buoys'].layerId;
export const WAVE_BUOYS_SOURCE_ID = PRODUCTS['wave-buoys'].sourceId;

export const ProductSourceIds: ProductSourceId[] = [
  GSLA_PARTICLE_SOURCE_ID,
  GSLA_RASTER_SOURCE_ID,
  AUSTEMP_SSTA_MOSAIC_RASTER_SOURCE_ID,
  AUSTEMP_DHD_MOSAIC_RASTER_SOURCE_ID,
  WAVE_BUOYS_SOURCE_ID,
];

export const RasterProductSourceIds: RasterSource[] = [
  GSLA_RASTER_SOURCE_ID,
  AUSTEMP_SSTA_MOSAIC_RASTER_SOURCE_ID,
  AUSTEMP_DHD_MOSAIC_RASTER_SOURCE_ID,
];

export type RasterLayer =
  | typeof GSLA_RASTER_LAYER_ID
  | typeof AUSTEMP_SSTA_MOSAIC_RASTER_LAYER_ID
  | typeof AUSTEMP_DHD_MOSAIC_RASTER_LAYER_ID
  | typeof AUSTEMP_SST_MOSAIC_RASTER_LAYER_ID
  | typeof AUSTEMP_MHW_CATEGORY_MOSAIC_RASTER_LAYER_ID;

export type RasterSource =
  | typeof GSLA_RASTER_SOURCE_ID
  | typeof AUSTEMP_SSTA_MOSAIC_RASTER_SOURCE_ID
  | typeof AUSTEMP_DHD_MOSAIC_RASTER_SOURCE_ID
  | typeof AUSTEMP_SST_MOSAIC_RASTER_SOURCE_ID
  | typeof AUSTEMP_MHW_CATEGORY_MOSAIC_RASTER_SOURCE_ID;

export type BuoySource = typeof WAVE_BUOYS_SOURCE_ID;
export type BuoyLayer = typeof WAVE_BUOYS_LAYER_ID;

export type ParticleLayer = typeof GSLA_PARTICLE_LAYER_ID;
export type ParticleSource = typeof GSLA_PARTICLE_SOURCE_ID;

export const isRasterProduct = (product: ProductType) =>
  product === PRODUCT.GSLA_ANOMALY_SEA_LEVELS ||
  product === PRODUCT.AUSTEMP_SSTA_MOSAIC ||
  product === PRODUCT.AUSTEMP_DHD_MOSAIC ||
  product === PRODUCT.AUSTEMP_SST_MOSAIC ||
  product === PRODUCT.AUSTEMP_MHW_CATEGORY_MOSAIC;

export const isGeostrophicCurrentProduct = (product: ProductType) =>
  product === PRODUCT.GSLA_OCEAN_GEOSTROPHIC_CURRENT;
export const isWaveBuoyProduct = (product: ProductType) => product === PRODUCT.WAVE_BUOYS;

export const isProductSourceId = (id: string): id is ProductSourceId =>
  ProductSourceIds.includes(id as ProductSourceId);

export const isRasterSourceId = (id: string): id is RasterSource =>
  RasterProductSourceIds.includes(id as RasterSource);

// these two are intermediate layer on fly
export const WAVE_BUOYS_CLUSTER_LABEL_LAYER_ID = 'wave-buoys-cluster-label-layer';
export const UNCLUSTERED_WAVE_BUOYS_LAYER_ID = 'unclustered_wave-buoys-layer';

export const ZOOM_LIMIT_TEMP_POINTS_SOURCE_ID = 'zoom-limit-temp-points-source';
export const ZOOM_LIMIT_TEMP_POINTS_CONNECTION_LINES_SOURCE_ID =
  'zoom-limit-temp-points-connection-lines-source';
export const ZOOM_LIMIT_TEMP_POINTS_LAYER_ID = 'zoom-limit-temp-points-layer';
export const ZOOM_LIMIT_TEMP_POINTS_CONNECTION_LINES_LAYER_ID =
  'zoom-limit-temp-points-connection-lines-layer';

//measure points layer and measure lines layer share the same source
export const MEASURE_POINTS_LAYER_ID = 'measure-points-layer';
export const MEASURE_POINTS_SOURCE_ID = 'measure-points-source';
export const MEASURE_LINES_LAYER_ID = 'measure-lines-layer';
export const MEASURE_LINES_SOURCE_ID = MEASURE_POINTS_SOURCE_ID;

export const GSLA_SEA_LEVEL_NAME = 'gsla_overlay.png';
export const GSLA_PARTICLE_NAME = 'gsla_input.png';
export const GSLA_META_NAME = 'gsla_meta.json';
export const GSLA_DATA_NAME = 'gsla_data.json';

//land border
export const WORLD_LAND_SOURCE_ID = 'world-land-source';
export const WORLD_LAND_BORDER_LAYER_ID = 'world-land-border-layer';
export const WORLD_LAND_FILL_LAYER_ID = 'world-land-fill-layer';
