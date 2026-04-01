import { type ClosePopupFn, createMapEventPriority, getMapMetaData, showPopup } from '@/helpers';
import type { RefObject } from 'react';
import { useCallback, useEffect, useMemo } from 'react';
import {
  WORLD_LAND_FILL_LAYER_ID,
  UNCLUSTERED_WAVE_BUOYS_LAYER_ID,
  ZOOM_LIMIT_TEMP_POINTS_LAYER_ID,
  WAVE_BUOYS_LAYER_ID,
} from '@/constants';
import { ClickedMapPopupContent } from '@/components';

type UseMapEventHandlersOptions = {
  map: RefObject<mapboxgl.Map | null>;
  raster: boolean;
  oceanCurrentEnabled: boolean;
  distanceMeasurementEnabled: boolean;
};

export function useParticleRasterLayersEventHandlers({
  map,
  raster,
  oceanCurrentEnabled,
  distanceMeasurementEnabled,
}: UseMapEventHandlersOptions) {
  const { shouldHandleMapClick } = useMemo(
    () =>
      createMapEventPriority({
        map,
        distanceMeasurementEnabled,
        higherPriorityLayers: [
          WAVE_BUOYS_LAYER_ID,
          UNCLUSTERED_WAVE_BUOYS_LAYER_ID,
          ZOOM_LIMIT_TEMP_POINTS_LAYER_ID,
        ],
      }),
    [map, distanceMeasurementEnabled],
  );

  const handleMapClick = useCallback(
    async (e: mapboxgl.MapMouseEvent) => {
      if (!map?.current || (!oceanCurrentEnabled && !raster)) return;

      if (!shouldHandleMapClick(e)) return;

      const { mapBounds, mapSize } = getMapMetaData(map);
      if (!mapBounds || !mapSize) return;

      const { lngLat, point } = e;
      if (!lngLat || !point) return;

      //stop clicking on land.
      const landFeatures = map.current.queryRenderedFeatures(point, {
        layers: [WORLD_LAND_FILL_LAYER_ID],
      });
      if (landFeatures.length > 0) {
        return;
      }

      showPopup({
        map,
        lngLat,
        PopupContent: (closeFn: ClosePopupFn) => (
          <ClickedMapPopupContent
            lngLat={lngLat}
            point={point}
            onClose={closeFn}
            mapBounds={mapBounds}
            mapSize={mapSize}
          />
        ),
      });
    },
    [map, raster, oceanCurrentEnabled, shouldHandleMapClick],
  );

  useEffect(() => {
    if (!map?.current) return;
    const { current } = map;

    current.on('click', handleMapClick);
    return () => {
      current.off('click', handleMapClick);
    };
  }, [map, handleMapClick]);
}
