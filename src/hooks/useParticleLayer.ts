import { getMetaData } from '@/api';
import { useToast } from '@/components';
import {
  GSLA_META_NAME,
  GSLA_PARTICLE_NAME,
  PARTICLE_LAYER_ID,
  PARTICLE_SOURCE_ID,
} from '@/constants';
import { addLayerInOrder, addOrUpdateImageSource } from '@/helpers';
import { vectorLayer } from '@/layers';
import { useMapUIStore } from '@/store';
import { buildGSLADatasetFullPath, buildGSLADatasetPath, processMetaData } from '@/utils';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useShallow } from 'zustand/shallow';
import { useDidMountEffect } from './useDidMountEffect';
import { useMapboxLayerSetup } from './useMapboxLayerSetup';
import { useParticleLayerVisibility } from './useParticleLayerVisibility';

export function useParticleLayer(map: React.RefObject<mapboxgl.Map | null>) {
  const [isError, setIsError] = useState(false);
  const { showToast } = useToast();
  const { particles, dataset, numParticles } = useMapUIStore(
    useShallow(s => ({
      particles: s.particles,
      dataset: s.dataset,
      numParticles: s.numParticles,
    })),
  );

  const currentParticleQuery = useQuery({
    queryKey: [GSLA_META_NAME, dataset],
    queryFn: () => getMetaData(buildGSLADatasetPath(dataset, GSLA_META_NAME)),
    enabled: !!dataset && particles,
  });

  const particleLayer = useMemo(() => vectorLayer(PARTICLE_LAYER_ID, PARTICLE_SOURCE_ID), []);

  const setDataByDataset = useCallback(async () => {
    try {
      const data = await currentParticleQuery.promise;
      if (!data) return;

      const { bounds, lonRange, latRange, uRange, vRange } = processMetaData(data);
      particleLayer.metadata = {
        bounds,
        range: [uRange, vRange],
      };

      addOrUpdateImageSource(
        map.current!,
        PARTICLE_SOURCE_ID,
        buildGSLADatasetFullPath(dataset, GSLA_PARTICLE_NAME),
        lonRange,
        latRange,
      );
      setIsError(false);
    } catch (error) {
      console.error('Error adding layers back after style changes:', error);
      setIsError(true);
      showToast({
        type: 'error',
        title: 'Error occurred',
        message: 'Failed to get buoys locations',
        duration: 6000,
      });
    }
  }, [currentParticleQuery.promise, dataset, map, particleLayer, showToast]);

  const setupLayer = useCallback(async () => {
    if (!particleLayer) return;
    await setDataByDataset();
    if (!map.current!.getLayer(particleLayer.id)) {
      addLayerInOrder(map, particleLayer);
    }
  }, [map, particleLayer, setDataByDataset]);

  const { loadComplete } = useMapboxLayerSetup(map, setupLayer);

  useParticleLayerVisibility(map, loadComplete, particleLayer, particles && !isError);

  useEffect(() => {
    if (!map || !loadComplete || !particleLayer) return;
    particleLayer.vectorField?.setParticleNum(numParticles);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadComplete, numParticles]);

  useDidMountEffect(() => {
    if (!map.current || !loadComplete) return;
    setDataByDataset();
  }, [loadComplete, dataset]);
}
