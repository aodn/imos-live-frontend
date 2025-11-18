import { showPopup } from '@/helpers';
import { debounce } from '@/utils';
import { RefObject, useCallback, useEffect } from 'react';
import { OverlaySource } from '@/constants';

type UseMapClickHandlersOptions = {
  map: RefObject<mapboxgl.Map | null>;
  overlay: boolean;
  particles: boolean;
  waveBuoysLayerClicked: React.RefObject<boolean>;
  tempPointsEventPrevent: React.RefObject<boolean>;
  distanceMeasurement: boolean;
  overlaySource: OverlaySource;
};

export function useParticleOverlayLayersClickHandlers({
  map,
  overlay,
  particles,
  waveBuoysLayerClicked,
  tempPointsEventPrevent,
  distanceMeasurement,
  overlaySource,
}: UseMapClickHandlersOptions) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleMapClick = useCallback(
    debounce(async (e: mapboxgl.MapMouseEvent) => {
      if (!map?.current || distanceMeasurement || (!particles && !overlay)) return;

      if (waveBuoysLayerClicked.current) {
        waveBuoysLayerClicked.current = false;
        return;
      }

      if (tempPointsEventPrevent.current) {
        tempPointsEventPrevent.current = false;
        return;
      }
      const { lngLat, point } = e;

      showPopup({
        map,
        lngLat,
        point,
      });
    }, 400),
    [distanceMeasurement, overlay, particles, overlaySource],
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
