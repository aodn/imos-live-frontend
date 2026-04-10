import type {
  VectoryLayerInterface,
  WebGLOverlayLayerInterface,
  WindAtlasLayerInterface,
} from '@/layers';
import { useEffect } from 'react';

export function useCustomLayerVisibility(
  map: React.RefObject<mapboxgl.Map | null>,
  loadComplete: boolean,
  layer: VectoryLayerInterface | WebGLOverlayLayerInterface | WindAtlasLayerInterface | null,
  visible: boolean,
) {
  useEffect(() => {
    if (!map.current || !loadComplete || !layer) return;
    layer.setVisible(visible);
  }, [layer, loadComplete, map, visible]);
}
