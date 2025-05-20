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
  distanceMeasurement,
}: UseMapClickHandlersOptions) {
  useEffect(() => {
    if (!map.current || (!particles && !overlay) || distanceMeasurement) return;
    const mapInstance = map.current;

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
  }, [dataset, overlay, particles, distanceMeasurement, map, waveBuoysLayerClicked]);
}
