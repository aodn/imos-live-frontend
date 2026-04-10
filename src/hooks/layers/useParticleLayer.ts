import type { ParticleLayer, ProductType } from '@/constants';
import { getOceanCurrentManifest } from '@/api';
import { addLayerInOrder } from '@/helpers';
import { oceanCurrentAtlasLayer } from '@/layers';
import { useMapUIStore, setProductErrorByProduct } from '@/store';
import { useCallback, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useShallow } from 'zustand/shallow';
import { useDidMountEffect } from '../useDidMountEffect';
import { useMapboxLayerSetup } from './useMapboxLayerSetup';
import { useCustomLayerVisibility } from './useCustomLayerVisibility';

type UseParticleLayer = {
  map: React.RefObject<mapboxgl.Map | null>;
  layerId: ParticleLayer;
  product: ProductType;
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

  const baseUrl = `${'26-01-01'}/ocean_current`;

  const particleLayer = useMemo(() => oceanCurrentAtlasLayer(layerId), [layerId]);

  const manifestQuery = useQuery({
    queryKey: ['oceanCurrentAtlasManifest', date],
    queryFn: () => getOceanCurrentManifest(baseUrl),
    enabled: !!date,
  });

  const setDataByDataset = useCallback(async () => {
    setProductErrorByProduct(product, false);
    const manifest = await manifestQuery.promise.catch(() => {
      setProductErrorByProduct(product, true);
      return null;
    });
    if (!manifest) return;
    await particleLayer.setSource(manifest, baseUrl).catch(() => {
      setProductErrorByProduct(product, true);
    });
  }, [manifestQuery.promise, particleLayer, baseUrl, product]);

  const setupLayer = useCallback(async () => {
    if (!map.current!.getLayer(particleLayer.id)) {
      addLayerInOrder(map, particleLayer);
    }
    await setDataByDataset();
  }, [map, particleLayer, setDataByDataset]);

  const { loadComplete } = useMapboxLayerSetup(map, setupLayer, [setupLayer]);

  useCustomLayerVisibility(map, loadComplete, particleLayer, enabled && !isError);

  useEffect(() => {
    if (!map || !loadComplete || !particleLayer) return;
    particleLayer.oceanCurrentAtlasField?.updateConfig({
      fadeOpacity,
      speedFactor,
      dropRate,
      pointSize,
      nParticles,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadComplete, fadeOpacity, speedFactor, dropRate, pointSize, nParticles]);

  useDidMountEffect(() => {
    if (!map.current || !loadComplete) return;
    setDataByDataset();
  }, [loadComplete, date]);
}
