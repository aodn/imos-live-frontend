import type { TilesProduct } from '@/constants';
import { createParticleAtlasLayer } from '@/AtlasRenderingSystem';
import type { ParticleAtlasLayerHandle, ScalarAtlasLayerOptions } from '@/AtlasRenderingSystem';
import { useMapUIStore } from '@/store';
import { useCallback, useEffect } from 'react';
import { useShallow } from 'zustand/shallow';
import { useAtlasLayer } from './useAtlasLayer';

type UseParticleAtlasLayer = {
  map: React.RefObject<mapboxgl.Map | null>;
  product: TilesProduct;
};

export function useParticleAtlasLayer({ map, product }: UseParticleAtlasLayer) {
  const createLayer = useCallback(
    (options: ScalarAtlasLayerOptions) =>
      createParticleAtlasLayer({
        ...options,
        particleConfig: useMapUIStore.getState().particleConfig,
      }),
    [],
  );

  const { handleRef, loadComplete } = useAtlasLayer<ParticleAtlasLayerHandle>({
    map,
    product,
    createLayer,
  });

  // Particle-only: sync the live particle-config slice into the WebGL layer.
  const { nParticles, fadeOpacity, speedFactor, dropRate, pointSize } = useMapUIStore(
    useShallow(s => ({
      nParticles: s.particleConfig.nParticles,
      fadeOpacity: s.particleConfig.fadeOpacity,
      speedFactor: s.particleConfig.speedFactor,
      dropRate: s.particleConfig.dropRate,
      pointSize: s.particleConfig.pointSize,
    })),
  );

  useEffect(() => {
    if (!loadComplete) return;
    handleRef.current?.updateConfig({ nParticles, fadeOpacity, speedFactor, dropRate, pointSize });
  }, [loadComplete, nParticles, fadeOpacity, speedFactor, dropRate, pointSize, handleRef]);
}
