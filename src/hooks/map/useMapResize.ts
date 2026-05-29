import { useCallback, useEffect } from 'react';
import { useRAFDFn } from '../useRAFDFn';

export function useMapResize(
  map: React.RefObject<mapboxgl.Map | null>,
  mapContainer: React.RefObject<HTMLDivElement | null>,
) {
  const resize = useRAFDFn(useCallback(() => map.current?.resize(), [map]));

  useEffect(() => {
    if (!mapContainer.current) return;
    const observer = new ResizeObserver(() => resize());
    observer.observe(mapContainer.current);
    return () => observer.disconnect();
  }, [mapContainer, resize]);
}
