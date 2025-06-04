import { VectoryLayerInterface } from '@/layers/vectorLayer';
import { Layer } from 'mapbox-gl';

//ensure layers are in correct order.
export function addLayerInOrder(
  map: React.RefObject<mapboxgl.Map | null>,
  order: string[],
  layer: Layer | VectoryLayerInterface,
  layerId: string,
) {
  if (!map.current?.getLayer(layerId)) {
    map.current?.addLayer(layer);
  }

  order.forEach(id => {
    if (map.current?.getLayer(id)) {
      map.current?.moveLayer(id);
    }
  });
}
