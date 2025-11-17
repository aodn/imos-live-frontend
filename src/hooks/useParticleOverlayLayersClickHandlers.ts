import { getOceanCurrentData } from '@/api';
import { useToast } from '@/components';
import { gerMapMetaData, setPopupData, showPopup } from '@/helpers';
import { debounce } from '@/utils';
import { RefObject, useCallback, useEffect } from 'react';
import { GSLA_DATA_NAME, OverlaySource } from '@/constants';
import { useQuery } from '@tanstack/react-query';
import { updateMapPopupByKey } from '@/store';

type UseMapClickHandlersOptions = {
  map: RefObject<mapboxgl.Map | null>;
  dataset: string;
  overlay: boolean;
  particles: boolean;
  waveBuoysLayerClicked: React.RefObject<boolean>;
  tempPointsEventPrevent: React.RefObject<boolean>;
  distanceMeasurement: boolean;
  overlaySource: OverlaySource;
};

export function useParticleOverlayLayersClickHandlers({
  map,
  dataset,
  overlay,
  particles,
  waveBuoysLayerClicked,
  tempPointsEventPrevent,
  distanceMeasurement,
  overlaySource,
}: UseMapClickHandlersOptions) {
  const { showToast } = useToast();
  const { data: oceanCurrentData, isError } = useQuery({
    queryKey: [GSLA_DATA_NAME, dataset],
    queryFn: () => getOceanCurrentData(dataset),
    enabled: !!dataset,
  });

  useEffect(() => {
    if (isError)
      showToast({
        type: 'error',
        title: 'Error occurred',
        message: 'Failed to get ocean current details',
        duration: 6000,
      });
  }, [isError, showToast]);

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
      const { mapBounds, mapSize } = gerMapMetaData(map);
      updateMapPopupByKey('metaData', {
        lngLat,
        point,
        mapBounds,
        mapSize,
      });

      const { popupEnabled } = await setPopupData(oceanCurrentData);
      if (popupEnabled) showPopup(map.current);
    }, 400),
    [oceanCurrentData, distanceMeasurement, overlay, particles, overlaySource],
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
