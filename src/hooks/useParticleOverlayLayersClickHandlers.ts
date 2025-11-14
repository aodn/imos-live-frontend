import { getOceanCurrentData } from '@/api';
import { useToast } from '@/components';
import { showPopup } from '@/helpers';
import { debounce, gerMapMetaData } from '@/utils';
import { RefObject, useCallback, useEffect } from 'react';
import { GSLA_DATA_NAME, OverlaySource } from '@/constants';
import { useQuery } from '@tanstack/react-query';
import { useMapPopupStore } from '@/store';
import { getPopupData } from '@/helpers';

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
  const updateAllMapPopup = useMapPopupStore(s => s.updateAllMapPopup);
  //cached by browser
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
      const { lngLat } = e;

      const { mapBounds, mapSize } = gerMapMetaData(map);

      const popupData = await getPopupData({
        mapBounds,
        mapSize,
        particles,
        oceanCurrentData,
        overlay,
        overlaySource,
        point: e.point,
        dataset,
        lngLat,
      });

      if (Object.keys(popupData).length === 0) return;

      updateAllMapPopup(popupData);

      showPopup(map.current, {
        ...lngLat,
      });
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
