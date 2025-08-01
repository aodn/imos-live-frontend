import { getOceanCurrentData } from '@/api';
import { useToast } from '@/components';
import { showPopup } from '@/helpers';
import { debounce, processOceanCurrentDetails } from '@/utils';
import { RefObject, useCallback, useEffect } from 'react';
import { GSLA_DATA_NAME } from '@/constants';
import { useQuery } from '@tanstack/react-query';

type UseMapClickHandlersOptions = {
  map: RefObject<mapboxgl.Map | null>;
  dataset: string;
  overlay: boolean;
  particles: boolean;
  waveBuoysLayerClicked: React.RefObject<boolean>;
  tempPointsEventPrevent: React.RefObject<boolean>;
  distanceMeasurement: boolean;
};

export function useParticleOverlayLayersClickHandlers({
  map,
  dataset,
  overlay,
  particles,
  waveBuoysLayerClicked,
  tempPointsEventPrevent,
  distanceMeasurement,
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
    debounce((e: mapboxgl.MapMouseEvent) => {
      if (!map?.current || !oceanCurrentData || distanceMeasurement || (!particles && !overlay))
        return;

      if (waveBuoysLayerClicked.current) {
        waveBuoysLayerClicked.current = false;
        return;
      }

      if (tempPointsEventPrevent.current) {
        tempPointsEventPrevent.current = false;
        return;
      }

      const { lngLat } = e;
      const details = processOceanCurrentDetails(lngLat, oceanCurrentData);
      if (!details) return;
      const { gsla, speed, degree, direction } = details;

      showPopup(map.current, {
        ...lngLat,
        ...(particles ? { speed, direction, degree } : {}),
        ...(overlay ? { gsla } : {}),
      });
    }, 400),
    [oceanCurrentData, distanceMeasurement, overlay, particles],
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
