import type { SiteFeature } from '@/types';
import { normalizeWaveBuoysData } from '@/helpers';
import { useEffect } from 'react';

/**
 * Handles click events on unclustered site points.
 * Manages selection state and clicked point data.
 */
export function useSiteUnclusteredClick(
  map: React.RefObject<mapboxgl.Map | null>,
  enabled: boolean,
  shouldHandle: () => boolean,
  selectFeature: (featureId: string | number) => void,
  setClickedPointData: (data: Omit<SiteFeature, 'type'>[] | null) => void,
  unclusteredLayerId: string,
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
      setClickedPointData(normalizeWaveBuoysData(e.features));
    };

    mapInstance.on('click', unclusteredLayerId, handleClick);
    return () => {
      mapInstance?.off('click', unclusteredLayerId, handleClick);
    };
  }, [enabled, map, shouldHandle, selectFeature, setClickedPointData, unclusteredLayerId]);
}
