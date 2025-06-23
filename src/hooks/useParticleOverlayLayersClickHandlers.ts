import { useEffect, RefObject, useRef } from 'react';
import { showPopup } from '@/helpers';
import { debounce } from '@/utils';
import { useToast } from '@/components';
import { useOceanCurrentDetials } from './useAsync';

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
  const clickCoordinatesRef = useRef<{ lat: number; lng: number } | null>(null);

  const {
    data: oceanCurrentDetails,
    error,
    refetch: fetchOceanCurrentDetails,
  } = useOceanCurrentDetials(
    dataset,
    clickCoordinatesRef.current?.lat || 0,
    clickCoordinatesRef.current?.lng || 0,
  );

  useEffect(() => {
    if (!clickCoordinatesRef.current) return;

    if (error) {
      showToast({
        type: 'error',
        title: 'Error occurred',
        message: 'Failed to get ocean current details',
        duration: 6000,
      });
      clickCoordinatesRef.current = null;
      return;
    }

    if (oceanCurrentDetails) {
      const { gsla, alpha, speed, degree, direction } = oceanCurrentDetails;
      const { lat, lng } = clickCoordinatesRef.current;

      if (!alpha) {
        clickCoordinatesRef.current = null;
        return;
      }

      showPopup(map.current!, {
        lat,
        lng,
        ...(particles ? { speed, direction, degree } : {}),
        ...(overlay ? { gsla } : {}),
      });

      clickCoordinatesRef.current = null;
    }
  }, [oceanCurrentDetails, error, particles, overlay, map, showToast]);

  useEffect(() => {
    if (!map.current || (!particles && !overlay) || distanceMeasurement) return;
    const mapInstance = map.current;

    const handleClick = async (e: mapboxgl.MapMouseEvent) => {
      if (waveBuoysLayerClicked.current) {
        waveBuoysLayerClicked.current = false;
        return;
      }

      if (tempPointsEventPrevent.current) {
        tempPointsEventPrevent.current = false;
        return;
      }

      const { lng, lat } = e.lngLat;

      clickCoordinatesRef.current = { lat, lng };
      fetchOceanCurrentDetails(dataset, lat, lng);
    };

    const debounceClick = debounce(handleClick, 100);

    mapInstance.on('click', debounceClick);
    return () => {
      mapInstance.off('click', debounceClick);
    };
  }, [
    dataset,
    overlay,
    particles,
    distanceMeasurement,
    map,
    waveBuoysLayerClicked,
    tempPointsEventPrevent,
    fetchOceanCurrentDetails,
  ]);
}
