import { PRODUCT, PRODUCTS } from '@/constants';
import { useCallback, useRef } from 'react';

/**
 * Manages the selection state of wave buoy features.
 * Handles selecting/deselecting buoys and maintaining selected feature ID.
 */
export function useWaveBuoysSelection(map: React.RefObject<mapboxgl.Map | null>) {
  const WAVE_BUOYS_SOURCE_ID = PRODUCTS[PRODUCT.WAVE_BUOYS].sourceId;
  const selectedFeatureId = useRef<string | number | null>(null);

  const selectFeature = useCallback(
    (featureId: string | number) => {
      if (!map.current) return;

      // Deselect previous feature if any
      if (selectedFeatureId.current !== null) {
        map.current.setFeatureState(
          { source: WAVE_BUOYS_SOURCE_ID, id: selectedFeatureId.current },
          { selected: false },
        );
      }

      // Select new feature
      map.current.setFeatureState(
        { source: WAVE_BUOYS_SOURCE_ID, id: featureId },
        { selected: true },
      );
      selectedFeatureId.current = featureId;
    },
    [WAVE_BUOYS_SOURCE_ID, map],
  );

  const clearSelection = useCallback(() => {
    if (!map.current || selectedFeatureId.current === null) return;

    map.current.setFeatureState(
      { source: WAVE_BUOYS_SOURCE_ID, id: selectedFeatureId.current },
      { selected: false },
    );
    selectedFeatureId.current = null;
  }, [WAVE_BUOYS_SOURCE_ID, map]);

  return {
    selectedFeatureId,
    selectFeature,
    clearSelection,
  };
}
