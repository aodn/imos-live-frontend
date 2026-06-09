import { getLatestWaveBuoySites, getWaveBuoySitesByDate } from '@/api';
import type { BuoyLayer, BuoySource, ProductType } from '@/constants';
import {
  PRODUCT,
  PRODUCTS,
  UNCLUSTERED_WAVE_BUOYS_LAYER_CONFIG,
  WAVE_BUOY_CLUSTER_LABEL_LAYER_CONFIG,
  WAVE_BUOYS_LAYER_CONFIG,
  UNCLUSTERED_WAVE_BUOYS_LAYER_ID,
  WAVE_BUOYS_CLUSTER_LABEL_LAYER_ID,
} from '@/constants';
import {
  addLayerInOrder,
  addOrUpdateGeoJsonSource,
  mergeAndFilterBuoyFeatures,
  normalizeWaveBuoyDates,
} from '@/helpers';
import { circleLayer, symbolLayer } from '@/layers';
import { useMapUIStore, setProductErrorByProduct } from '@/store';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { useShallow } from 'zustand/shallow';
import { useDidMountEffect } from '../common';
import { useMapboxLayerSetup } from './useMapboxLayerSetup';
import { useMapboxLayerVisibility } from './useMapboxLayerVisibility';
import allWaveBuoySitesBackup from '@/assets/wave_buoy_all_sites.json';
import type { WaveBuoySiteFeatureCollection } from '@/types';

type UseWaveBuoysLayer = {
  map: React.RefObject<mapboxgl.Map | null>;
  product: ProductType;
};

export function useWaveBuoysLayer({ map, product }: UseWaveBuoysLayer) {
  const { layerId, sourceId } = PRODUCTS[product] as {
    layerId: BuoyLayer;
    sourceId: BuoySource;
  };
  const { enabled, date, isError } = useMapUIStore(
    useShallow(s => ({
      enabled: s.productEnabled[product],
      date: s.date,
      isError: s.productError[product],
    })),
  );

  const buoySiteQuery = useQuery({
    queryKey: ['wave_buoy_sites_by_date', date],
    queryFn: () => getWaveBuoySitesByDate(date),
    enabled: enabled && !!date,
  });

  const allWaveBuoySitesQuery = useQuery({
    queryKey: ['wave_buoy_sites_all'],
    queryFn: async (): Promise<WaveBuoySiteFeatureCollection> => {
      try {
        return await getLatestWaveBuoySites();
      } catch {
        return normalizeWaveBuoyDates(allWaveBuoySitesBackup as WaveBuoySiteFeatureCollection);
      }
    },
    enabled: enabled,
  });

  const waveBuoysLayer = useMemo(
    () =>
      circleLayer(
        {
          id: layerId,
          source: sourceId,
          ...WAVE_BUOYS_LAYER_CONFIG,
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
          ...UNCLUSTERED_WAVE_BUOYS_LAYER_CONFIG,
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
          ...WAVE_BUOY_CLUSTER_LABEL_LAYER_CONFIG,
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
    setProductErrorByProduct(PRODUCT.WAVE_BUOYS, false);
    // when error thrown no break code but set fallback to empty collection.
    // this can fix the bug that when style changes, or switching from
    // date no data to date owning data buoys displaying or hiding unexpectedly.
    const buoySitesPromise = buoySiteQuery.promise.catch(() => {
      setProductErrorByProduct(PRODUCT.WAVE_BUOYS, true);
      return {
        type: 'FeatureCollection' as const,
        features: [],
      };
    });

    const [allBuoySites, buoySites] = await Promise.all([
      allWaveBuoySitesQuery.promise,
      buoySitesPromise,
    ]);

    addOrUpdateGeoJsonSource({
      map: map.current!,
      id: sourceId,
      data: {
        ...allBuoySites,
        features: mergeAndFilterBuoyFeatures(allBuoySites, buoySites, date),
      },
      enableCluster: true,
      clusterRadius: 40,
    });
  }, [allWaveBuoySitesQuery.promise, buoySiteQuery.promise, date, map, sourceId]);

  const setupLayer = useCallback(async () => {
    if (buoyLayers.some(layer => !layer)) return;
    // Always add layers immediately with an empty source so the layer is registered on the
    // map without blocking on API responses. Data is filled in asynchronously by setDataByDataset.
    addOrUpdateGeoJsonSource({
      map: map.current!,
      id: sourceId,
      data: { type: 'FeatureCollection', features: [] },
      enableCluster: true,
      clusterRadius: 40,
    });
    buoyLayers.forEach(layer => addLayerInOrder(map, layer));
    if (enabled) {
      void setDataByDataset();
    }
  }, [buoyLayers, enabled, map, setDataByDataset, sourceId]);

  const { loadComplete } = useMapboxLayerSetup(map, setupLayer, [setupLayer]);

  useMapboxLayerVisibility(
    map,
    loadComplete,
    [waveBuoysLayer, unClusteredWaveBuoysLayer, clusterLabelLayer],
    enabled && !isError,
  );

  useDidMountEffect(() => {
    if (!map.current || !loadComplete || !enabled) return;
    void setDataByDataset();
  }, [loadComplete, date, enabled]);
}
