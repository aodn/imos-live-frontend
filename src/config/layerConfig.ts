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
  filter: ['!', ['has', 'point_count']], // Only show unclustered points
  paint: {
    'circle-color': '#11b4da',
    'circle-radius': 8,
    'circle-stroke-width': 1,
    'circle-stroke-color': '#fff',
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
