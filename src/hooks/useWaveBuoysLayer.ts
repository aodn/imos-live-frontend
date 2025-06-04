import { circleLayer } from '../layers/circleLayer.ts';
import { GSLA_META_NAME, WAVE_BUOYS_LAYER_ID, WAVE_BUOYS_SOURCE_ID } from '@/constants';
import { addLayerInOrder, addOrUpdateGeoJsonSource } from '@/helpers';
import { buildDatasetUrl, buildOgcBuoysUrl, loadMetaDataFromUrl } from '@/utils';
import { useDidMountEffect } from './useDidMountEffect';
import { useMapboxLayerVisibility } from './useMapboxLayerVisibility';
import { useMapboxLayerRef } from './useMapboxLayerRef';
import { useMapboxLayerSetup } from './useMapboxLayerSetup';
import { layersOrder, waveBuoysLayerConfig } from '@/config';

export function useWaveBuoysLayer(
  map: React.RefObject<mapboxgl.Map | null>,
  circle: boolean,
  style: string,
  dataset: string,
) {
  const setDataByDataset = async () => {
    const { maxBounds } = await loadMetaDataFromUrl(buildDatasetUrl(dataset, GSLA_META_NAME));
    map.current!.setMaxBounds(maxBounds);
    addOrUpdateGeoJsonSource(
      map.current!,
      WAVE_BUOYS_SOURCE_ID,
      buildOgcBuoysUrl('b299cdcd-3dee-48aa-abdd-e0fcdbb9cadc'),
    );
  };

  const setupLayer = async () => {
    if (!waveBuoysLayer.current) return;
    await setDataByDataset();
    if (!map.current!.getLayer(WAVE_BUOYS_LAYER_ID)) {
      addLayerInOrder(map, layersOrder, waveBuoysLayer.current, WAVE_BUOYS_LAYER_ID);
    }
  };

  const waveBuoysLayer = useMapboxLayerRef(
    () =>
      circleLayer(
        {
          id: WAVE_BUOYS_LAYER_ID,
          source: WAVE_BUOYS_SOURCE_ID,
          ...waveBuoysLayerConfig,
        },
        circle,
      ),
    style,
  );

  const { loadComplete } = useMapboxLayerSetup(map, setupLayer, [style, dataset]);

  useMapboxLayerVisibility(map, loadComplete, waveBuoysLayer, circle);

  useDidMountEffect(() => {
    if (!map.current || !loadComplete) return;
    setDataByDataset();
  }, [loadComplete]);

  return { waveBuoysLayer };
}
