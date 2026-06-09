import {
  WORLD_LAND_BORDER_LAYER_ID,
  WORLD_LAND_FILL_LAYER_ID,
  WORLD_LAND_SOURCE_ID,
} from '@/constants';
import { useCallback, useMemo } from 'react';
import { useMapboxLayerSetup } from './useMapboxLayerSetup';
import { lineLayer, fillLayer } from '@/layers';
import { addLayerInOrder, addOrUpdateVectorSource } from '@/helpers';
import { WORLD_LAND_BORDER_CONFIG, WORLD_LAND_FILL_CONFIG } from '@/constants';
import { worldLandStyle } from '@/styles';
import { useMapUIStore } from '@/store';
import { useShallow } from 'zustand/shallow';
import { useMapboxLayerVisibility } from './useMapboxLayerVisibility';

/**
 * 1. add border around land.
 * 2. add transparent land fill layer that used to disbale click on land.
 */
export function useWorldLandLayer(map: React.RefObject<mapboxgl.Map | null>) {
  const { worldBoundariesEnabled } = useMapUIStore(
    useShallow(s => ({
      worldBoundariesEnabled: s.worldBoundariesEnabled,
    })),
  );

  //this worldLandFillLayer is transparent and not for visualization, it is used to prevent click event on land.
  const worldLandFillLayer = useMemo(
    () =>
      fillLayer(
        {
          id: WORLD_LAND_FILL_LAYER_ID,
          source: WORLD_LAND_SOURCE_ID,
          ...WORLD_LAND_FILL_CONFIG,
        },
        true,
      ),
    [],
  );

  const worldLandBorderLayer = useMemo(
    () =>
      lineLayer(
        {
          id: WORLD_LAND_BORDER_LAYER_ID,
          source: WORLD_LAND_SOURCE_ID,
          ...WORLD_LAND_BORDER_CONFIG,
        },
        worldBoundariesEnabled,
      ),
    [worldBoundariesEnabled],
  );

  const layers = useMemo(
    () => [worldLandFillLayer, worldLandBorderLayer],
    [worldLandBorderLayer, worldLandFillLayer],
  );

  const setupLayer = useCallback(async () => {
    if (!map.current) return;
    addOrUpdateVectorSource({
      map: map.current,
      id: WORLD_LAND_SOURCE_ID,
      url: worldLandStyle.source,
    });
    layers.forEach(layer => addLayerInOrder(map, layer));
  }, [map, layers]);

  const { loadComplete } = useMapboxLayerSetup(map, setupLayer, [setupLayer]);

  // the transparent worldLandFillLayer is always enabled.
  useMapboxLayerVisibility(map, loadComplete, [worldLandBorderLayer], worldBoundariesEnabled);
}
