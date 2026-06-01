import { CLUSTER_MAX_ZOOM } from '@/constants';
import { ZOOM_LIMIT_TEMP_POINTS_LAYER_ID, ZOOM_LIMIT_TEMP_POINTS_SOURCE_ID } from '@/constants';
import { normalizeWaveBuoysData, removeZoomLimitTempPoints } from '@/helpers';
import { type WaveBuoySiteFeature } from '@/types';
import { useEffect } from 'react';

/**
 * Handles click events on zoom limit temp points layer.
 * These are temporary points created when clusters can't be expanded further.
 */
export function useWaveBuoysZoomLimitClick(
  map: React.RefObject<mapboxgl.Map | null>,
  enabled: boolean,
  shouldHandle: () => boolean,
  setClickedPointData: (data: Omit<WaveBuoySiteFeature, 'type'>[] | null) => void,
) {
  useEffect(() => {
    if (!map.current || !enabled || !shouldHandle()) return;
    const mapInstance = map.current;

    const handleClick = (e: mapboxgl.MapMouseEvent) => {
      if (!e.features?.length) return;
      if (e.features[0].properties?.hasDataForDate === false) return;

      setClickedPointData(normalizeWaveBuoysData(e.features));
    };

    mapInstance.on('click', ZOOM_LIMIT_TEMP_POINTS_LAYER_ID, handleClick);
    return () => {
      mapInstance?.off('click', ZOOM_LIMIT_TEMP_POINTS_LAYER_ID, handleClick);
    };
  }, [enabled, map, shouldHandle, setClickedPointData]);

  useEffect(() => {
    // Handle zoom limit temp points removal when clicking outside of them
    if (!map.current || !enabled) return;
    const mapInstance = map.current;

    const handleMapClick = (e: mapboxgl.MapMouseEvent) => {
      const hasZoomLimitTempPoints = mapInstance.getSource(ZOOM_LIMIT_TEMP_POINTS_SOURCE_ID);
      if (!hasZoomLimitTempPoints) return;

      const zoomLimitFeatures = mapInstance.queryRenderedFeatures(e.point, {
        layers: [ZOOM_LIMIT_TEMP_POINTS_LAYER_ID],
      });

      // If clicked outside zoom limit temp points, remove them
      if (!zoomLimitFeatures?.length) {
        removeZoomLimitTempPoints(map);
      }
    };

    mapInstance.on('click', handleMapClick);
    return () => {
      mapInstance?.off('click', handleMapClick);
    };
  }, [enabled, map]);

  useEffect(() => {
    //disppeart ZOOM_LIMIT_TEMP_POINTS_LAYER when zoom within clusterMaxZoom level.
    if (!map.current || !enabled) return;
    const mapInstance = map.current;

    const handleZoomEnd = () => {
      const currentZoom = mapInstance.getZoom();

      if (
        currentZoom <= CLUSTER_MAX_ZOOM &&
        mapInstance.getSource(ZOOM_LIMIT_TEMP_POINTS_SOURCE_ID)
      ) {
        removeZoomLimitTempPoints(map);
      }
    };

    mapInstance.on('zoomend', handleZoomEnd);

    return () => {
      mapInstance?.off('zoomend', handleZoomEnd);
    };
  }, [map, enabled]);
}
