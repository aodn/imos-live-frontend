// Narrow, explicit barrel — no `export *`. Add an entry here when a new symbol
// becomes part of the public constants surface.

// Products
export {
  PRODUCT,
  PRODUCTS,
  MAX_VECTOR_SPEED,
  TILES_GROUP,
  SCALAR_TILES_GROUP,
  extractProductVariables,
} from './products';
export type {
  ProductType,
  TilesProduct,
  ParticleTilesProduct,
  ScalarTilesProduct,
  SiteProduct,
  ProductName,
  BuoyLayer,
  BuoySource,
  MooringLayer,
  MooringSource,
} from './products';

// Legends
export { PRODUCTLEGENDS, HW_CATEGORY_LOOKUP, HW_CATEGORY_LEGEND_SCALES } from './legends';
export type { LegendArgs } from './legends';

// LOD zoom-activation thresholds
export { LOD_ZOOM_THRESHOLDS } from './lodZoomThresholds';

// Colors / palettes
export {
  rdBuR,
  x_rainbow,
  ocean_to_terrain,
  MHW_CATEGORY_LEGEND_COLORS,
  COLOR_OPTIONS,
  CONTINOUS_PRODUCT_COLOR_OPTIONS,
} from './colors';
export type { ColorOptionKey, ContinuousDataColorOptionKey } from './colors';

// Layer / source ID strings
export {
  WAVE_BUOYS_CLUSTER_LABEL_LAYER_ID,
  UNCLUSTERED_WAVE_BUOYS_LAYER_ID,
  MOORING_CLUSTER_LABEL_LAYER_ID,
  UNCLUSTERED_MOORING_LAYER_ID,
  ZOOM_LIMIT_TEMP_POINTS_SOURCE_ID,
  ZOOM_LIMIT_TEMP_POINTS_CONNECTION_LINES_SOURCE_ID,
  ZOOM_LIMIT_TEMP_POINTS_LAYER_ID,
  ZOOM_LIMIT_TEMP_POINTS_CONNECTION_LINES_LAYER_ID,
  MEASURE_POINTS_LAYER_ID,
  MEASURE_POINTS_SOURCE_ID,
  MEASURE_LINES_LAYER_ID,
  MEASURE_LINES_SOURCE_ID,
  WORLD_LAND_SOURCE_ID,
  WORLD_LAND_BORDER_LAYER_ID,
  WORLD_LAND_FILL_LAYER_ID,
} from './layerIds';

// Mapbox layer paint/layout specs
export {
  WAVE_BUOYS_LAYER_CONFIG,
  UNCLUSTERED_WAVE_BUOYS_LAYER_CONFIG,
  WAVE_BUOY_CLUSTER_LABEL_LAYER_CONFIG,
  MOORING_LAYER_CONFIG,
  UNCLUSTERED_MOORING_LAYER_CONFIG,
  ZOOM_LIMIT_TEMPPOINT_LAYER_PARTIAL,
  ZOOM_LIMIT_TEMP_CONNECTION_LINES_LAYER_PARTIAL,
  MEASURE_POINT_CONFIG,
  MEASURE_LINES_CONFIG,
  WORLD_LAND_BORDER_CONFIG,
  WORLD_LAND_FILL_CONFIG,
} from './layerSpecs';

// Render-order registry
export { LAYERS_ORDER } from './layerOrder';

// Initial map state + map-related numeric thresholds
export {
  CLUSTER_MAX_ZOOM,
  MAX_ZOOM,
  INITIAL_ZOOM,
  INITIAL_STYLE,
  INITIAL_CENTER,
  DATE_RANGE,
  INITIAL_DATE,
  INITIAL_WORLD_BOUNDARIES_ENABLED,
  INITIAL_DISTANCE_MEASUREMENT_ENABLED,
  QUERY_DATE_RANGE,
  MIN_EXPORT_MAP_WIDTH,
  INITIAL_PRODUCT_ENABLED,
  INITIAL_PRODUCT_ERROR,
  INITIAL_PRODUCT_LOADING,
  INITIAL_PARTICLE_CONFIG,
} from './mapInitialState';

// Viewport
export { BREAKPOINT } from './layout';
