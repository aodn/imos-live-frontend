/* eslint-disable react-hooks/exhaustive-deps */
import { GSLAMETANAME, GSLAPARTICLENAME, PARTICLE_LAYER_ID, PARTICLE_SOURCE_ID } from '@/constants';
import { addOrUpdateImageSource } from '@/helpers';
import { vectorLayer } from '@/layers';
import { loadMetaDataFromUrl, buildDatasetUrl } from '@/utils';
import { useEffect } from 'react';
import { useDidMountEffect } from './useDidMountEffect';
import { useVectoryLayerVisibility } from './useVectorLayerVisibility';
import { useVectorLayerRef } from './useVectorLayerRef';
import { useMapboxLayerSetup } from './useMapboxLayerSetup';

export function useParticleLayer(
  map: React.RefObject<mapboxgl.Map | null>,
  particles: boolean,
  numParticles: number,
  style: string,
  dataset: string,
) {
  const setDataByDataset = async () => {
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

  const setupLayer = async () => {
    if (!particleLayer.current) return;
    await setDataByDataset();
    if (!map.current!.getLayer(PARTICLE_LAYER_ID)) {
      map.current!.addLayer(particleLayer.current);
    }
  };

  const particleLayer = useVectorLayerRef(
    () => vectorLayer(PARTICLE_LAYER_ID, PARTICLE_SOURCE_ID, particles),
    style,
  );

  const { loadComplete } = useMapboxLayerSetup(map, setupLayer, [style, dataset]);

  useVectoryLayerVisibility(map, loadComplete, particleLayer, particles);

  useEffect(() => {
    if (!map || !loadComplete || !particleLayer.current) return;
    particleLayer.current.vectorField?.setParticleNum(numParticles);
  }, [loadComplete, numParticles]);

  useDidMountEffect(() => {
    if (!map.current || !loadComplete || !particleLayer.current) return;
    setDataByDataset();
  }, [loadComplete, dataset]);
}
