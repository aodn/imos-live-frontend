import { VectoryLayerInterface } from '../layers/vectorLayer.ts';
import { useEffect } from 'react';

export function useParticleLayerVisibility(
  map: React.RefObject<mapboxgl.Map | null>,
  loadComplete: boolean,
  layer: React.RefObject<VectoryLayerInterface | null>,
  visible: boolean,
) {
  useEffect(() => {
    if (!map.current || !loadComplete || !layer.current) return;
    layer.current.setVisible(visible);
  }, [layer, loadComplete, map, visible]);
}
