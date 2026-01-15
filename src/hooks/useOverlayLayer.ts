import { OVERLAY_LAYER_CONFIG } from '@/config';
import type { OverlayLayer, OverlaySource, ProductType } from '@/constants';
import { addLayerInOrder, addOrUpdateWMSSource, rasterUrl } from '@/helpers';
import { imageLayer } from '@/layers';
import { useMapUIStore } from '@/store';
import { useCallback, useMemo } from 'react';
import { useShallow } from 'zustand/shallow';
import { useMapboxLayerSetup } from './useMapboxLayerSetup';
import { useMapboxLayerVisibility } from './useMapboxLayerVisibility';
import { useQuery } from '@tanstack/react-query';
import { useDidMountEffect } from './useDidMountEffect';

type UseOverlayLayer = {
  map: React.RefObject<mapboxgl.Map | null>;
  layerId: OverlayLayer;
  sourceId: OverlaySource;
  product: ProductType;
};

export function useOverlayLayer({ map, layerId, sourceId, product }: UseOverlayLayer) {
  const { date, enabled, isError } = useMapUIStore(
    useShallow(s => ({
      date: s.date,
      enabled: s.productEnabled[product],
      isError: s.productError[product],
    })),
  );

  const urlQuery = useQuery({
    queryKey: ['rasterUrl', sourceId, date],
    queryFn: async () => {
      const urlResult = await rasterUrl(sourceId, new Date(date));
      return urlResult;
    },
    enabled: enabled && !!date,
  });

  const overlayLayer = useMemo(
    () => imageLayer({ id: layerId, source: sourceId, ...OVERLAY_LAYER_CONFIG }, enabled),
    [layerId, sourceId, enabled],
  );

  const setDataByDataset = useCallback(async () => {
    // this will not throw any error and return invalid url when there is error instead.
    // when invalid url, useOverlayProductErrorDetect will handle it, So that addOrUpdateWMSSource
    // will always add source to map. This can fix the bug that overlay layer fail to appear when
    // jump from date no data to date owning data.
    const url = await urlQuery.promise;
    if (!url) return;
    addOrUpdateWMSSource({ map: map.current!, url, sourceId });
  }, [urlQuery.promise, map, sourceId]);

  const setupLayer = useCallback(async () => {
    if (!overlayLayer) return;
    await setDataByDataset();
    addLayerInOrder(map, overlayLayer);
  }, [map, overlayLayer, setDataByDataset]);

  const { loadComplete } = useMapboxLayerSetup(map, setupLayer, [setupLayer]);

  useMapboxLayerVisibility(map, loadComplete, [overlayLayer], enabled && !isError);

  useDidMountEffect(() => {
    if (!map.current || !loadComplete) return;
    setDataByDataset();
  }, [loadComplete, date]);
}
