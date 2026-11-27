import type {
  CircleLayerSpecification,
  FillLayerSpecification,
  LineLayerSpecification,
  SymbolLayerSpecification,
} from 'mapbox-gl';
import { PRODUCT, PRODUCTS } from './products';

// ---------- Layer / source IDs ----------
// All site products share one clustered source, so sites of any product group into the same cluster.
export const SITE_CLUSTER_SOURCE_ID = 'site-cluster-source';
export const SITE_CLUSTER_LAYER_ID = 'site-cluster-layer';
export const SITE_CLUSTER_LABEL_LAYER_ID = 'site-cluster-label-layer';

// wave buoys unclustered layer (intermediate, on the fly)
export const UNCLUSTERED_WAVE_BUOYS_LAYER_ID = 'unclustered_wave-buoys-layer';

// mooring unclustered layer
export const UNCLUSTERED_MOORING_LAYER_ID = 'unclustered_mooring-layer';

// estuarine & coastal mooring unclustered layer
export const UNCLUSTERED_ESTUARINE_MOORING_LAYER_ID = 'unclustered_mooring-estuarine-layer';

// triangle marker image id, used by `icon-image`
export const TRIANGLE_MARKER_IMAGE_ID = 'site-triangle-marker';

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

//land border
export const WORLD_LAND_SOURCE_ID = 'world-land-source';
export const WORLD_LAND_BORDER_LAYER_ID = 'world-land-border-layer';
export const WORLD_LAND_FILL_LAYER_ID = 'world-land-fill-layer';

//isobaths (depth contours), from Mapbox bathymetry tileset
export const ISOBATH_SOURCE_ID = 'isobath-source';
export const ISOBATH_LINE_LAYER_ID = 'isobath-line-layer';
export const ISOBATH_LABEL_LAYER_ID = 'isobath-label-layer';
export const ISOBATH_LABEL_SOURCE_ID = 'isobath-label-source';

// ---------- Layer specs ----------
// Site marker config. Its `type` decides circle or symbol.
export type SiteLayerConfig =
  | (Partial<CircleLayerSpecification> & Pick<CircleLayerSpecification, 'type'>)
  | (Partial<SymbolLayerSpecification> & Pick<SymbolLayerSpecification, 'type'>);

// One cluster style for every site product, so mixed clusters look the same.
export const SITE_CLUSTER_LAYER_CONFIG: SiteLayerConfig = {
  type: 'circle',
  filter: ['has', 'point_count'], // Only show clustered points
  paint: {
    'circle-color': [
      'step',
      ['get', 'point_count'],
      '#51bbd6', // Color for clusters with < 100 points
      100,
      '#f1f075', // Color for clusters with 100-750 points
      750,
      '#f28cb1', // Color for clusters with > 750 points
    ],
    'circle-radius': [
      'step',
      ['get', 'point_count'],
      20, // Radius for clusters with < 100 points
      100,
      30, // Radius for clusters with 100-750 points
      750,
      40, // Radius for clusters with > 750 points
    ],
  },
} as const;

export const UNCLUSTERED_WAVE_BUOYS_LAYER_CONFIG: SiteLayerConfig = {
  type: 'circle',
  filter: ['!', ['has', 'point_count']],
  paint: {
    'circle-color': [
      'case',
      ['boolean', ['feature-state', 'selected'], false],
      '#ffffff', // selected: white fill
      ['boolean', ['get', 'hasDataForDate'], true],
      '#11b4da', // active: blue
      '#aaaaaa', // inactive: gray
    ],
    'circle-opacity': [
      'case',
      ['boolean', ['get', 'hasDataForDate'], true],
      1, // active: solid
      1, // inactive: ghost — visible but clearly muted
    ],
    'circle-radius': [
      'case',
      ['boolean', ['feature-state', 'selected'], false],
      10, // slightly larger when selected
      8, // normal size
    ],
    'circle-stroke-width': [
      'case',
      ['boolean', ['feature-state', 'selected'], false],
      3, // thicker stroke when selected
      ['boolean', ['get', 'hasDataForDate'], true],
      2, // active: standard stroke
      2, // inactive: hairline
    ],
    'circle-stroke-color': [
      'case',
      ['boolean', ['get', 'hasDataForDate'], true],
      '#000000', // active: black
      '#000000', // inactive: muted blue
    ],
    'circle-stroke-opacity': ['case', ['boolean', ['get', 'hasDataForDate'], true], 1, 1],
    // Add smooth transitions
    'circle-radius-transition': {
      duration: 200,
      delay: 0,
    },
    'circle-stroke-width-transition': {
      duration: 200,
      delay: 0,
    },
  },
} as const;

export const SITE_CLUSTER_LABEL_LAYER_CONFIG: Partial<SymbolLayerSpecification> = {
  filter: ['has', 'point_count'],
  layout: {
    'text-field': '{point_count_abbreviated}',
    'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
    'text-size': 12,
  },
} as const;

export const UNCLUSTERED_MOORING_LAYER_CONFIG: SiteLayerConfig = {
  type: 'circle',
  filter: ['!', ['has', 'point_count']],
  paint: {
    'circle-color': [
      'case',
      ['boolean', ['feature-state', 'selected'], false],
      '#ffffff', // selected: white fill
      ['boolean', ['get', 'hasDataForDate'], true],
      '#f97316', // active: amber (distinct from wave-buoy blue)
      '#aaaaaa', // inactive: gray
    ],
    'circle-opacity': 1,
    'circle-radius': [
      'case',
      ['boolean', ['feature-state', 'selected'], false],
      10, // slightly larger when selected
      8, // normal size
    ],
    'circle-stroke-width': [
      'case',
      ['boolean', ['feature-state', 'selected'], false],
      3, // thicker stroke when selected
      2,
    ],
    'circle-stroke-color': '#000000',
    'circle-stroke-opacity': 1,
    // Add smooth transitions
    'circle-radius-transition': {
      duration: 200,
      delay: 0,
    },
    'circle-stroke-width-transition': {
      duration: 200,
      delay: 0,
    },
  },
} as const;

// Estuarine moorings use violet triangles, to stand out from the other site products.
// These symbol layers use the triangle image via `icon-image`.
const ESTUARINE_MOORING_COLOR = '#8b5cf6';

// Halo draws the outline. Selection can't resize icons, so it changes fill and outline.
export const UNCLUSTERED_ESTUARINE_MOORING_LAYER_CONFIG: SiteLayerConfig = {
  type: 'symbol',
  filter: ['!', ['has', 'point_count']],
  layout: {
    'icon-image': TRIANGLE_MARKER_IMAGE_ID,
    'icon-size': 1,
    'icon-allow-overlap': true,
    'icon-ignore-placement': true,
  },
  paint: {
    'icon-color': [
      'case',
      ['boolean', ['feature-state', 'selected'], false],
      '#ffffff', // selected: white fill
      ['boolean', ['get', 'hasDataForDate'], true],
      ESTUARINE_MOORING_COLOR, // active
      '#aaaaaa', // inactive: gray
    ],
    'icon-opacity': 1,
    'icon-halo-color': '#000000',
    'icon-halo-width': [
      'case',
      ['boolean', ['feature-state', 'selected'], false],
      3, // thicker outline when selected
      2,
    ],
    'icon-halo-blur': 0,
    'icon-halo-width-transition': {
      duration: 200,
      delay: 0,
    },
  },
};

// Spread-out points shown when a cluster can't zoom further. Each point carries its
// owning `product` (see createZoomLimitPoints), so colour it to match that product.
export const ZOOM_LIMIT_TEMPPOINT_LAYER_PARTIAL: Partial<CircleLayerSpecification> = {
  paint: {
    'circle-color': [
      'case',
      ['boolean', ['get', 'hasDataForDate'], true],
      [
        'match',
        ['get', 'product'],
        PRODUCT.MOORING_TIMESERIES_REALTIME,
        '#f97316', // timeseries mooring: amber
        PRODUCT.MOORING_ESTUARINE_COASTAL_WATER_QUALITY_MONITORING_REALTIME_QC,
        ESTUARINE_MOORING_COLOR,
        '#11b4da', // wave buoys (default): blue
      ],
      '#aaaaaa', // inactive: gray
    ],
    'circle-radius': 8,
    'circle-stroke-width': 1,
    'circle-stroke-color': '#fff',
  },
};

export const ZOOM_LIMIT_TEMP_CONNECTION_LINES_LAYER_PARTIAL: Partial<LineLayerSpecification> = {
  paint: {
    'line-color': '#666',
    'line-width': 1,
    'line-dasharray': [2, 2],
  },
} as const;

export const MEASURE_POINT_CONFIG: Partial<CircleLayerSpecification> = {
  paint: {
    'circle-radius': 5,
    'circle-color': '#fff',
  },
  filter: ['in', '$type', 'Point'],
} as const;

export const MEASURE_LINES_CONFIG: Partial<LineLayerSpecification> = {
  layout: { 'line-cap': 'round', 'line-join': 'round' },
  paint: {
    'line-color': '#ff0000',
    'line-width': 4,
    'line-opacity': 1,
  },
  filter: ['in', '$type', 'LineString'],
} as const;

export const WORLD_LAND_BORDER_CONFIG: Partial<LineLayerSpecification> = {
  'source-layer': 'country_boundaries',
  paint: {
    'line-color': '#333333',
    'line-width': 2,
    'line-blur': 0.5,
  },
} as const;

export const WORLD_LAND_FILL_CONFIG: Partial<FillLayerSpecification> = {
  'source-layer': 'country_boundaries',
  paint: {
    'fill-color': 'transparent',
    'fill-outline-color': 'transparent',
  },
} as const;

// Isobaths from `mapbox-bathymetry-v2`: polygons are nested (min_depth N = area deeper than N), so each outline is the N m contour.
// Shelf and slope only: skip the coastline (0 m) and noisy abyssal bands (>= 3000 m).
const ISOBATH_FILTER: LineLayerSpecification['filter'] = [
  'all',
  ['>', ['get', 'min_depth'], 0],
  ['<', ['get', 'min_depth'], 3000],
];

export const ISOBATH_LINE_CONFIG: Partial<LineLayerSpecification> = {
  'source-layer': 'depth',
  filter: ISOBATH_FILTER,
  paint: {
    'line-color': '#0b4f6c',
    'line-opacity': 0.7,
    'line-width': ['interpolate', ['linear'], ['zoom'], 3, 0.5, 10, 1.5],
  },
} as const;

// One label per depth, placed at the contour point nearest the viewport centre (see `buildIsobathLabels`).
export const ISOBATH_LABEL_CONFIG: Partial<SymbolLayerSpecification> = {
  layout: {
    'text-field': ['concat', ['to-string', ['get', 'depth']], ' m'],
    'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Regular'],
    'text-size': 11,
    'text-rotate': ['get', 'angle'],
    'text-rotation-alignment': 'viewport',
  },
  paint: {
    'text-color': '#0b4f6c',
    'text-halo-color': '#ffffff',
    'text-halo-width': 1,
  },
} as const;

// ---------- Render order ----------
//last one is the top layer.
export const LAYERS_ORDER = [
  PRODUCTS[PRODUCT.GSLA_ANOMALY_SEA_LEVELS].layerId,
  PRODUCTS[PRODUCT.AUSTEMP_HEATWAVE_SSTA_MOSAIC].layerId,
  PRODUCTS[PRODUCT.AUSTEMP_HEATWAVE_SST_MOSAIC].layerId,
  PRODUCTS[PRODUCT.AUSTEMP_HEATWAVE_MHW_CATEGORY_MOSAIC].layerId,
  PRODUCTS[PRODUCT.GSLA_OCEAN_GEOSTROPHIC_CURRENT].layerId,
  ISOBATH_LINE_LAYER_ID,
  ISOBATH_LABEL_LAYER_ID,
  WORLD_LAND_BORDER_LAYER_ID,
  WORLD_LAND_FILL_LAYER_ID,
  SITE_CLUSTER_LAYER_ID,
  UNCLUSTERED_WAVE_BUOYS_LAYER_ID,
  UNCLUSTERED_MOORING_LAYER_ID,
  UNCLUSTERED_ESTUARINE_MOORING_LAYER_ID,
  SITE_CLUSTER_LABEL_LAYER_ID,
  MEASURE_LINES_LAYER_ID,
  MEASURE_POINTS_LAYER_ID,
] as const;
