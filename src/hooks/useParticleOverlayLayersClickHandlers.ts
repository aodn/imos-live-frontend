import { useEffect, RefObject } from 'react';
import { getOceanCurrentDetails } from '@/api';
import { showPopup } from '@/helpers';
import { debounce, tryCatch } from '@/utils';
import { useToast } from '@/components';

type UseMapClickHandlersOptions = {
  map: RefObject<mapboxgl.Map | null>;
  dataset: string;
  overlay: boolean;
  particles: boolean;
  waveBuoysLayerClicked: React.RefObject<boolean>;
  tempPointsEventPrevent: React.RefObject<boolean>;
  distanceMeasurement: boolean;
};
//Mapbox GL JS only allows layer-specific click events on vector layers (e.g., fill, circle, line).
//For image layers, raster layers, or fully custom WebGL layers, you’re forced to use a global map click handler
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

      const oceanCurrentDetails = await tryCatch(getOceanCurrentDetails(dataset, lat, lng), () =>
        showToast({
          type: 'error',
          title: 'Error occurred',
          message: 'Failed to get ocean current details',
          duration: 6000,
        }),
      );

      if (!oceanCurrentDetails) return;

      const { gsla, alpha, speed, degree, direction } = oceanCurrentDetails;

      if (!alpha) return;

      showPopup(mapInstance!, {
        lat,
        lng,
        ...(particles ? { speed, direction, degree } : {}),
        ...(overlay ? { gsla } : {}),
      });
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
    showToast,
    tempPointsEventPrevent,
  ]);
}
