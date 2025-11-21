import { getMetaData } from '@/api';
import {
  GSLA_META_NAME,
  GSLA_PARTICLE_NAME,
  ParticleLayer,
  ParticleSource,
  Product,
} from '@/constants';
import { addLayerInOrder, addOrUpdateImageSource } from '@/helpers';
import { vectorLayer } from '@/layers';
import { useMapUIStore, setProductErrorByProduct } from '@/store';
import { buildGSLADatasetFullPath, buildGSLADatasetPath, processMetaData } from '@/utils';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo } from 'react';
import { useShallow } from 'zustand/shallow';
import { useDidMountEffect } from './useDidMountEffect';
import { useMapboxLayerSetup } from './useMapboxLayerSetup';
import { useParticleLayerVisibility } from './useParticleLayerVisibility';

type UseOParticleLayer = {
  map: React.RefObject<mapboxgl.Map | null>;
  layerId: ParticleLayer;
  sourceId: ParticleSource;
  product: Product;
};

export function useParticleLayer({ map, layerId, sourceId, product }: UseOParticleLayer) {
  const { date, numParticles, isError, enabled } = useMapUIStore(
    useShallow(s => ({
      date: s.date,
      numParticles: s.numParticles,
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
   * happens asynchronously.
   */
  const setDataByDataset = useCallback(async () => {
    const data = await currentParticleQuery.promise.catch(() =>
      setProductErrorByProduct(Product.GSLA_OCEAN_GEOSTROPHIC_CURRENT, true),
    );
    if (!data) return;
    setProductErrorByProduct(Product.GSLA_OCEAN_GEOSTROPHIC_CURRENT, false);
    const { bounds, lonRange, latRange, uRange, vRange } = processMetaData(data);
    particleLayer.metadata = {
      bounds,
      range: [uRange, vRange],
    };

    addOrUpdateImageSource(
      map.current!,
      sourceId,
      buildGSLADatasetFullPath(date, GSLA_PARTICLE_NAME),
      lonRange,
      latRange,
    );
  }, [currentParticleQuery.promise, date, map, particleLayer, sourceId]);

  const setupLayer = useCallback(async () => {
    if (!particleLayer) return;
    await setDataByDataset();
    if (!map.current!.getLayer(particleLayer.id)) {
      addLayerInOrder(map, particleLayer);
    }
  }, [map, particleLayer, setDataByDataset]);

  const { loadComplete } = useMapboxLayerSetup(map, setupLayer, [setupLayer]);

  useParticleLayerVisibility(map, loadComplete, particleLayer, enabled && !isError);

  useEffect(() => {
    if (!map || !loadComplete || !particleLayer) return;
    particleLayer.vectorField?.setParticleNum(numParticles);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadComplete, numParticles]);

  useDidMountEffect(() => {
    if (!map.current || !loadComplete) return;
    setDataByDataset();
  }, [loadComplete, date]);
}
