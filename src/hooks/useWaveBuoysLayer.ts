import { getWaveBuoyLocations } from '@/api';
import { useToast } from '@/components';
import {
  unclusteredWaveBuoysLayerConfig,
  waveBuoyCluserLabelLayerConfig,
  waveBuoysLayerConfig,
} from '@/config';
import {
  UNCLUSTERED_WAVE_BUOYS_LAYER_ID,
  WAVE_BUOYS_CLUSTER_LABEL_LAYER_ID,
  WAVE_BUOYS_LAYER_ID,
  WAVE_BUOYS_SOURCE_ID,
} from '@/constants';
import { addLayerInOrder, addOrUpdateGeoJsonSource } from '@/helpers';
import { circleLayer, symbolLayer } from '@/layers';
import { useMapUIStore } from '@/store';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';
import { useShallow } from 'zustand/shallow';
import { useDidMountEffect } from './useDidMountEffect';
import { useMapboxLayerSetup } from './useMapboxLayerSetup';
import { useMapboxLayerVisibility } from './useMapboxLayerVisibility';

export function useWaveBuoysLayer(map: React.RefObject<mapboxgl.Map | null>) {
  const [isError, setIsError] = useState(false);
  const { showToast } = useToast();

  const { circle: isBuoyWavesLayerEnabled, dataset } = useMapUIStore(
    useShallow(s => ({
      circle: s.circle,
      dataset: s.dataset,
    })),
  );

  const buoyQuery = useQuery({
    queryKey: ['wave_buoy_locations', dataset],
    queryFn: () => getWaveBuoyLocations(dataset),
    enabled: isBuoyWavesLayerEnabled && dataset !== '',
  });

  const waveBuoysLayer = useMemo(
    () =>
      circleLayer(
        {
          id: WAVE_BUOYS_LAYER_ID,
          source: WAVE_BUOYS_SOURCE_ID,
          ...waveBuoysLayerConfig,
        },
        isBuoyWavesLayerEnabled,
      ),
    [isBuoyWavesLayerEnabled],
  );
  const unClusteredWaveBuoysLayer = useMemo(
    () =>
      circleLayer(
        {
          id: UNCLUSTERED_WAVE_BUOYS_LAYER_ID,
          source: WAVE_BUOYS_SOURCE_ID,
          ...unclusteredWaveBuoysLayerConfig,
        },
        isBuoyWavesLayerEnabled,
      ),
    [isBuoyWavesLayerEnabled],
  );
  const clusterLabelLayer = useMemo(
    () =>
      symbolLayer(
        {
          id: WAVE_BUOYS_CLUSTER_LABEL_LAYER_ID,
          source: WAVE_BUOYS_SOURCE_ID,
          ...waveBuoyCluserLabelLayerConfig,
        },
        isBuoyWavesLayerEnabled,
      ),
    [isBuoyWavesLayerEnabled],
  );
  const buoyLayers = useMemo(
    () => [waveBuoysLayer, unClusteredWaveBuoysLayer, clusterLabelLayer],
    [waveBuoysLayer, unClusteredWaveBuoysLayer, clusterLabelLayer],
  );

  const setDataByDataset = useCallback(async () => {
    try {
      const data = await buoyQuery.promise;
      if (!data) return;
      addOrUpdateGeoJsonSource({
        map: map.current!,
        id: WAVE_BUOYS_SOURCE_ID,
        data,
        enableCluser: true,
        clusterRadius: 40,
      });

      setIsError(false);
    } catch (error) {
      console.error('Error adding layers back after style changes:', error);
      setIsError(true);
      showToast({
        type: 'error',
        title: 'Error occurred',
        message: 'Failed to get buoys locations',
        duration: 6000,
      });
    }
  }, [buoyQuery.promise, map, showToast]);

  const setupLayer = useCallback(async () => {
    if (buoyLayers.some(layer => !layer)) return;
    await setDataByDataset();
    buoyLayers.forEach(layer => addLayerInOrder(map, layer));
  }, [buoyLayers, map, setDataByDataset]);

  const { loadComplete } = useMapboxLayerSetup(map, setupLayer, [waveBuoysLayer]);

  useMapboxLayerVisibility(
    map,
    loadComplete,
    [waveBuoysLayer, unClusteredWaveBuoysLayer, clusterLabelLayer],
    isBuoyWavesLayerEnabled && !isError,
  );

  useDidMountEffect(() => {
    if (!map.current || !loadComplete) return;
    setDataByDataset();
  }, [loadComplete, dataset]);
}
