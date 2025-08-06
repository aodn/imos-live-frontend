import { circleLayer, symbolLayer } from '@/layers';
import {
  UNCLUSTERED_WAVE_BUOYS_LAYER_ID,
  WAVE_BUOYS_CLUSTER_LABEL_LAYER_ID,
  WAVE_BUOYS_LAYER_ID,
  WAVE_BUOYS_SOURCE_ID,
} from '@/constants';
import { addLayerInOrder, addOrUpdateGeoJsonSource } from '@/helpers';
import { useMapboxLayerVisibility } from './useMapboxLayerVisibility';
import { useMapboxLayerRef } from './useMapboxLayerRef';
import { useMapboxLayerSetup } from './useMapboxLayerSetup';
import {
  cacheConfig,
  unclusteredWaveBuoysLayerConfig,
  waveBuoyCluserLabelLayerConfig,
  waveBuoysLayerConfig,
} from '@/config';
import { useToast } from '@/components';
import { getWaveBuoyLocations } from '@/api';
import { useCallback, useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export function useWaveBuoysLayer(
  map: React.RefObject<mapboxgl.Map | null>,
  circle: boolean,
  style: string,
  dataset: string,
) {
  const [isError, setIsError] = useState(false);
  const { showToast } = useToast();

  const queryClient = useQueryClient();

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

  const setDataByDataset = useCallback(async () => {
    try {
      const buoyData = await queryClient.fetchQuery({
        queryKey: ['wave_buoy_locations', dataset],
        queryFn: () => getWaveBuoyLocations(dataset),
        ...cacheConfig(dataset),
      });
      await addOrUpdateGeoJsonSource({
        map: map.current!,
        id: WAVE_BUOYS_SOURCE_ID,
        data: buoyData,
        enableCluser: true,
        clusterRadius: 40,
      });
      setIsError(false);
    } catch {
      setIsError(true);
    }
  }, [dataset, map, queryClient]);

  const setupLayer = useCallback(async () => {
    if (!waveBuoysLayer?.current || !clusterLabelLayer?.current) return;
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
  }, [clusterLabelLayer, map, setDataByDataset, unClusteredWaveBuoysLayer, waveBuoysLayer]);

  const { loadComplete } = useMapboxLayerSetup(map, setupLayer, [style, dataset]);

  useMapboxLayerVisibility(
    map,
    loadComplete,
    [waveBuoysLayer, unClusteredWaveBuoysLayer, clusterLabelLayer],
    circle && !isError,
  );

  useEffect(() => {
    if (isError)
      showToast({
        type: 'error',
        title: 'Error occurred',
        message: 'Failed to get buoys locations',
        duration: 6000,
      });
  }, [isError, showToast]);

  return { waveBuoysLayer };
}
