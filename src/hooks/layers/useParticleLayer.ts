import type { ParticleLayer, ProductType } from '@/constants';
import { PRODUCT } from '@/constants';
import { addLayerInOrder } from '@/helpers';
import { windAtlasLayer } from '@/layers';
import { useMapUIStore, setProductErrorByProduct } from '@/store';
import { useCallback, useEffect, useMemo } from 'react';
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

  const particleLayer = useMemo(() => windAtlasLayer(layerId), [layerId]);

  const setDataByDataset = useCallback(async () => {
    if (!date) return;
    const baseUrl = `${'26-01-01'}/ocean_current`;
    try {
      await particleLayer.setSource(baseUrl);
      setProductErrorByProduct(PRODUCT.GSLA_OCEAN_GEOSTROPHIC_CURRENT, false);
    } catch {
      setProductErrorByProduct(PRODUCT.GSLA_OCEAN_GEOSTROPHIC_CURRENT, true);
    }
  }, [date, particleLayer]);

  const setupLayer = useCallback(async () => {
    if (!particleLayer) return;
    if (!map.current!.getLayer(particleLayer.id)) {
      addLayerInOrder(map, particleLayer);
    }
    await setDataByDataset();
  }, [map, particleLayer, setDataByDataset]);

  const { loadComplete } = useMapboxLayerSetup(map, setupLayer, [setupLayer]);

  useCustomLayerVisibility(map, loadComplete, particleLayer, enabled && !isError);

  useEffect(() => {
    if (!map || !loadComplete || !particleLayer) return;
    const customizableConfig = {
      fadeOpacity,
      speedFactor,
      dropRate,
      pointSize,
      nParticles,
    };
    particleLayer.windAtlasField?.updateConfig(customizableConfig);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadComplete, fadeOpacity, speedFactor, dropRate, pointSize, nParticles]);

  useDidMountEffect(() => {
    if (!map.current || !loadComplete) return;
    setDataByDataset();
  }, [loadComplete, date]);
}
