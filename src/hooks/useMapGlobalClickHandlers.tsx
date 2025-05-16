/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, RefObject } from 'react';
import { getOceanCurrentDetails } from '@/api';
import { showPopup } from '@/helpers';
import { debounce } from '@/utils';

type UseMapClickHandlersOptions = {
  map: RefObject<mapboxgl.Map | null>;
  dataset: string;
  overlay: boolean;
  particles: boolean;
  waveBuoysLayerClicked: React.RefObject<boolean>;
};
//Mapbox GL JS only allows layer-specific click events on vector layers (e.g., fill, circle, line).
//For image layers, raster layers, or fully custom WebGL layers, you’re forced to use a global map click handler
export function useMapGlobalClickHandlers({
  map,
  dataset,
  overlay,
  particles,
  waveBuoysLayerClicked,
}: UseMapClickHandlersOptions) {
  useEffect(() => {
    if (!map.current || (!particles && !overlay)) return;

    const handleClick = async (e: mapboxgl.MapMouseEvent) => {
      if (waveBuoysLayerClicked.current) {
        waveBuoysLayerClicked.current = false;
        return;
      }

      const { lng, lat } = e.lngLat;
      const { gsla, alpha, speed, degree, direction } = await getOceanCurrentDetails(
        dataset,
        lat,
        lng,
      );

      if (!alpha) return;

      showPopup(map.current!, {
        lat,
        lng,
        ...(particles ? { speed, direction, degree } : {}),
        ...(overlay ? { gsla } : {}),
      });
    };

    const debounceClick = debounce(handleClick, 100);

    map.current.on('click', debounceClick);
    return () => {
      map.current?.off('click', debounceClick);
    };
  }, [dataset, overlay, particles]);
}
