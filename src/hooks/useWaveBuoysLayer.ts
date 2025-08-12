import { circleLayer, symbolLayer } from '@/layers';
import {
  UNCLUSTERED_WAVE_BUOYS_LAYER_ID,
  WAVE_BUOYS_CLUSTER_LABEL_LAYER_ID,
  WAVE_BUOYS_LAYER_ID,
  WAVE_BUOYS_SOURCE_ID,
} from '@/constants';
import { addLayerInOrder, addOrUpdateGeoJsonSource } from '@/helpers';
import { useMapboxLayerVisibility } from './useMapboxLayerVisibility';
import { useMapboxLayerSetup } from './useMapboxLayerSetup';
import {
  cacheConfig,
  unclusteredWaveBuoysLayerConfig,
  waveBuoyCluserLabelLayerConfig,
  waveBuoysLayerConfig,
} from '@/config';
import { useToast } from '@/components';
import { getWaveBuoyLocations } from '@/api';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useDidMountEffect } from './useDidMountEffect';
import { selectWaveBuoyLayerStates, useMapUIStore } from '@/store';
import { useShallow } from 'zustand/shallow';

export function useWaveBuoysLayer(map: React.RefObject<mapboxgl.Map | null>) {
  const [isError, setIsError] = useState(false);
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const { style, circle, dataset } = useMapUIStore(useShallow(selectWaveBuoyLayerStates));

  const waveBuoysLayer = useMemo(
    () =>
      circleLayer(
        {
          id: WAVE_BUOYS_LAYER_ID,
          source: WAVE_BUOYS_SOURCE_ID,
          ...waveBuoysLayerConfig,
        },
        circle,
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [style],
  );

  const unClusteredWaveBuoysLayer = useMemo(
    () =>
      circleLayer(
        {
          id: UNCLUSTERED_WAVE_BUOYS_LAYER_ID,
          source: WAVE_BUOYS_SOURCE_ID,
          ...unclusteredWaveBuoysLayerConfig,
        },
        circle,
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [style],
  );

  const clusterLabelLayer = useMemo(
    () =>
      symbolLayer(
        {
          id: WAVE_BUOYS_CLUSTER_LABEL_LAYER_ID,
          source: WAVE_BUOYS_SOURCE_ID,
          ...waveBuoyCluserLabelLayerConfig,
        },
        circle,
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [style],
  );

  const setDataByDataset = useCallback(async () => {
    let buoyData;
    try {
      buoyData = await queryClient.fetchQuery({
        queryKey: ['wave_buoy_locations', dataset],
        queryFn: () => getWaveBuoyLocations(dataset),
        ...cacheConfig(dataset),
      });

      setIsError(false);
    } catch {
      return setIsError(true);
    }
    addOrUpdateGeoJsonSource({
      map: map.current!,
      id: WAVE_BUOYS_SOURCE_ID,
      data: buoyData,
      enableCluser: true,
      clusterRadius: 40,
    });
  }, [dataset, map, queryClient]);

  const setupLayer = useCallback(async () => {
    if (!waveBuoysLayer || !clusterLabelLayer) return;
    await setDataByDataset();
    if (!map.current!.getLayer(WAVE_BUOYS_LAYER_ID)) {
      addLayerInOrder(map, waveBuoysLayer, WAVE_BUOYS_LAYER_ID);
    }
    if (!map.current!.getLayer(UNCLUSTERED_WAVE_BUOYS_LAYER_ID)) {
      addLayerInOrder(map, unClusteredWaveBuoysLayer, UNCLUSTERED_WAVE_BUOYS_LAYER_ID);
    }
    if (!map.current!.getLayer(WAVE_BUOYS_CLUSTER_LABEL_LAYER_ID)) {
      addLayerInOrder(map, clusterLabelLayer, WAVE_BUOYS_CLUSTER_LABEL_LAYER_ID);
    }
  }, [clusterLabelLayer, map, setDataByDataset, unClusteredWaveBuoysLayer, waveBuoysLayer]);

  const { loadComplete } = useMapboxLayerSetup(map, setupLayer, [style]);

  useMapboxLayerVisibility(
    map,
    loadComplete,
    [waveBuoysLayer, unClusteredWaveBuoysLayer, clusterLabelLayer],
    circle && !isError,
  );

  useDidMountEffect(() => {
    if (!map.current || !loadComplete) return;
    setDataByDataset();
  }, [loadComplete, dataset]);

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
