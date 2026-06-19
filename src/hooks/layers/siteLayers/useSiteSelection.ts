import { useCallback, useRef } from 'react';

/**
 * Manages the selection state of clustered site features (wave buoys, moorings, …).
 * Handles selecting/deselecting a feature and maintaining the selected feature ID,
 * scoped to the given source.
 */
export function useSiteSelection(map: React.RefObject<mapboxgl.Map | null>, sourceId: string) {
  const selectedFeatureId = useRef<string | number | null>(null);

  const selectFeature = useCallback(
    (featureId: string | number) => {
      if (!map.current) return;

      // Deselect previous feature if any
      if (selectedFeatureId.current !== null) {
        map.current.setFeatureState(
          { source: sourceId, id: selectedFeatureId.current },
          { selected: false },
        );
      }

      // Select new feature
      map.current.setFeatureState({ source: sourceId, id: featureId }, { selected: true });
      selectedFeatureId.current = featureId;
    },
    [sourceId, map],
  );

  const clearSelection = useCallback(() => {
    if (!map.current || selectedFeatureId.current === null) return;

    map.current.setFeatureState(
      { source: sourceId, id: selectedFeatureId.current },
      { selected: false },
    );
    selectedFeatureId.current = null;
  }, [sourceId, map]);

  return {
    selectedFeatureId,
    selectFeature,
    clearSelection,
  };
}
