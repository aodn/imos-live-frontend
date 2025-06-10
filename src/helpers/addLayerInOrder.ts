import { VectoryLayerInterface } from '@/layers';
import { Layer } from 'mapbox-gl';
import { layersOrder } from '@/config';

//ensure layers are in correct order.
export function addLayerInOrder(
  map: React.RefObject<mapboxgl.Map | null>,
  layer: Layer | VectoryLayerInterface,
  layerId: string,
) {
  if (!map.current?.getLayer(layerId)) {
    map.current?.addLayer(layer);
  }

  layersOrder.forEach(id => {
    if (map.current?.getLayer(id)) {
      map.current?.moveLayer(id);
    }
  });
}
