import { WORLD_LAND_BORDER_LAYER_ID, WORLD_LAND_SOURCE_ID } from '@/constants';
import { useCallback, useMemo } from 'react';
import { useMapboxLayerSetup } from './useMapboxLayerSetup';
import { lineLayer } from '@/layers';
import { addLayerInOrder, addOrUpdateVectorSource } from '@/helpers';
import { worldLandBorderConfig } from '@/config';
import { worldLandStyle } from '@/styles';
import { useMapUIStore } from '@/store';
import { useShallow } from 'zustand/shallow';
import { useMapboxLayerVisibility } from './useMapboxLayerVisibility';

export function useWorldLandLayer(map: React.RefObject<mapboxgl.Map | null>) {
  const { worldBoundaries } = useMapUIStore(
    useShallow(s => ({
      worldBoundaries: s.worldBoundaries,
    })),
  );

  const worldLandBorderLayer = useMemo(
    () =>
      lineLayer(
        {
          id: WORLD_LAND_BORDER_LAYER_ID,
          source: WORLD_LAND_SOURCE_ID,
          ...worldLandBorderConfig,
        },
        worldBoundaries,
      ),
    [worldBoundaries],
  );

  const setupLayer = useCallback(async () => {
    if (!map.current) return;
    addOrUpdateVectorSource({
      map: map.current,
      id: WORLD_LAND_SOURCE_ID,
      url: worldLandStyle.source,
    });
    addLayerInOrder(map, worldLandBorderLayer);
  }, [worldLandBorderLayer, map]);

  const { loadComplete } = useMapboxLayerSetup(map, setupLayer, []);

  useMapboxLayerVisibility(map, loadComplete, [worldLandBorderLayer], worldBoundaries);
}
