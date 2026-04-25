import type { WebGlLayerProduct } from '@/constants';
import { PRODUCTCOLORPALETTES, PRODUCTLEGENDS, PRODUCTS } from '@/constants';
import { S3_BASE_URL, getProductManifest } from '@/api';
import { addLayerInOrder } from '@/helpers';
import { particlesAtlasLayer } from '@/layers';
import { useMapUIStore, setProductErrorByProduct } from '@/store';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useShallow } from 'zustand/shallow';
import { useDidMountEffect } from '../useDidMountEffect';
import { useMapboxLayerSetup } from './useMapboxLayerSetup';
import { useCustomLayerVisibility } from './useCustomLayerVisibility';

type UseParticleLayer = {
  map: React.RefObject<mapboxgl.Map | null>;
  layerId: string;
  product: WebGlLayerProduct;
};

export function useParticleLayer({ map, layerId, product }: UseParticleLayer) {
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

  const [isLoading, setIsLoading] = useState(false);

  const legendRange = PRODUCTLEGENDS[product].range as [number, number];
  const filePrefix = PRODUCTS[product].bucketPath;
  const tileBaseUrl = `${S3_BASE_URL}/${filePrefix}/${date}`;

  const layer = useMemo(
    () => particlesAtlasLayer(layerId, PRODUCTCOLORPALETTES[product].colors),
    [layerId, product],
  );

  const manifestQuery = useQuery({
    queryKey: [product, date],
    queryFn: () => getProductManifest({ product: filePrefix, date }),
    enabled: !!date && enabled,
  });

  const setDataByDataset = useCallback(async () => {
    setIsLoading(true);
    setProductErrorByProduct(product, false);
    const manifest = await manifestQuery.promise.catch(() => {
      setProductErrorByProduct(product, true);
      return null;
    });
    if (!manifest) {
      setIsLoading(false);
      return;
    }
    await layer.setSource(manifest, tileBaseUrl, legendRange).catch(() => {
      setProductErrorByProduct(product, true);
    });
    setIsLoading(false);
  }, [manifestQuery.promise, layer, tileBaseUrl, legendRange, product]);

  const setupLayer = useCallback(async () => {
    if (!map.current!.getLayer(layer.id)) {
      addLayerInOrder(map, layer);
    }
    if (enabled) await setDataByDataset();
  }, [map, layer, setDataByDataset, enabled]);

  const { loadComplete } = useMapboxLayerSetup(map, setupLayer, [setupLayer]);

  useCustomLayerVisibility(map, loadComplete, layer, enabled && !isError && !isLoading);

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
