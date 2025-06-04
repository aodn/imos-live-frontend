import { VectoryLayerInterface } from '@/layers';
import { useEffect, useRef } from 'react';

export function useParticleLayerRef<T extends VectoryLayerInterface>(
  createLayer: () => T,
  deps: any,
) {
  const layerRef = useRef<T | null>(null);

  useEffect(() => {
    if (!layerRef.current) {
      layerRef.current = createLayer();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deps]);

  return layerRef;
}
