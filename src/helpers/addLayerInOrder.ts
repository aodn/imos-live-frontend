import { LAYERS_ORDER } from '@/config';
import type { VectoryLayerInterface, WebGLOverlayLayerInterface } from '@/layers';
import type { Layer } from 'mapbox-gl';

export function addLayerInOrder(
  map: React.RefObject<mapboxgl.Map | null>,
  layer: Layer | VectoryLayerInterface | WebGLOverlayLayerInterface | null,
) {
  if (!layer) return;

  if (!map.current?.getLayer(layer.id)) {
    map.current?.addLayer(layer);
  }

  LAYERS_ORDER.forEach(id => {
    if (map.current?.getLayer(id)) {
      map.current?.moveLayer(id);
    }
  });
}
