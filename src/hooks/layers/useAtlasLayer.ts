import type { TilesProduct } from '@/constants';
import { PRODUCTLEGENDS, PRODUCTS, COLOR_OPTIONS, LAYERS_ORDER } from '@/constants';
import { TILE_BASE_URL, getProductManifest } from '@/api';
import { buildProductPalette } from '@/helpers';
import type { AtlasLayerHandle, ScalarAtlasLayerOptions } from '@/AtlasRenderingSystem';
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

/**
 * Factory passed to `useAtlasLayer`. The parameter type is the common
 * scalar-options shape; the particle factory accepts a superset
 * (`ParticleAtlasLayerOptions`) but is assignable here because every extra
 * field on the particle side is optional.
 */
type CreateAtlasLayer<H extends AtlasLayerHandle> = (options: ScalarAtlasLayerOptions) => H;

type UseAtlasLayerParams<H extends AtlasLayerHandle> = {
  map: React.RefObject<mapboxgl.Map | null>;
  product: TilesProduct;
  createLayer: CreateAtlasLayer<H>;
};

type UseAtlasLayerResult<H extends AtlasLayerHandle> = {
  /** Mutable ref to the active layer handle. Null between style-load cycles. */
  handleRef: React.RefObject<H | null>;
  /** True once the layer has been set up on the current map style. */
  loadComplete: boolean;
};

/**
 * Shared lifecycle for atlas-backed Mapbox layers (scalar heatmaps and
 * particle fields). Owns:
 *   - store subscriptions (date, enabled, error, loading, palette, scale)
 *   - product-date-availability sync
 *   - layer setup on `style.load`
 *   - LAYERS_ORDER restacking
 *   - visibility, date-change, palette, and scale effects
 *
 * Returns the handle ref + a `loadComplete` flag so callers can layer in
 * product-specific effects (e.g. particle-config sync) without duplicating
 * the rest of the lifecycle.
 */
export function useAtlasLayer<H extends AtlasLayerHandle>({
  map,
  product,
  createLayer,
}: UseAtlasLayerParams<H>): UseAtlasLayerResult<H> {
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

  const handleRef = useRef<H | null>(null);

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

    handleRef.current = createLayer({
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
  }, [map, layerId, legendRange, product, enabled, loadData, createLayer]);

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

  return { handleRef, loadComplete };
}
