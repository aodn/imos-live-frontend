export const PARTICLE_LAYER_ID = 'gsla-particle-layer';
export const PARTICLE_SOURCE_ID = 'gsla-particle-source';
export const OVERLAY_LAYER_ID = 'gsla-overlay-layer';
export const GSLA_OVERLAY_SOURCE_ID = 'gsla-overlay-source';
export const SST_ANOMALY_MOSAIC_OVERLAY_SOURCE_ID = 'sst-anom-mosaic-source';

export type OverlaySource =
  | typeof GSLA_OVERLAY_SOURCE_ID
  | typeof SST_ANOMALY_MOSAIC_OVERLAY_SOURCE_ID;

export const WAVE_BUOYS_LAYER_ID = 'wave-buoys-layer';
export const WAVE_BUOYS_SOURCE_ID = 'wave-buoys-source';
export const WAVE_BUOYS_CLUSTER_LABEL_LAYER_ID = 'wave-buoys-cluster-label-layer';
export const UNCLUSTERED_WAVE_BUOYS_LAYER_ID = 'unclustered_wave-buoys-layer';

export const SST_ANOMALY_MOSAIC_LAYER_ID = 'sst-anom-mosaic-layer';

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

export const GSLA_OCEAN_GEOSTROPHIC_CURRENT_PRODUCT_VARIANT = 'gsla-ocean-geostrophic-current';
export const GSLA_ANOMALY_SEA_LEVELS_PRODUCT_VARIANT = 'gsla-anomaly-sea-levels';
export const WAVE_BUOYS_PRODUCT_VARIANT = 'wave-buoys';
export const SST_ANOMALY_MOSAIC_PRODUCT_VARIANT = 'sst-anom-mosaic';
