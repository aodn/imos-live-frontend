import { showPopup } from '@/helpers';
import { debounce } from '@/utils';
import { RefObject, useCallback, useEffect } from 'react';
import { WORLD_LAND_FILL_LAYER_ID } from '@/constants';

type UseMapClickHandlersOptions = {
  map: RefObject<mapboxgl.Map | null>;
  overlay: boolean;
  oceanCurrentEnabled: boolean;
  waveBuoysLayerClicked: React.RefObject<boolean>;
  tempPointsEventPrevent: React.RefObject<boolean>;
  distanceMeasurement: boolean;
};

export function useParticleOverlayLayersClickHandlers({
  map,
  overlay,
  oceanCurrentEnabled,
  waveBuoysLayerClicked,
  tempPointsEventPrevent,
  distanceMeasurement,
}: UseMapClickHandlersOptions) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleMapClick = useCallback(
    debounce(async (e: mapboxgl.MapMouseEvent) => {
      if (!map?.current || distanceMeasurement || (!oceanCurrentEnabled && !overlay)) return;

      if (waveBuoysLayerClicked.current) {
        waveBuoysLayerClicked.current = false;
        return;
      }

      if (tempPointsEventPrevent.current) {
        tempPointsEventPrevent.current = false;
        return;
      }

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
        point,
      });
    }, 400),
    [distanceMeasurement, overlay, oceanCurrentEnabled],
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
