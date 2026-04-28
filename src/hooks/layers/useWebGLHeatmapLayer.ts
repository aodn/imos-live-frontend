import type { WebGlLayerProduct } from '@/constants';
import { PRODUCTLEGENDS, PRODUCTS } from '@/constants';
import { COLOR_OPTIONS } from '@/config';
import { S3_BASE_URL, getProductManifest } from '@/api';
import { addLayerInOrder, buildProductPalette } from '@/helpers';
import { heatmapAtlasLayer } from '@/layers';
import {
  useMapUIStore,
  setProductErrorByProduct,
  setProductLoadingByProduct,
  getProductLegend,
} from '@/store';
import { useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useShallow } from 'zustand/shallow';
import { useDidMountEffect } from '../useDidMountEffect';
import { useMapboxLayerSetup } from './useMapboxLayerSetup';
import { useCustomLayerVisibility } from './useCustomLayerVisibility';
import { useProductDateAvailabilitySync } from './useProductDateAvailabilitySync';

type UseWebGLHeatmapLayer = {
  map: React.RefObject<mapboxgl.Map | null>;
  layerId: string;
  product: WebGlLayerProduct;
};

// Error detection operates at two levels:
//
// Level 1 — date availability:
//   useProductDateAvailabilitySync queries the cached metadata manifest and syncs the error
//   state automatically — sets it when the date is absent, clears it when valid. productManifestQuery
//   is also gated on isDateAvailable to skip a redundant fetch for a known-bad date.
//
// Level 2 — tile/image loading:
//   Even when a date is listed as available, the product manifest fetch or the tile image
//   loads inside layer.setSource can still fail. These are caught inside setDataByDataset,
//   independent of date availability.
export function useWebGLHeatmapLayer({ map, layerId, product }: UseWebGLHeatmapLayer) {
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
  const filePrefix = PRODUCTS[product].bucketPath;
  const tileBaseUrl = `${S3_BASE_URL}/${filePrefix}/${date}`;

  const layer = useMemo(
    () => heatmapAtlasLayer(layerId, buildProductPalette(getProductLegend(product))),
    [layerId, product],
  );

  const productManifestQuery = useQuery({
    queryKey: [product, date],
    queryFn: () => getProductManifest({ product: filePrefix, date }),
    enabled: !!date && enabled && isDateAvailable,
  });

  const setDataByDataset = useCallback(async () => {
    if (!isDateAvailable) {
      setProductErrorByProduct(product, true);
      return;
    }
    setProductLoadingByProduct(product, true);
    const manifest = await productManifestQuery.promise.catch(() => {
      setProductErrorByProduct(product, true);
      return null;
    });
    if (!manifest) {
      setProductLoadingByProduct(product, false);
      return;
    }
    await layer.setSource(manifest, tileBaseUrl, legendRange).catch(() => {
      setProductErrorByProduct(product, true);
    });
    setProductLoadingByProduct(product, false);
  }, [productManifestQuery.promise, layer, tileBaseUrl, legendRange, product, isDateAvailable]);

  const setupLayer = useCallback(async () => {
    if (!map.current!.getLayer(layer.id)) {
      addLayerInOrder(map, layer);
    }
    if (enabled) await setDataByDataset();
  }, [map, layer, setDataByDataset, enabled]);

  const { loadComplete } = useMapboxLayerSetup(map, setupLayer, [setupLayer]);

  useCustomLayerVisibility(map, loadComplete, layer, enabled && !isError && !isLoading);

  useDidMountEffect(() => {
    if (!map.current || !loadComplete || !enabled) return;
    setDataByDataset();
  }, [loadComplete, enabled, date]);

  // Customize on visualisation configs
  useDidMountEffect(() => {
    if (!loadComplete) return;
    layer.updatePalette({ rawColors: COLOR_OPTIONS[colorKey] });
  }, [colorKey, loadComplete]);

  useDidMountEffect(() => {
    if (!loadComplete) return;
    layer.updatePalette({ scale: legendScale });
  }, [legendScale, loadComplete]);
}
