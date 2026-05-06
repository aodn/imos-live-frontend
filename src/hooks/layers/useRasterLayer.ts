import { RASTER_LAYER_CONFIG } from '@/config';
import { type RasterLayer, type RasterSource, type ProductType, PRODUCTS } from '@/constants';
import type { RasterDataType } from '@/helpers';
import { addLayerInOrder, addOrUpdateWMSSource, rasterUrl } from '@/helpers';
import { imageLayer } from '@/layers';
import { useMapUIStore } from '@/store';
import { useCallback, useMemo } from 'react';
import { useShallow } from 'zustand/shallow';
import { useMapboxLayerSetup } from './useMapboxLayerSetup';
import { useMapboxLayerVisibility } from './useMapboxLayerVisibility';
import { useDidMountEffect } from '../useDidMountEffect';

type UseRasterLayer = {
  map: React.RefObject<mapboxgl.Map | null>;
  product: ProductType;
};

export function useRasterLayer({ map, product }: UseRasterLayer) {
  const { layerId, sourceId, dataType } = PRODUCTS[product] as {
    layerId: RasterLayer;
    sourceId: RasterSource;
    dataType: RasterDataType;
  };
  const { date, enabled, isError } = useMapUIStore(
    useShallow(s => ({
      date: s.date,
      enabled: s.productEnabled[product],
      isError: s.productError[product],
    })),
  );

  const rasterLayer = useMemo(
    () => imageLayer({ id: layerId, source: sourceId, ...RASTER_LAYER_CONFIG }, enabled),
    [layerId, sourceId, enabled],
  );

  const setDataByDataset = useCallback(async () => {
    // this will not throw any error and return invalid url when there is error instead.
    // when invalid url, useRasterProductErrorDetect will handle it, So that addOrUpdateWMSSource
    // will always add source to map. This can fix the bug that raster layer fail to appear when
    // jump from date no data to date owning data.
    const url = await rasterUrl(sourceId, new Date(date), dataType);
    addOrUpdateWMSSource({ map: map.current!, url, sourceId });
  }, [dataType, date, map, sourceId]);

  const setupLayer = useCallback(async () => {
    if (!rasterLayer) return;
    await setDataByDataset();
    addLayerInOrder(map, rasterLayer);
  }, [map, rasterLayer, setDataByDataset]);

  const { loadComplete } = useMapboxLayerSetup(map, setupLayer, [setupLayer]);

  useMapboxLayerVisibility(map, loadComplete, [rasterLayer], enabled && !isError);

  useDidMountEffect(() => {
    if (!map.current || !loadComplete) return;
    setDataByDataset();
  }, [loadComplete, date]);
}
