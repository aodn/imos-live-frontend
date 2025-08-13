import { VectoryLayerInterface } from '@/layers';
import { useEffect } from 'react';

export function useParticleLayerVisibility(
  map: React.RefObject<mapboxgl.Map | null>,
  loadComplete: boolean,
  layer: VectoryLayerInterface | null,
  visible: boolean,
) {
  useEffect(() => {
    if (!map.current || !loadComplete || !layer) return;
    layer.setVisible(visible);
  }, [layer, loadComplete, map, visible]);
}
