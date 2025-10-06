import { OverlaySource } from '@/constants';
import { Layer } from 'mapbox-gl';
import { useEffect } from 'react';

export function useMapboxLayerVisibility(
  map: React.RefObject<mapboxgl.Map | null>,
  loadComplete: boolean = true,
  layers: (Layer | null)[],
  visible: boolean,
  overlaySource: OverlaySource,
) {
  useEffect(() => {
    if (!map.current || !loadComplete) return;

    layers.forEach(layerRef => {
      const layer = layerRef;
      if (!layer) return;

      const layerId = layer.id;
      const exists = map.current?.getLayer(layerId);
      if (!exists) return;

      if (!visible) {
        map.current?.setLayoutProperty(layerId, 'visibility', 'none');
        return;
      }
      // Added delay of 500ms to avoid flickering while source tiles are swapped
      setTimeout(() => map.current?.setLayoutProperty(layerId, 'visibility', 'visible'), 500);
    });
  }, [map, loadComplete, visible, layers, overlaySource]);
}
