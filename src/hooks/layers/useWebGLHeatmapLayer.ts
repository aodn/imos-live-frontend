import type { WebGlLayerProduct } from '@/constants';
import { PRODUCTCOLORPALETTES, PRODUCTLEGENDS } from '@/constants';
import { getHeatmapAtlasManifest } from '@/api';
import { addLayerInOrder } from '@/helpers';
import { heatmapAtlasLayer } from '@/layers';
import { useMapUIStore, setProductErrorByProduct } from '@/store';
import { useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useShallow } from 'zustand/shallow';
import { useDidMountEffect } from '../useDidMountEffect';
import { useMapboxLayerSetup } from './useMapboxLayerSetup';
import { useCustomLayerVisibility } from './useCustomLayerVisibility';

type UseWebGLHeatmapLayer = {
  map: React.RefObject<mapboxgl.Map | null>;
  layerId: string;
  product: WebGlLayerProduct;
  /** Public path to the directory containing the manifest and chunk PNGs. */
  baseUrl: string;
  /** Chunk filename prefix, e.g. 'sea_level_anomaly' or 'ssta'. */
  filePrefix: string;
  /** React Query cache key — must be unique per product. */
  queryKey: string;
};

export function useWebGLHeatmapLayer({
  map,
  layerId,
  product,
  baseUrl,
  filePrefix,
  queryKey,
}: UseWebGLHeatmapLayer) {
  const { date, enabled, isError } = useMapUIStore(
    useShallow(s => ({
      date: s.date,
      enabled: s.productEnabled[product],
      isError: s.productError[product],
    })),
  );

  const layer = useMemo(
    () => heatmapAtlasLayer(layerId, PRODUCTCOLORPALETTES[product]),
    [layerId, product],
  );

  const manifestQuery = useQuery({
    queryKey: [queryKey, date],
    queryFn: () => getHeatmapAtlasManifest(baseUrl),
    enabled: !!date,
  });

  const legendRange = PRODUCTLEGENDS[product].range as [number, number];

  const setDataByDataset = useCallback(async () => {
    setProductErrorByProduct(product, false);
    const manifest = await manifestQuery.promise.catch(() => {
      setProductErrorByProduct(product, true);
      return null;
    });
    if (!manifest) return;
    await layer.setSource(manifest, baseUrl, filePrefix, legendRange).catch(() => {
      setProductErrorByProduct(product, true);
    });
  }, [manifestQuery.promise, layer, baseUrl, filePrefix, legendRange, product]);

  const setupLayer = useCallback(async () => {
    if (!map.current!.getLayer(layer.id)) {
      addLayerInOrder(map, layer);
    }
    await setDataByDataset();
  }, [map, layer, setDataByDataset]);

  const { loadComplete } = useMapboxLayerSetup(map, setupLayer, [setupLayer]);

  useCustomLayerVisibility(map, loadComplete, layer, enabled && !isError);

  useDidMountEffect(() => {
    if (!map.current || !loadComplete) return;
    setDataByDataset();
  }, [loadComplete, date]);

  return {
    updateLegendRange: (range: [number, number]) => layer.updateLegendRange(range),
  };
}
