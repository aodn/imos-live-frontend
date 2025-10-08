import {
  MEASURE_LINES_LAYER_ID,
  MEASURE_POINTS_LAYER_ID,
  OVERLAY_LAYER_ID,
  PARTICLE_LAYER_ID,
  UNCLUSTERED_WAVE_BUOYS_LAYER_ID,
  WAVE_BUOYS_CLUSTER_LABEL_LAYER_ID,
  WAVE_BUOYS_LAYER_ID,
} from '@/constants';
import {
  CircleLayerSpecification,
  LineLayerSpecification,
  SymbolLayerSpecification,
} from 'mapbox-gl';
import anomalySeaLevelColorMap from './anomaly_sea_level_colormap.json';

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
      3, // thicker stroke when selected
      2, // normal stroke
    ],
    'circle-stroke-color': '#000',
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
    'raster-resampling': 'nearest',
  },
  type: 'raster',
  slot: 'middle',
} as const;

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
export const gslaOverlayImageColors = anomalySeaLevelColorMap as [number, number, number][];

//this should be same in python script when generate the overlay image
export const gslaAnomalySeaLevelsRange = [-1.2, 1.2];

export const gslaAnomalySeaLevelsColorsLegendConfig = {
  title: 'anomaly sea level (m)',
  colors: gslaOverlayImageColors,
  min: gslaAnomalySeaLevelsRange[0],
  max: gslaAnomalySeaLevelsRange[1],
  numStops: 256,
  threshode: 0.1, //this must be same as linthresh in python script when generate the overlay image
};
