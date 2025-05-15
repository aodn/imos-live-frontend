/* eslint-disable react-hooks/exhaustive-deps */
import { GSLAMETANAME, GSLAPARTICLENAME, PARTICLE_LAYER_ID, PARTICLE_SOURCE_ID } from '@/constants';
import { addOrUpdateImageSource } from '@/helpers';
import { vectorLayer, VectoryLayerInterface } from '@/layers';
import { loadMetaDataFromUrl, buildDatasetUrl } from '@/utils';
import { useEffect, useRef, useState } from 'react';
import { useDidMountEffect } from './useDidMountEffect';

export function useParticleLayer(
  map: React.RefObject<mapboxgl.Map | null>,
  particles: boolean,
  numParticles: number,
  style: string,
  dataset: string,
) {
  const [loadComplete, setLoadComplete] = useState(false);
  const particleLayer = useRef<VectoryLayerInterface | null>(null);

  useEffect(() => {
    if (!particleLayer.current) {
      particleLayer.current = vectorLayer(PARTICLE_LAYER_ID, PARTICLE_SOURCE_ID, particles);
    }
  }, [style]);

  useEffect(() => {
    const mapInstance = map.current;
    if (!mapInstance) return;

    const setupLayers = async () => {
      if (!particleLayer.current) return;
      const { maxBounds, bounds, lonRange, latRange, uRange, vRange } = await loadMetaDataFromUrl(
        buildDatasetUrl(dataset, GSLAMETANAME),
      );

      mapInstance.setMaxBounds(maxBounds);
      particleLayer.current!.metadata = {
        bounds,
        range: [uRange, vRange],
      };

      addOrUpdateImageSource(
        mapInstance,
        PARTICLE_SOURCE_ID,
        buildDatasetUrl(dataset, GSLAPARTICLENAME),
        lonRange,
        latRange,
      );

      if (!mapInstance.getLayer(PARTICLE_LAYER_ID)) {
        mapInstance.addLayer(particleLayer.current);
      }
      console.log('Particle layer added');
      setLoadComplete(true);
    };

    mapInstance.on('style.load', setupLayers);

    return () => {
      mapInstance.off('style.load', setupLayers);
    };
  }, [dataset]);

  // Toggle particles visibility
  useEffect(() => {
    if (!map.current || !loadComplete || !particleLayer.current) return;
    particleLayer.current.setVisible(particles);
  }, [loadComplete, particles]);

  // Set number of particles
  useEffect(() => {
    if (!map || !loadComplete || !particleLayer.current) return;
    particleLayer.current.vectorField?.setParticleNum(numParticles);
  }, [loadComplete, numParticles]);

  useDidMountEffect(() => {
    if (!map.current || !loadComplete || !particleLayer.current) return;

    const updateDataByDataset = async () => {
      const { maxBounds, bounds, lonRange, latRange, uRange, vRange } = await loadMetaDataFromUrl(
        buildDatasetUrl(dataset, GSLAMETANAME),
      );

      map.current!.setMaxBounds(maxBounds);
      particleLayer.current!.metadata = {
        bounds,
        range: [uRange, vRange],
      };

      addOrUpdateImageSource(
        map.current!,
        PARTICLE_SOURCE_ID,
        buildDatasetUrl(dataset, GSLAPARTICLENAME),
        lonRange,
        latRange,
      );
    };

    updateDataByDataset();
  }, [loadComplete, dataset]);
  return { particleLayer };
}
