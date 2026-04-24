import type { WebGlLayerProduct } from '@/constants';
import { PRODUCTLEGENDS } from '@/constants';
import { getHeatmapAtlasProductManifest } from '@/api';
import { addLayerInOrder } from '@/helpers';
import { particlesAtlasLayer } from '@/layers';
import { useMapUIStore, setProductErrorByProduct } from '@/store';
import { useCallback, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useShallow } from 'zustand/shallow';
import { useDidMountEffect } from '../useDidMountEffect';
import { useMapboxLayerSetup } from './useMapboxLayerSetup';
import { useCustomLayerVisibility } from './useCustomLayerVisibility';

type UseParticleLayer = {
  map: React.RefObject<mapboxgl.Map | null>;
  layerId: string;
  product: WebGlLayerProduct;
  baseUrl: string;
  /** Chunk filename prefix, e.g. 'ocean_current_gsla_ucur_vcur'. */
  filePrefix: string;
};

export function useParticleLayer({ map, layerId, product, baseUrl, filePrefix }: UseParticleLayer) {
  const { date, nParticles, fadeOpacity, speedFactor, dropRate, pointSize, isError, enabled } =
    useMapUIStore(
      useShallow(s => ({
        date: s.date,
        nParticles: s.particleConfig.nParticles,
        fadeOpacity: s.particleConfig.fadeOpacity,
        speedFactor: s.particleConfig.speedFactor,
        dropRate: s.particleConfig.dropRate,
        dropRateBump: s.particleConfig.dropRateBump,
        pointSize: s.particleConfig.pointSize,
        isError: s.productError[product],
        enabled: s.productEnabled[product],
      })),
    );

  const layer = useMemo(() => particlesAtlasLayer(layerId), [layerId]);

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
  }, [manifestQuery.promise, layer, baseUrl, filePrefix, date, legendRange, product]);

  const setupLayer = useCallback(async () => {
    if (!map.current!.getLayer(layer.id)) {
      addLayerInOrder(map, layer);
    }
    if (enabled) await setDataByDataset();
  }, [map, layer, setDataByDataset, enabled]);

  const { loadComplete } = useMapboxLayerSetup(map, setupLayer, [setupLayer]);

  useCustomLayerVisibility(map, loadComplete, layer, enabled && !isError);

  useEffect(() => {
    if (!map.current || !loadComplete || !layer) return;
    layer.oceanCurrentAtlasField?.updateConfig({
      fadeOpacity,
      speedFactor,
      dropRate,
      pointSize,
      nParticles,
    });
  }, [map, layer, loadComplete, fadeOpacity, speedFactor, dropRate, pointSize, nParticles]);

  useDidMountEffect(() => {
    if (!map.current || !loadComplete || !enabled) return;
    setDataByDataset();
  }, [loadComplete, enabled, date]);
}
