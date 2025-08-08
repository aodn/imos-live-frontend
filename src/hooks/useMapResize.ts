import { useEffect } from 'react';

export function useMapResize(
  map: React.RefObject<mapboxgl.Map | null>,
  mapContainer: React.RefObject<HTMLDivElement | null>,
) {
  useEffect(() => {
    if (!mapContainer.current) return;
    const observer = new ResizeObserver(() => map.current?.resize());
    observer.observe(mapContainer.current);
    return () => observer.disconnect();
  }, [mapContainer]);
}
