import type { WebGlLayerProduct } from '@/constants';
import { PRODUCTCOLORPALETTES, PRODUCTLEGENDS, PRODUCTS } from '@/constants';
import { S3_BASE_URL, getProductManifest } from '@/api';
import { addLayerInOrder } from '@/helpers';
import { heatmapAtlasLayer } from '@/layers';
import { useMapUIStore, setProductErrorByProduct } from '@/store';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useShallow } from 'zustand/shallow';
import { useDidMountEffect } from '../useDidMountEffect';
import { useMapboxLayerSetup } from './useMapboxLayerSetup';
import { useCustomLayerVisibility } from './useCustomLayerVisibility';
import { useProductDateAvailability } from './useProductDateAvailability';

type UseWebGLHeatmapLayer = {
  map: React.RefObject<mapboxgl.Map | null>;
  layerId: string;
  product: WebGlLayerProduct;
};

export function useWebGLHeatmapLayer({ map, layerId, product }: UseWebGLHeatmapLayer) {
  const { date, enabled, isError } = useMapUIStore(
    useShallow(s => ({
      date: s.date,
      enabled: s.productEnabled[product],
      isError: s.productError[product],
    })),
  );

  const [isLoading, setIsLoading] = useState(false);

  const { isDateAvailable, isMetaManifestLoaded } = useProductDateAvailability(product, date);

  const legendRange = PRODUCTLEGENDS[product].range as [number, number];
  const filePrefix = PRODUCTS[product].bucketPath;
  const tileBaseUrl = `${S3_BASE_URL}/${filePrefix}/${date}`;

  const layer = useMemo(
    () => heatmapAtlasLayer(layerId, PRODUCTCOLORPALETTES[product]),
    [layerId, product],
  );

  const productManifestQuery = useQuery({
    queryKey: [product, date],
    queryFn: () => getProductManifest({ product: filePrefix, date }),
    enabled: !!date && enabled && isDateAvailable,
  });

  useEffect(() => {
    if (!isMetaManifestLoaded) return;
    if (!isDateAvailable) {
      setProductErrorByProduct(product, 'date_unavailable');
    } else if (isError === 'date_unavailable') {
      setProductErrorByProduct(product, null);
    }
  }, [isMetaManifestLoaded, isDateAvailable, product, isError]);

  const setDataByDataset = useCallback(async () => {
    if (!isDateAvailable) {
      setProductErrorByProduct(product, 'date_unavailable');
      return;
    }
    setIsLoading(true);
    setProductErrorByProduct(product, null);
    const manifest = await productManifestQuery.promise.catch(() => {
      setProductErrorByProduct(product, 'fetch_error');
      return null;
    });
    if (!manifest) {
      setIsLoading(false);
      return;
    }
    await layer.setSource(manifest, tileBaseUrl, legendRange).catch(() => {
      setProductErrorByProduct(product, 'fetch_error');
    });
    setIsLoading(false);
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

  return {
    updateLegendRange: (range: [number, number]) => layer.updateLegendRange(range),
  };
}
