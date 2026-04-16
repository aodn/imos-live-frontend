import { getMetaData } from '@/api';
import type { ParticleLayer, ParticleSource, ProductType } from '@/constants';
import { GSLA_META_NAME, GSLA_PARTICLE_NAME, PRODUCT } from '@/constants';
import { addLayerInOrder, addOrUpdateImageSource } from '@/helpers';
import { vectorLayer } from '@/layers';
import { useMapUIStore, setProductErrorByProduct } from '@/store';
import { buildGSLADatasetPath, processMetaData } from '@/utils';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo } from 'react';
import { useShallow } from 'zustand/shallow';
import { useDidMountEffect } from '../useDidMountEffect';
import { useMapboxLayerSetup } from './useMapboxLayerSetup';
import { useParticleLayerVisibility } from './useParticleLayerVisibility';

type UseOParticleLayer = {
  map: React.RefObject<mapboxgl.Map | null>;
  layerId: ParticleLayer;
  sourceId: ParticleSource;
  product: ProductType;
};

export function useParticleLayer({ map, layerId, sourceId, product }: UseOParticleLayer) {
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

  const currentParticleQuery = useQuery({
    queryKey: [GSLA_META_NAME, date],
    queryFn: () => getMetaData(buildGSLADatasetPath(date, GSLA_META_NAME)),
    enabled: !!date && enabled,
  });

  const particleLayer = useMemo(() => vectorLayer(layerId, sourceId), [layerId, sourceId]);

  /**
   * NOTICE!!!
   * addOrUpdateImageSource will not throw error, even image fail to add, because on this
   * stage Mapbox only validates the shape of your source definition. The actual image load
   * happens asynchronously. We only check meta data load error here, as meta data and images
   * are generated from the same prefect flow. So either both are valid or both are invalid.
   */
  const setDataByDataset = useCallback(async () => {
    const data = await currentParticleQuery.promise.catch(() =>
      setProductErrorByProduct(PRODUCT.GSLA_OCEAN_GEOSTROPHIC_CURRENT, true),
    );
    if (!data) return;
    setProductErrorByProduct(PRODUCT.GSLA_OCEAN_GEOSTROPHIC_CURRENT, false);
    const { bounds, lonRange, latRange, uRange, vRange } = processMetaData(data);
    particleLayer.metadata = {
      bounds,
      range: [uRange, vRange],
    };

    addOrUpdateImageSource(
      map.current!,
      sourceId,
      buildGSLADatasetPath(date, GSLA_PARTICLE_NAME),
      lonRange,
      latRange,
    );
  }, [currentParticleQuery.promise, date, map, particleLayer, sourceId]);

  const setupLayer = useCallback(async () => {
    if (!particleLayer) return;
    if (enabled) {
      await setDataByDataset();
    }
    if (!map.current!.getLayer(particleLayer.id)) {
      addLayerInOrder(map, particleLayer);
    }
  }, [enabled, map, particleLayer, setDataByDataset]);

  const { loadComplete } = useMapboxLayerSetup(map, setupLayer, [setupLayer]);

  useParticleLayerVisibility(map, loadComplete, particleLayer, enabled && !isError);

  useEffect(() => {
    if (!map || !loadComplete || !particleLayer) return;
    const customizableConfig = {
      fadeOpacity,
      speedFactor,
      dropRate,
      pointSize,
      nParticles,
    };
    particleLayer.vectorField?.updateConfig(customizableConfig);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadComplete, fadeOpacity, speedFactor, dropRate, pointSize, nParticles]);

  useDidMountEffect(() => {
    if (!map.current || !loadComplete || !enabled) return;
    setDataByDataset();
  }, [loadComplete, date, enabled]);
}
