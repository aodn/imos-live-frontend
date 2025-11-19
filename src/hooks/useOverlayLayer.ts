import { overlayLayerConfig } from '@/config';
import { OverlayLayer, OverlaySource, Product } from '@/constants';
import { addLayerInOrder, addOrUpdateWMSSource } from '@/helpers';
import { imageLayer } from '@/layers';
import { useMapUIStore, setProductErrorByProduct } from '@/store';
import { useCallback, useMemo } from 'react';
import { useShallow } from 'zustand/shallow';
import { useDidMountEffect } from './useDidMountEffect';
import { useMapboxLayerSetup } from './useMapboxLayerSetup';
import { useMapboxLayerVisibility } from './useMapboxLayerVisibility';

type UseOverlayLayer = {
  map: React.RefObject<mapboxgl.Map | null>;
  layerId: OverlayLayer;
  sourceId: OverlaySource;
  product: Product;
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
    () => imageLayer({ id: layerId, source: sourceId, ...overlayLayerConfig }, enabled),
    [layerId, enabled, sourceId],
  );

  const setDataByDataset = useCallback(async () => {
    setProductErrorByProduct(product, false);
    await addOrUpdateWMSSource({ map: map.current!, date, overlaySource: sourceId });
  }, [date, map, product, sourceId]);

  const setupLayer = useCallback(async () => {
    if (!overlayLayer) return;
    await setDataByDataset();
    addLayerInOrder(map, overlayLayer);
  }, [map, overlayLayer, setDataByDataset]);

  const { loadComplete } = useMapboxLayerSetup(map, setupLayer, [overlayLayer]);

  useMapboxLayerVisibility(map, loadComplete, [overlayLayer], enabled && !isError);

  useDidMountEffect(() => {
    if (!map.current || !loadComplete) return;
    setDataByDataset();
  }, [loadComplete, date]);
}
