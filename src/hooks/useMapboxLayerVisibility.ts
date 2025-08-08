import { Layer } from 'mapbox-gl';
import { useEffect } from 'react';

export function useMapboxLayerVisibility(
  map: React.RefObject<mapboxgl.Map | null>,
  loadComplete: boolean,
  layers: (React.RefObject<Layer | null> | Layer)[],
  visible: boolean,
) {
  useEffect(() => {
    if (!map.current || !loadComplete) return;

    layers.forEach(layerRef => {
      let layer: Layer | null;
      if ('current' in layerRef) {
        layer = layerRef.current;
      } else {
        layer = layerRef;
      }
      if (!layer) return;

      const layerId = layer.id;
      const exists = map.current?.getLayer(layerId);
      if (!exists) return;

      map.current?.setLayoutProperty(layerId, 'visibility', visible ? 'visible' : 'none');
    });
  }, [map, loadComplete, visible, layers]);
}
