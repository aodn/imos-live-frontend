import {
  zoomLimitTempConnectiongLinesLayerPartial,
  zoomLimitTempPointLayerPartial,
} from '@/config';
import {
  ZOOM_LIMIT_TEMP_POINTS_CONNECTION_LINES_LAYER_ID,
  ZOOM_LIMIT_TEMP_POINTS_CONNECTION_LINES_SOURCE_ID,
  ZOOM_LIMIT_TEMP_POINTS_LAYER_ID,
  ZOOM_LIMIT_TEMP_POINTS_SOURCE_ID,
} from '@/constants';
import type { GeoJsonProperties, Geometry, Feature } from 'geojson';
import { removeZoomLimitTempPoints } from './removeZoomLimitTempPoints';

type PointProperties = {
  [key: string]: any;
};

type FeaturePoint = {
  type: 'Feature';
  geometry: {
    type: 'Point';
    coordinates: [number, number];
  };
  properties: PointProperties;
};

type FeatureLine = {
  type: 'Feature';
  geometry: {
    type: 'LineString';
    coordinates: [number, number][];
  };
  properties: Record<string, never>;
};

export function createZoomLimitPoints(
  map: React.RefObject<mapboxgl.Map | null>,
  points: Feature<Geometry, GeoJsonProperties>[],
  clusterCenter: [number, number],
) {
  const mapInstace = map.current;
  if (!mapInstace) return;

  if (mapInstace.getSource(ZOOM_LIMIT_TEMP_POINTS_SOURCE_ID)) {
    removeZoomLimitTempPoints(map);
  }

  const pixelDistance = 60;
  const centerPoint = mapInstace.project(clusterCenter);
  const offsetPoint: [number, number] = [centerPoint.x + pixelDistance, centerPoint.y];
  const geoOffset = mapInstace.unproject(offsetPoint);
  const offset = Math.abs(geoOffset.lng - clusterCenter[0]);

  const pointsFeatures: FeaturePoint[] = [];
  const lineFeatures: FeatureLine[] = [];

  points.forEach((point, index) => {
    const angle = (2 * Math.PI * index) / points.length;
    const offsetLng = clusterCenter[0] + offset * Math.cos(angle);
    const offsetLat = clusterCenter[1] + offset * Math.sin(angle);

    pointsFeatures.push({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [offsetLng, offsetLat], //TODO: the coordinates are not the original, so either put original value in property or invetigate on it finding other ways.
      },
      properties: point.properties ?? {},
    });

    lineFeatures.push({
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [clusterCenter, [offsetLng, offsetLat]],
      },
      properties: {},
    });
  });

  mapInstace.addSource(ZOOM_LIMIT_TEMP_POINTS_SOURCE_ID, {
    type: 'geojson',
    data: { type: 'FeatureCollection', features: pointsFeatures },
  });

  mapInstace.addSource(ZOOM_LIMIT_TEMP_POINTS_CONNECTION_LINES_SOURCE_ID, {
    type: 'geojson',
    data: { type: 'FeatureCollection', features: lineFeatures },
  });

  mapInstace.addLayer({
    id: ZOOM_LIMIT_TEMP_POINTS_CONNECTION_LINES_LAYER_ID,
    type: 'line',
    source: ZOOM_LIMIT_TEMP_POINTS_CONNECTION_LINES_SOURCE_ID,
    ...zoomLimitTempConnectiongLinesLayerPartial,
  });

  mapInstace.addLayer({
    id: ZOOM_LIMIT_TEMP_POINTS_LAYER_ID,
    type: 'circle',
    source: ZOOM_LIMIT_TEMP_POINTS_SOURCE_ID,
    ...zoomLimitTempPointLayerPartial,
  });
}
