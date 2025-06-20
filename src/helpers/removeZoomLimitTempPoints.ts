import {
  ZOOM_LIMIT_TEMP_POINTS_CONNECTION_LINES_LAYER_ID,
  ZOOM_LIMIT_TEMP_POINTS_CONNECTION_LINES_SOURCE_ID,
  ZOOM_LIMIT_TEMP_POINTS_LAYER_ID,
  ZOOM_LIMIT_TEMP_POINTS_SOURCE_ID,
} from '@/constants';

export function removeZoomLimitTempPoints(map: React.RefObject<mapboxgl.Map | null>) {
  const mapInstace = map.current;
  if (!mapInstace) return;
  mapInstace.removeLayer(ZOOM_LIMIT_TEMP_POINTS_LAYER_ID);
  mapInstace.removeLayer(ZOOM_LIMIT_TEMP_POINTS_CONNECTION_LINES_LAYER_ID);
  mapInstace.removeSource(ZOOM_LIMIT_TEMP_POINTS_SOURCE_ID);
  mapInstace.removeSource(ZOOM_LIMIT_TEMP_POINTS_CONNECTION_LINES_SOURCE_ID);
}
