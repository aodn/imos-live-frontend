/* eslint-disable react-hooks/exhaustive-deps */
import {
  GSLA_META_NAME,
  GSLA_PARTICLE_NAME,
  PARTICLE_LAYER_ID,
  PARTICLE_SOURCE_ID,
} from '@/constants';
import { addLayerInOrder, addOrUpdateImageSource } from '@/helpers';
import { vectorLayer } from '@/layers';
import { processMetaData, buildGSLADatasetFullPath, buildGSLADatasetPath } from '@/utils';
import { useEffect } from 'react';
import { useParticleLayerVisibility } from './useParticleLayerVisibility';
import { useParticleLayerRef } from './useParticleLayerRef';
import { useMapboxLayerSetup } from './useMapboxLayerSetup';
import { useToast } from '@/components';
import { getMetaData } from '@/api';
import { useQuery } from '@tanstack/react-query';

export function useParticleLayer(
  map: React.RefObject<mapboxgl.Map | null>,
  particles: boolean,
  style: string,
  dataset: string,
  numParticles: number,
) {
  const { showToast } = useToast();

  const { data: meta, isError } = useQuery({
    queryKey: [GSLA_META_NAME, dataset],
    queryFn: () => getMetaData(buildGSLADatasetPath(dataset, GSLA_META_NAME)),
    enabled: !!dataset,
  });

  useEffect(() => {
    if (isError)
      showToast({
        type: 'error',
        title: 'Error occurred',
        message: 'Failed to get GSLA anamly sea level data of this date',
        duration: 6000,
      });
  }, [isError, showToast]);

  const setDataByDataset = async () => {
    if (!meta) return;

    const { maxBounds, bounds, lonRange, latRange, uRange, vRange } = processMetaData(meta);

    map.current!.setMaxBounds(maxBounds);

    particleLayer.current!.metadata = {
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
  };

  const setupLayer = async () => {
    if (!particleLayer.current) return;
    await setDataByDataset();
    if (!map.current!.getLayer(PARTICLE_LAYER_ID)) {
      addLayerInOrder(map, particleLayer.current, PARTICLE_LAYER_ID);
    }
  };

  const particleLayer = useParticleLayerRef(
    () => vectorLayer(PARTICLE_LAYER_ID, PARTICLE_SOURCE_ID, particles),
    style,
  );

  const { loadComplete } = useMapboxLayerSetup(map, setupLayer, [style, dataset]);

  useParticleLayerVisibility(map, loadComplete, particleLayer, particles && !isError);

  useEffect(() => {
    if (!map || !loadComplete || !particleLayer.current) return;
    particleLayer.current.vectorField?.setParticleNum(numParticles);
  }, [loadComplete, numParticles]);
}
