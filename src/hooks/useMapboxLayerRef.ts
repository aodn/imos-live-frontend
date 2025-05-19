import { useEffect, useRef } from 'react';

export function useMapboxLayerRef<T extends mapboxgl.Layer>(createLayer: () => T, deps?: any) {
  const layerRef = useRef<T | null>(null);

  useEffect(() => {
    layerRef.current = createLayer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deps]);

  return layerRef;
}
