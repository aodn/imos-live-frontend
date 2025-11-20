import { Products, ProductSourceId } from './product';

//product layer id and source id, keep single truth from: import { Products } from "./product";
export const PARTICLE_LAYER_ID = Products['gsla-ocean-geostrophic-current'].layerId;
export const PARTICLE_SOURCE_ID = Products['gsla-ocean-geostrophic-current'].sourceId;
export const GSLA_OVERLAY_LAYER_ID = Products['gsla-anomaly-sea-levels'].layerId;
export const GSLA_OVERLAY_SOURCE_ID = Products['gsla-anomaly-sea-levels'].sourceId;
export const SST_ANOMALY_MOSAIC_OVERLAY_SOURCE_ID = Products['sst-anom-mosaic'].sourceId;
export const SST_ANOMALY_MOSAIC_OVERLAY_LAYER_ID = Products['sst-anom-mosaic'].layerId;
export const WAVE_BUOYS_LAYER_ID = Products['wave-buoys'].layerId;
export const WAVE_BUOYS_SOURCE_ID = Products['wave-buoys'].sourceId;

export const ProductSourceIds: ProductSourceId[] = [
  PARTICLE_SOURCE_ID,
  GSLA_OVERLAY_SOURCE_ID,
  SST_ANOMALY_MOSAIC_OVERLAY_SOURCE_ID,
  WAVE_BUOYS_SOURCE_ID,
];

export const isProductSourceId = (id: string): id is ProductSourceId =>
  ProductSourceIds.includes(id as ProductSourceId);

// these two are intermediate layer on fly
export const WAVE_BUOYS_CLUSTER_LABEL_LAYER_ID = 'wave-buoys-cluster-label-layer';
export const UNCLUSTERED_WAVE_BUOYS_LAYER_ID = 'unclustered_wave-buoys-layer';

export type OverlaySource =
  | typeof GSLA_OVERLAY_SOURCE_ID
  | typeof SST_ANOMALY_MOSAIC_OVERLAY_SOURCE_ID;

export type OverlayLayer =
  | typeof GSLA_OVERLAY_LAYER_ID
  | typeof SST_ANOMALY_MOSAIC_OVERLAY_LAYER_ID;

export type BuoySource = typeof WAVE_BUOYS_SOURCE_ID;
export type BuoyLayer = typeof WAVE_BUOYS_LAYER_ID;

export type ParticleLayer = typeof PARTICLE_LAYER_ID;
export type ParticleSource = typeof PARTICLE_SOURCE_ID;

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
