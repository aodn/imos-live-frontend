import { layersOrder } from '@/config';
import { VectoryLayerInterface } from '@/layers';
import { Layer } from 'mapbox-gl';

export function addLayerInOrder(
  map: React.RefObject<mapboxgl.Map | null>,
  layer: Layer | VectoryLayerInterface | null,
) {
  if (!layer) return;

  if (!map.current?.getLayer(layer.id)) {
    map.current?.addLayer(layer);
  }

  layersOrder.forEach(id => {
    if (map.current?.getLayer(id)) {
      map.current?.moveLayer(id);
    }
  });
}
