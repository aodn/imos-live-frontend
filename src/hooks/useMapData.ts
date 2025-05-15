import { RefObject } from 'react';
import { updateMapData } from '@/helpers';
import { useDidMountEffect } from '@/hooks';
import { VectoryLayerInterface } from '@/layers';
import { buildDatasetUrl, buildOgcBuoysUrl, loadMetaDataFromUrl } from '@/utils';
import { GSLAMETANAME, GSLAPARTICLENAME, GSLASEALEVELNAME } from '@/constants';

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

    const updateDataByDataset = async () => {
      const { maxBounds, bounds, lonRange, latRange, uRange, vRange } = await loadMetaDataFromUrl(
        buildDatasetUrl(dataset, GSLAMETANAME),
      );
      updateMapData(
        {
          particleSource: buildDatasetUrl(dataset, GSLAPARTICLENAME),
          overlaySource: buildDatasetUrl(dataset, GSLASEALEVELNAME),
          waveBuoysSource: buildOgcBuoysUrl('b299cdcd-3dee-48aa-abdd-e0fcdbb9cadc'),
          // waveBuoysSource: buildOgcBuoysUrl('/wave_buoys.geojson'),
        },
        { maxBounds, bounds, lonRange, latRange, uRange, vRange },
        map.current!,
        particleLayer,
      );
    };

    updateDataByDataset();
  }, [loadComplete, dataset]);
}
