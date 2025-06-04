/* eslint-disable react-hooks/exhaustive-deps */
import {
  GSLA_META_NAME,
  GSLA_PARTICLE_NAME,
  PARTICLE_LAYER_ID,
  PARTICLE_SOURCE_ID,
} from '@/constants';
import { addLayerInOrder, addOrUpdateImageSource } from '@/helpers';
import { vectorLayer } from '../layers/vectorLayer.ts';
import { loadMetaDataFromUrl, buildDatasetUrl } from '@/utils';
import { useEffect } from 'react';
import { useDidMountEffect } from './useDidMountEffect';
import { useParticleLayerVisibility } from './useParticleLayerVisibility';
import { useParticleLayerRef } from './useParticleLayerRef';
import { useMapboxLayerSetup } from './useMapboxLayerSetup';
import { layersOrder } from '@/config';

export function useParticleLayer(
  map: React.RefObject<mapboxgl.Map | null>,
  particles: boolean,
  style: string,
  dataset: string,
  numParticles: number,
) {
  const setDataByDataset = async () => {
    const { maxBounds, bounds, lonRange, latRange, uRange, vRange } = await loadMetaDataFromUrl(
      buildDatasetUrl(dataset, GSLA_META_NAME),
    );

    map.current!.setMaxBounds(maxBounds);
    particleLayer.current!.metadata = {
      bounds,
      range: [uRange, vRange],
    };

    addOrUpdateImageSource(
      map.current!,
      PARTICLE_SOURCE_ID,
      buildDatasetUrl(dataset, GSLA_PARTICLE_NAME),
      lonRange,
      latRange,
    );
  };

  const setupLayer = async () => {
    if (!particleLayer.current) return;
    await setDataByDataset();
    if (!map.current!.getLayer(PARTICLE_LAYER_ID)) {
      addLayerInOrder(map, layersOrder, particleLayer.current, PARTICLE_LAYER_ID);
    }
  };

  const particleLayer = useParticleLayerRef(
    () => vectorLayer(PARTICLE_LAYER_ID, PARTICLE_SOURCE_ID, particles),
    style,
  );

  const { loadComplete } = useMapboxLayerSetup(map, setupLayer, [style, dataset]);

  useParticleLayerVisibility(map, loadComplete, particleLayer, particles);

  useEffect(() => {
    if (!map || !loadComplete || !particleLayer.current) return;
    particleLayer.current.vectorField?.setParticleNum(numParticles);
  }, [loadComplete, numParticles]);

  useDidMountEffect(() => {
    if (!map.current || !loadComplete || !particleLayer.current) return;
    setDataByDataset();
  }, [loadComplete, dataset]);
}
