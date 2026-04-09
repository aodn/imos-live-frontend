import type { VectoryLayerInterface, WebGLOverlayLayerInterface } from '@/layers';
import { useEffect } from 'react';

export function useCustomLayerVisibility(
  map: React.RefObject<mapboxgl.Map | null>,
  loadComplete: boolean,
  layer: VectoryLayerInterface | WebGLOverlayLayerInterface | null,
  visible: boolean,
) {
  useEffect(() => {
    if (!map.current || !loadComplete || !layer) return;
    layer.setVisible(visible);
  }, [layer, loadComplete, map, visible]);
}
