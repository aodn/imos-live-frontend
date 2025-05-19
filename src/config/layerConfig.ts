import {
  MEASURE_LINES_LAYER_ID,
  MEASURE_POINTS_LAYER_ID,
  OVERLAY_LAYER_ID,
  PARTICLE_LAYER_ID,
  WAVE_BUOYS_LAYER_ID,
} from '@/constants';
import { CircleLayerSpecification, LineLayerSpecification } from 'mapbox-gl';

export const waveBuoysLayerConfig: Partial<CircleLayerSpecification> = {
  paint: {
    'circle-radius': [
      'interpolate',
      ['linear'],
      ['coalesce', ['get', 'count'], 0],
      0,
      4,
      10,
      6,
      50,
      8,
      200,
      12,
      1000,
      18,
      3000,
      24,
    ],
    'circle-color': '#007cbf',
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
  MEASURE_LINES_LAYER_ID,
  MEASURE_POINTS_LAYER_ID,
];
