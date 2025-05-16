import { Layer } from 'mapbox-gl';
import { useEffect } from 'react';

export function useMapboxLayerVisibility(
  map: React.RefObject<mapboxgl.Map | null>,
  loadComplete: boolean,
  layer: React.RefObject<Layer | null>,
  visible: boolean,
) {
  useEffect(() => {
    if (!map.current || !loadComplete || !layer.current) return;
    map.current.setLayoutProperty(layer.current.id, 'visibility', visible ? 'visible' : 'none');
  }, [layer, loadComplete, map, visible]);
}
