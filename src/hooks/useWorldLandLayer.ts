import {
  WORLD_LAND_BORDER_LAYER_ID,
  WORLD_LAND_FILL_LAYER_ID,
  WORLD_LAND_SOURCE_ID,
} from '@/constants';
import { useCallback, useMemo } from 'react';
import { useMapboxLayerSetup } from './useMapboxLayerSetup';
import { fillLayer, lineLayer } from '@/layers';
import { addLayerInOrder, addOrUpdateVectorSource } from '@/helpers';
import { worldLandBorderConfig, worldLandFillConfig } from '@/config';
import { worldLandStyle } from '@/styles';

export function useWorldLandBorderLayer(map: React.RefObject<mapboxgl.Map | null>) {
  const worldLandBorderLayer = useMemo(
    () =>
      lineLayer(
        {
          id: WORLD_LAND_BORDER_LAYER_ID,
          source: WORLD_LAND_SOURCE_ID,
          ...worldLandBorderConfig,
        },
        true,
      ),
    [],
  );
  const worldLandFillLayer = useMemo(
    () =>
      fillLayer(
        {
          id: WORLD_LAND_FILL_LAYER_ID,
          source: WORLD_LAND_SOURCE_ID,
          ...worldLandFillConfig,
        },
        true,
      ),
    [],
  );

  const landLayers = useMemo(
    () => [worldLandBorderLayer, worldLandFillLayer],
    [worldLandBorderLayer, worldLandFillLayer],
  );

  const setupLayer = useCallback(async () => {
    if (!map.current) return;
    addOrUpdateVectorSource({
      map: map.current,
      id: WORLD_LAND_SOURCE_ID,
      url: worldLandStyle.source,
    });
    landLayers.forEach(layer => addLayerInOrder(map, layer));
  }, [landLayers, map]);

  useMapboxLayerSetup(map, setupLayer, []);
}
