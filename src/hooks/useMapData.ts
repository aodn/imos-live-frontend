import { RefObject } from 'react';
import { updateSourceByDataset } from '@/helpers';
import { useDidMountEffect } from '@/hooks';
import { VectoryLayerInterface } from '@/layers';

/**
 * When the dataset changes, we need to update the layers with the new dataset.
 * We also need to avoid the initial call to fetchDataset which is done in the
 * style.load event.
 */
export function useMapData(
  map: RefObject<mapboxgl.Map | null>,
  dataset: string,
  loadComplete: boolean,
  particleLayer: RefObject<VectoryLayerInterface | null>,
) {
  useDidMountEffect(() => {
    if (!map.current || !loadComplete || !particleLayer.current) return;
    updateSourceByDataset(dataset, map.current, particleLayer);
  }, [loadComplete, dataset]);
}
