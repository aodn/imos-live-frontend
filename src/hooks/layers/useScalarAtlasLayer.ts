import type { TilesProduct } from '@/constants';
import { PRODUCTLEGENDS, PRODUCTS } from '@/constants';
import { COLOR_OPTIONS, LAYERS_ORDER } from '@/config';
import { getProductManifest, TILE_BASE_URL } from '@/api';
import { buildProductPalette } from '@/helpers';
import { createScalarAtlasLayer } from '@/AtlasRenderingSystem';
import type { AtlasLayerHandle } from '@/AtlasRenderingSystem';
import {
  useMapUIStore,
  setProductErrorByProduct,
  setProductLoadingByProduct,
  getProductLegend,
} from '@/store';
import { useCallback, useEffect, useRef } from 'react';
import { useShallow } from 'zustand/shallow';
import { useDidMountEffect } from '../useDidMountEffect';
import { useMapboxLayerSetup } from './useMapboxLayerSetup';
import { useProductDateAvailabilitySync } from './useProductDateAvailabilitySync';

type UseScalarAtlasLayer = {
  map: React.RefObject<mapboxgl.Map | null>;
  product: TilesProduct;
};

export function useScalarAtlasLayer({ map, product }: UseScalarAtlasLayer) {
  const { layerId } = PRODUCTS[product];
  const { date, enabled, isError, isLoading, colorKey, legendScale } = useMapUIStore(
    useShallow(s => ({
      date: s.date,
      enabled: s.productEnabled[product],
      isError: s.productError[product],
      isLoading: s.productLoading[product],
      colorKey: s.productLegends[product].colorKey,
      legendScale: s.productLegends[product].scale,
    })),
  );

  const { isDateAvailable } = useProductDateAvailabilitySync(product, date);

  const legendRange = PRODUCTLEGENDS[product].range as [number, number];

  const handleRef = useRef<AtlasLayerHandle | null>(null);

  const loadData = useCallback(async () => {
    if (!handleRef.current) return;
    if (!isDateAvailable) {
      setProductErrorByProduct(product, true);
      return;
    }
    setProductLoadingByProduct(product, true);
    await handleRef.current.setSource(date).catch(() => {
      setProductErrorByProduct(product, true);
    });
    setProductLoadingByProduct(product, false);
  }, [date, isDateAvailable, product]);

  const setupLayer = useCallback(async () => {
    handleRef.current?.destroy();

    handleRef.current = createScalarAtlasLayer({
      map: map.current!,
      layerId,
      fetchManifest: d => getProductManifest({ product, date: d }),
      tileBaseUrl: `${TILE_BASE_URL}/${product}`,
      colorPalette: buildProductPalette(getProductLegend(product)),
      legendRange,
    });

    LAYERS_ORDER.forEach(id => {
      if (map.current?.getLayer(id)) map.current.moveLayer(id);
    });

    if (enabled) await loadData();
  }, [map, layerId, legendRange, product, enabled, loadData]);

  const { loadComplete } = useMapboxLayerSetup(map, setupLayer, [setupLayer]);

  // Visibility
  useEffect(() => {
    if (!loadComplete) return;
    handleRef.current?.setVisible(enabled && !isError && !isLoading);
  }, [loadComplete, enabled, isError, isLoading]);

  // Date change
  useDidMountEffect(() => {
    if (!loadComplete || !enabled) return;
    loadData();
  }, [loadComplete, enabled, date]);

  // Colour key change
  useDidMountEffect(() => {
    if (!loadComplete) return;
    handleRef.current?.updatePalette({ rawColors: COLOR_OPTIONS[colorKey] });
  }, [colorKey, loadComplete]);

  // Scale change
  useDidMountEffect(() => {
    if (!loadComplete) return;
    handleRef.current?.updatePalette({ scale: legendScale });
  }, [legendScale, loadComplete]);
}
