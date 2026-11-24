import {
  SITE_CLUSTER_LABEL_LAYER_ID,
  SITE_CLUSTER_LABEL_LAYER_CONFIG,
  SITE_CLUSTER_LAYER_CONFIG,
  SITE_CLUSTER_LAYER_ID,
  SITE_CLUSTER_SOURCE_ID,
} from '@/constants';
import { addLayerInOrder, updateSiteClusterSource } from '@/helpers';
import { createLayer, symbolLayer } from '@/layers';
import { useCallback, useMemo } from 'react';
import { useMapboxLayerSetup } from './useMapboxLayerSetup';
import { useMapboxLayerVisibility } from './useMapboxLayerVisibility';
import type { CircleLayerSpecification, SymbolLayerSpecification } from 'mapbox-gl';

/**
 * Cluster circle and count label shared by all site products, so wave buoys and
 * moorings that are close together group into one cluster. `enabled` is true when
 * any site product is on.
 */
export function useSiteClusterLayer(map: React.RefObject<mapboxgl.Map | null>, enabled: boolean) {
  const layers = useMemo(
    () => [
      createLayer<CircleLayerSpecification | SymbolLayerSpecification>(
        SITE_CLUSTER_LAYER_CONFIG.type,
      )(
        { id: SITE_CLUSTER_LAYER_ID, source: SITE_CLUSTER_SOURCE_ID, ...SITE_CLUSTER_LAYER_CONFIG },
        enabled,
      ),
      symbolLayer(
        {
          id: SITE_CLUSTER_LABEL_LAYER_ID,
          source: SITE_CLUSTER_SOURCE_ID,
          ...SITE_CLUSTER_LABEL_LAYER_CONFIG,
        },
        enabled,
      ),
    ],
    [enabled],
  );

  const setupLayer = useCallback(async () => {
    if (layers.some(layer => !layer)) return;
    updateSiteClusterSource(map.current!);
    layers.forEach(layer => addLayerInOrder(map, layer));
  }, [layers, map]);

  const { loadComplete } = useMapboxLayerSetup(map, setupLayer, [setupLayer]);

  useMapboxLayerVisibility(map, loadComplete, layers, enabled);
}
