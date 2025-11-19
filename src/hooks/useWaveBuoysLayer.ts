import { getWaveBuoyLocations } from '@/api';
import {
  unclusteredWaveBuoysLayerConfig,
  waveBuoyCluserLabelLayerConfig,
  waveBuoysLayerConfig,
} from '@/config';
import {
  BuoyLayer,
  BuoySource,
  Product,
  UNCLUSTERED_WAVE_BUOYS_LAYER_ID,
  WAVE_BUOYS_CLUSTER_LABEL_LAYER_ID,
} from '@/constants';
import { addLayerInOrder, addOrUpdateGeoJsonSource } from '@/helpers';
import { circleLayer, symbolLayer } from '@/layers';
import { useMapUIStore, setProductErrorByProduct } from '@/store';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { useShallow } from 'zustand/shallow';
import { useDidMountEffect } from './useDidMountEffect';
import { useMapboxLayerSetup } from './useMapboxLayerSetup';
import { useMapboxLayerVisibility } from './useMapboxLayerVisibility';
import dayjs from 'dayjs';

type UseWaveBuoysLayer = {
  map: React.RefObject<mapboxgl.Map | null>;
  layerId: BuoyLayer;
  sourceId: BuoySource;
  product: Product;
};

export function useWaveBuoysLayer({ map, layerId, sourceId, product }: UseWaveBuoysLayer) {
  const { enabled, date, isError } = useMapUIStore(
    useShallow(s => ({
      enabled: s.productEnabled[product],
      date: s.date,
      isError: s.productError[product],
    })),
  );
  const buoyQuery = useQuery({
    queryKey: ['wave_buoy_locations', date],
    queryFn: () => getWaveBuoyLocations(dayjs(date).toISOString()),
    enabled: enabled && date !== '',
  });

  const waveBuoysLayer = useMemo(
    () =>
      circleLayer(
        {
          id: layerId,
          source: sourceId,
          ...waveBuoysLayerConfig,
        },
        enabled,
      ),
    [enabled, layerId, sourceId],
  );
  const unClusteredWaveBuoysLayer = useMemo(
    () =>
      circleLayer(
        {
          id: UNCLUSTERED_WAVE_BUOYS_LAYER_ID,
          source: sourceId,
          ...unclusteredWaveBuoysLayerConfig,
        },
        enabled,
      ),
    [enabled, sourceId],
  );
  const clusterLabelLayer = useMemo(
    () =>
      symbolLayer(
        {
          id: WAVE_BUOYS_CLUSTER_LABEL_LAYER_ID,
          source: sourceId,
          ...waveBuoyCluserLabelLayerConfig,
        },
        enabled,
      ),
    [enabled, sourceId],
  );
  const buoyLayers = useMemo(
    () => [waveBuoysLayer, unClusteredWaveBuoysLayer, clusterLabelLayer],
    [waveBuoysLayer, unClusteredWaveBuoysLayer, clusterLabelLayer],
  );

  const setDataByDataset = useCallback(async () => {
    try {
      const data = await buoyQuery.promise;
      addOrUpdateGeoJsonSource({
        map: map.current!,
        id: sourceId,
        data,
        enableCluser: true,
        clusterRadius: 40,
      });
      setProductErrorByProduct(Product.WAVE_BUOYS, false);
    } catch (error) {
      console.error('Error adding wave buoys layer', error);
      setProductErrorByProduct(Product.WAVE_BUOYS, true);
    }
  }, [buoyQuery.promise, map, sourceId]);

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
    enabled && !isError,
  );

  useDidMountEffect(() => {
    if (!map.current || !loadComplete) return;
    setDataByDataset();
  }, [loadComplete, date]);
}
