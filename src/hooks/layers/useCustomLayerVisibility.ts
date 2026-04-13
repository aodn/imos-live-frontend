import { useEffect } from 'react';

type LayerWithVisibility = {
  setVisible: (visible: boolean) => void;
};

export function useCustomLayerVisibility(
  map: React.RefObject<mapboxgl.Map | null>,
  loadComplete: boolean,
  layer: LayerWithVisibility | null,
  visible: boolean,
) {
  useEffect(() => {
    if (!map.current || !loadComplete || !layer) return;
    layer.setVisible(visible);
  }, [layer, loadComplete, map, visible]);
}
