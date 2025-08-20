import {
  MEASURE_LINES_LAYER_ID,
  MEASURE_POINTS_LAYER_ID,
  OVERLAY_LAYER_ID,
  PARTICLE_LAYER_ID,
  UNCLUSTERED_WAVE_BUOYS_LAYER_ID,
  WAVE_BUOYS_CLUSTER_LABEL_LAYER_ID,
  WAVE_BUOYS_LAYER_ID,
} from '@/constants';
import { rgbToHex } from '@/utils';
import {
  CircleLayerSpecification,
  LineLayerSpecification,
  SymbolLayerSpecification,
} from 'mapbox-gl';

export const waveBuoysLayerConfig: Partial<CircleLayerSpecification> = {
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
};

export const clusterMaxZoom = 16;

export const unclusteredWaveBuoysLayerConfig: Partial<CircleLayerSpecification> = {
  filter: ['!', ['has', 'point_count']],
  paint: {
    'circle-color': [
      'case',
      ['boolean', ['feature-state', 'selected'], false],
      '#ffffff', // white center when selected
      '#11b4da', // blue when not selected
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
      4, // thicker stroke when selected
      1, // normal stroke
    ],
    'circle-stroke-color': [
      'case',
      ['boolean', ['feature-state', 'selected'], false],
      '#11b4da', // blue outline when selected (inverted colors)
      '#ffffff', // white outline when not selected
    ],
    'circle-stroke-opacity': [
      'case',
      ['boolean', ['feature-state', 'selected'], false],
      1, // full opacity when selected
      0.8, // slightly transparent when not selected
    ],
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
};

export const waveBuoyCluserLabelLayerConfig: Partial<SymbolLayerSpecification> = {
  filter: ['has', 'point_count'],
  layout: {
    'text-field': '{point_count_abbreviated}',
    'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
    'text-size': 12,
  },
};

export const zoomLimitTempPointLayerPartial: Partial<CircleLayerSpecification> = {
  paint: {
    'circle-color': '#11b4da',
    'circle-radius': 8,
    'circle-stroke-width': 1,
    'circle-stroke-color': '#fff',
  },
};

export const zoomLimitTempConnectiongLinesLayerPartial: Partial<LineLayerSpecification> = {
  paint: {
    'line-color': '#666',
    'line-width': 1,
    'line-dasharray': [2, 2],
  },
};

export const overlayLayerConfig = {
  paint: {
    'raster-fade-duration': 0,
  },
};

export const measurePointsConfig: Partial<CircleLayerSpecification> = {
  paint: {
    'circle-radius': 5,
    'circle-color': '#fff',
  },
  filter: ['in', '$type', 'Point'],
};

export const measureLinesConfig: Partial<LineLayerSpecification> = {
  layout: { 'line-cap': 'round', 'line-join': 'round' },
  paint: {
    'line-color': '#ff0000',
    'line-width': 4,
    'line-opacity': 1,
  },
  filter: ['in', '$type', 'LineString'],
};

//last one is the top layer.
export const layersOrder = [
  OVERLAY_LAYER_ID,
  PARTICLE_LAYER_ID,
  WAVE_BUOYS_LAYER_ID,
  UNCLUSTERED_WAVE_BUOYS_LAYER_ID,
  WAVE_BUOYS_CLUSTER_LABEL_LAYER_ID,
  MEASURE_LINES_LAYER_ID,
  MEASURE_POINTS_LAYER_ID,
];

//this is from Gabriela.Semolinipilo@csiro.au and this should be same in python script when generate the overlay image.
export const GSLA_OVERLAY_IMAGE_COLORS_SOURCE = [
  [0, 0, 0.482],
  [0, 0, 0.50218],
  [0, 0, 0.52534],
  [0, 0, 0.54956],
  [0, 0.025383, 0.58095],
  [0, 0.07278, 0.61329],
  [0, 0.12013, 0.64869],
  [0, 0.16728, 0.68794],
  [0, 0.22396, 0.73282],
  [0, 0.28639, 0.78747],
  [0, 0.34613, 0.84284],
  [0, 0.40579, 0.89829],
  [0, 0.47426, 0.9398],
  [0, 0.54918, 0.97544],
  [0, 0.61362, 0.99171],
  [0, 0.66965, 0.99559],
  [0, 0.7232, 0.98594],
  [0, 0.77437, 0.96076],
  [0, 0.80867, 0.89862],
  [0, 0.82905, 0.81967],
  [0, 0.82884, 0.7443],
  [0, 0.80974, 0.66939],
  [0, 0.7863, 0.59404],
  [0, 0.76642, 0.51917],
  [0, 0.74988, 0.44772],
  [0, 0.7339, 0.37945],
  [0, 0.72899, 0.32053],
  [0, 0.72878, 0.26877],
  [0, 0.74456, 0.21724],
  [0, 0.76053, 0.16994],
  [0, 0.79162, 0.12556],
  [0, 0.82383, 0.082186],
  [0, 0.85513, 0.046833],
  [0, 0.88238, 0.011428],
  [0.18068, 0.91064, 0],
  [0.41904, 0.94198, 0],
  [0.56948, 0.966, 0],
  [0.696, 0.98928, 0],
  [0.77211, 0.99599, 0],
  [0.83585, 0.9961, 0],
  [0.87785, 0.97825, 0],
  [0.91384, 0.95503, 0],
  [0.93912, 0.92141, 0],
  [0.96858, 0.88564, 0],
  [0.98192, 0.85183, 0],
  [0.99397, 0.82057, 0],
  [0.996, 0.78241, 0],
  [0.99795, 0.74317, 0],
  [0.99787, 0.69933, 0],
  [0.99408, 0.65588, 0],
  [0.97754, 0.61753, 0],
  [0.95985, 0.57266, 0],
  [0.93568, 0.53352, 0],
  [0.91237, 0.48932, 0],
  [0.88869, 0.45078, 0],
  [0.86057, 0.40665, 0],
  [0.8327, 0.36373, 0],
  [0.80153, 0.31613, 0],
  [0.77014, 0.26528, 0],
  [0.73781, 0.21383, 0],
  [0.71859, 0.16203, 0],
  [0.69843, 0.10697, 0],
  [0.67819, 0.055343, 0],
  [0.659, 0, 0],
];

export const gslaOverlayImageColors = GSLA_OVERLAY_IMAGE_COLORS_SOURCE.map(([r, g, b]) =>
  rgbToHex(r, g, b),
);

//this should be same in python script when generate the overlay image
export const gslaAnomalySeaLevelsRange = [-1.2, 1.2];
