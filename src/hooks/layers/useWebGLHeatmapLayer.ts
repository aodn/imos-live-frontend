import type { WebGlLayerProduct } from '@/constants';
import { PRODUCTCOLORPALETTES, PRODUCTLEGENDS } from '@/constants';
import { getHeatmapAtlasProductManifest } from '@/api';
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
};

export function useWebGLHeatmapLayer({
  map,
  layerId,
  product,
  baseUrl,
  filePrefix,
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
    queryKey: [product, date],
    queryFn: () => getHeatmapAtlasProductManifest({ product: filePrefix, date }),
    enabled: !!date && enabled,
  });

  const legendRange = PRODUCTLEGENDS[product].range as [number, number];

  const setDataByDataset = useCallback(async () => {
    setProductErrorByProduct(product, false);
    const manifest = await manifestQuery.promise.catch(() => {
      setProductErrorByProduct(product, true);
      return null;
    });
    if (!manifest) return;
    await layer.setSource(manifest, baseUrl, filePrefix, date, legendRange).catch(() => {
      setProductErrorByProduct(product, true);
    });
  }, [manifestQuery.promise, layer, baseUrl, filePrefix, legendRange, product, date]);

  const setupLayer = useCallback(async () => {
    if (!map.current!.getLayer(layer.id)) {
      addLayerInOrder(map, layer);
    }
    if (enabled) await setDataByDataset();
  }, [map, layer, setDataByDataset, enabled]);

  const { loadComplete } = useMapboxLayerSetup(map, setupLayer, [setupLayer]);

  useCustomLayerVisibility(map, loadComplete, layer, enabled && !isError);

  useDidMountEffect(() => {
    if (!map.current || !loadComplete || !enabled) return;
    setDataByDataset();
  }, [loadComplete, enabled, date]);

  return {
    updateLegendRange: (range: [number, number]) => layer.updateLegendRange(range),
  };
}
