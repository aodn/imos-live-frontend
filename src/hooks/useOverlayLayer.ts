import { OVERLAY_LAYER_CONFIG } from '@/config';
import { OverlayLayer, OverlaySource, ProductType } from '@/constants';
import { addLayerInOrder, addOrUpdateWMSSource, rasterUrl } from '@/helpers';
import { imageLayer } from '@/layers';
import { useMapUIStore } from '@/store';
import { useCallback, useMemo } from 'react';
import { useShallow } from 'zustand/shallow';
import { useDidMountEffect } from './useDidMountEffect';
import { useMapboxLayerSetup } from './useMapboxLayerSetup';
import { useMapboxLayerVisibility } from './useMapboxLayerVisibility';

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
  const overlayLayer = useMemo(
    () => imageLayer({ id: layerId, source: sourceId, ...OVERLAY_LAYER_CONFIG }, enabled),
    [layerId, sourceId, enabled],
  );

  const setDataByDataset = useCallback(async () => {
    // this will not throw any error and return invalid url when there is error instead.
    // when invalid url, useOverlayProductErrorDetect will handle it, So that addOrUpdateWMSSource
    // will always add source to map. This can fix the bug that overlay layer fail to appear when
    // jump from date no data to date owning data.
    const url = await rasterUrl(sourceId, new Date(date));
    addOrUpdateWMSSource({ map: map.current!, url, sourceId });
  }, [date, map, sourceId]);

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
