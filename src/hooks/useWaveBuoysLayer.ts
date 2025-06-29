import { circleLayer, symbolLayer } from '@/layers';
import {
  UNCLUSTERED_WAVE_BUOYS_LAYER_ID,
  WAVE_BUOYS_CLUSTER_LABEL_LAYER_ID,
  WAVE_BUOYS_LAYER_ID,
  WAVE_BUOYS_SOURCE_ID,
} from '@/constants';
import { addLayerInOrder, addOrUpdateGeoJsonSource } from '@/helpers';
import { buildBuoyLocationDatasetUrl, sleep } from '@/utils';
import { useDidMountEffect } from './useDidMountEffect';
import { useMapboxLayerVisibility } from './useMapboxLayerVisibility';
import { useMapboxLayerRef } from './useMapboxLayerRef';
import { useMapboxLayerSetup } from './useMapboxLayerSetup';
import {
  unclusteredWaveBuoysLayerConfig,
  waveBuoyCluserLabelLayerConfig,
  waveBuoysLayerConfig,
} from '@/config';

export function useWaveBuoysLayer(
  map: React.RefObject<mapboxgl.Map | null>,
  circle: boolean,
  style: string,
  dataset: string,
) {
  const setDataByDataset = async () => {
    //fake this function to be async so that it can works.
    await sleep(0);

    addOrUpdateGeoJsonSource({
      map: map.current!,
      id: WAVE_BUOYS_SOURCE_ID,
      url: buildBuoyLocationDatasetUrl(dataset),
      enableCluser: true,
      clusterRadius: 40,
    });
  };

  const setupLayer = async () => {
    if (!waveBuoysLayer.current || !clusterLabelLayer.current) return;
    await setDataByDataset();
    if (!map.current!.getLayer(WAVE_BUOYS_LAYER_ID)) {
      addLayerInOrder(map, waveBuoysLayer.current, WAVE_BUOYS_LAYER_ID);
    }
    if (!map.current!.getLayer(UNCLUSTERED_WAVE_BUOYS_LAYER_ID)) {
      addLayerInOrder(map, unClusteredWaveBuoysLayer.current, UNCLUSTERED_WAVE_BUOYS_LAYER_ID);
    }
    if (!map.current!.getLayer(WAVE_BUOYS_CLUSTER_LABEL_LAYER_ID)) {
      addLayerInOrder(map, clusterLabelLayer.current, WAVE_BUOYS_CLUSTER_LABEL_LAYER_ID);
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

  const unClusteredWaveBuoysLayer = useMapboxLayerRef(
    () =>
      circleLayer(
        {
          id: UNCLUSTERED_WAVE_BUOYS_LAYER_ID,
          source: WAVE_BUOYS_SOURCE_ID,
          ...unclusteredWaveBuoysLayerConfig,
        },
        circle,
      ),
    style,
  );

  const clusterLabelLayer = useMapboxLayerRef(
    () =>
      symbolLayer(
        {
          id: WAVE_BUOYS_CLUSTER_LABEL_LAYER_ID,
          source: WAVE_BUOYS_SOURCE_ID,
          ...waveBuoyCluserLabelLayerConfig,
        },
        circle,
      ),
    style,
  );

  const { loadComplete } = useMapboxLayerSetup(map, setupLayer, [style, dataset]);

  useMapboxLayerVisibility(
    map,
    loadComplete,
    [waveBuoysLayer, unClusteredWaveBuoysLayer, clusterLabelLayer],
    circle,
  );

  useDidMountEffect(() => {
    if (!map.current || !loadComplete) return;
    setDataByDataset();
  }, [loadComplete, dataset]);

  return { waveBuoysLayer };
}
