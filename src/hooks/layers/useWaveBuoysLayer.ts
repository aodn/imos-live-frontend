import { getWaveBuoyLocations } from '@/api';
import {
  UNCLUSTERED_WAVE_BUOYS_LAYER_CONFIG,
  WAVE_BUOY_CLUSTER_LABEL_LAYER_CONFIG,
  WAVE_BUOYS_LAYER_CONFIG,
} from '@/config';
import type { BuoyLayer, BuoySource, ProductType } from '@/constants';
import {
  PRODUCT,
  UNCLUSTERED_WAVE_BUOYS_LAYER_ID,
  WAVE_BUOYS_CLUSTER_LABEL_LAYER_ID,
} from '@/constants';
import { addLayerInOrder, addOrUpdateGeoJsonSource } from '@/helpers';
import { circleLayer, symbolLayer } from '@/layers';
import { useMapUIStore, setProductErrorByProduct } from '@/store';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { useShallow } from 'zustand/shallow';
import { useDidMountEffect } from '../useDidMountEffect';
import { useMapboxLayerSetup } from './useMapboxLayerSetup';
import { useMapboxLayerVisibility } from './useMapboxLayerVisibility';
import dayjs from 'dayjs';

type UseWaveBuoysLayer = {
  map: React.RefObject<mapboxgl.Map | null>;
  layerId: BuoyLayer;
  sourceId: BuoySource;
  product: ProductType;
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
    enabled: enabled && !!date,
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
    // when error thrown no break code but set fallback to data.
    // this can fix the bug that when sylte change, or switch from
    // date no data to date owning data buouys displaying or hiding unexpectedly.
    const data = await buoyQuery.promise.catch(() => {
      setProductErrorByProduct(PRODUCT.WAVE_BUOYS, true);
      return {
        type: 'FeatureCollection',
        features: [],
      } as GeoJSON.FeatureCollection;
    });

    addOrUpdateGeoJsonSource({
      map: map.current!,
      id: sourceId,
      data,
      enableCluser: true,
      clusterRadius: 40,
    });
  }, [buoyQuery.promise, map, sourceId]);

  const setupLayer = useCallback(async () => {
    if (buoyLayers.some(layer => !layer)) return;
    if (enabled) {
      await setDataByDataset();
    } else {
      // add empty source to make sure layer can be added to map and show up when enabled is toggled on, this can fix the bug that wave buoy layer fail to appear when toggle on after toggle off.
      addOrUpdateGeoJsonSource({
        map: map.current!,
        id: sourceId,
        data: { type: 'FeatureCollection', features: [] },
        enableCluser: true,
        clusterRadius: 40,
      });
    }
    buoyLayers.forEach(layer => addLayerInOrder(map, layer));
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
    setDataByDataset();
  }, [loadComplete, date, enabled]);
}
