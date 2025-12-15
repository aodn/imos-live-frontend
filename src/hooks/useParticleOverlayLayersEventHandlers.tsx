import { type ClosePopupFn, createMapEventPriority, gerMapMetaData, showPopup } from '@/helpers';
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
  overlay: boolean;
  oceanCurrentEnabled: boolean;
  distanceMeasurement: boolean;
};

export function useParticleOverlayLayersEventHandlers({
  map,
  overlay,
  oceanCurrentEnabled,
  distanceMeasurement,
}: UseMapEventHandlersOptions) {
  const { shouldHandleMapClick } = useMemo(
    () =>
      createMapEventPriority({
        map,
        distanceMeasurement,
        higherPriorityLayers: [
          WAVE_BUOYS_LAYER_ID,
          UNCLUSTERED_WAVE_BUOYS_LAYER_ID,
          ZOOM_LIMIT_TEMP_POINTS_LAYER_ID,
        ],
      }),
    [map, distanceMeasurement],
  );

  const handleMapClick = useCallback(
    async (e: mapboxgl.MapMouseEvent) => {
      if (!map?.current || (!oceanCurrentEnabled && !overlay)) return;

      // Check event priority using queryRenderedFeatures
      if (!shouldHandleMapClick(e)) return;

      const { mapBounds, mapSize } = gerMapMetaData(map);
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
    [map, overlay, oceanCurrentEnabled, shouldHandleMapClick],
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
