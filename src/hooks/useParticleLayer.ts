import { getMetaData } from '@/api';
import { useToast } from '@/components';
import {
  GSLA_META_NAME,
  GSLA_PARTICLE_NAME,
  PARTICLE_LAYER_ID,
  PARTICLE_SOURCE_ID,
} from '@/constants';
import { addLayerInOrder, addOrUpdateImageSource, CoordinatesType } from '@/helpers';
import { vectorLayer, VectoryLayerInterface } from '@/layers';
import { useMapUIStore } from '@/store';
import { buildGSLADatasetFullPath, buildGSLADatasetPath, processMetaData } from '@/utils';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';
import { useShallow } from 'zustand/shallow';

export function useParticleLayer(map: React.RefObject<mapboxgl.Map | null>) {
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

  const addLayersBackAfterStyleChanges = async (layer: VectoryLayerInterface) => {
    try {
      const data = await currentParticleQuery.promise;
      if (!data) return;

      const { bounds, lonRange, latRange, uRange, vRange } = processMetaData(data);
      layer.metadata = {
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

      addLayerInOrder(map, layer);
    } catch (error) {
      console.error('Error adding layers back after style changes:', error);
      showToast({
        type: 'error',
        title: 'Error occurred',
        message: 'Failed to get buoys locations',
        duration: 6000,
      });
    }
  };

  useEffect(() => {
    particleLayer.setVisible(particles && !currentParticleQuery.isError);
  }, [particleLayer, particles, currentParticleQuery.isError]);

  useEffect(() => {
    const currentMap = map.current;
    const handleStyleLoad = () => addLayersBackAfterStyleChanges(particleLayer);
    currentMap?.on('style.load', handleStyleLoad);
    return () => {
      currentMap?.off('style.load', handleStyleLoad);
      return;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, particleLayer]);

  useEffect(() => {
    particleLayer.vectorField?.setParticleNum(numParticles);
  }, [particleLayer, numParticles]);

  useEffect(() => {
    if (!currentParticleQuery.data) return;

    const particleSource = map.current?.getSource(PARTICLE_SOURCE_ID);
    if (!particleSource || particleSource.type !== 'image') return;

    const { lonRange, latRange } = processMetaData(currentParticleQuery.data);
    const coordinates: CoordinatesType = [
      [lonRange[0], latRange[1]],
      [lonRange[1], latRange[1]],
      [lonRange[1], latRange[0]],
      [lonRange[0], latRange[0]],
    ];
    particleSource.updateImage({
      url: buildGSLADatasetFullPath(dataset, GSLA_PARTICLE_NAME),
      coordinates,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentParticleQuery.data, dataset]);
}
