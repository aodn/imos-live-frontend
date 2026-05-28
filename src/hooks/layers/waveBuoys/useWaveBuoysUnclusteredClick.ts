import { UNCLUSTERED_WAVE_BUOYS_LAYER_ID } from '@/constants';
import type { WaveBuoyPositionFeature } from '@/types';
import { normalizeWaveBuouysData } from '@/helpers';
import { useEffect } from 'react';

/**
 * Handles click events on unclustered wave buoy points.
 * Manages selection state and clicked point data.
 */
export function useWaveBuoysUnclusteredClick(
  map: React.RefObject<mapboxgl.Map | null>,
  enabled: boolean,
  shouldHandle: () => boolean,
  selectFeature: (featureId: string | number) => void,
  setClickedPointData: (data: Omit<WaveBuoyPositionFeature, 'type'>[] | null) => void,
) {
  useEffect(() => {
    if (!map.current || !enabled || !shouldHandle()) return;
    const mapInstance = map.current;

    const handleClick = (e: mapboxgl.MapMouseEvent) => {
      if (!e.features?.length) return;

      const feature = e.features[0];
      if (feature.properties?.hasDataForDate === false) return;

      const featureId = feature.properties?._id;
      if (featureId !== undefined) {
        selectFeature(featureId);
      }
      setClickedPointData(normalizeWaveBuouysData(e.features));
    };

    mapInstance.on('click', UNCLUSTERED_WAVE_BUOYS_LAYER_ID, handleClick);
    return () => {
      mapInstance?.off('click', UNCLUSTERED_WAVE_BUOYS_LAYER_ID, handleClick);
    };
  }, [enabled, map, shouldHandle, selectFeature, setClickedPointData]);
}
