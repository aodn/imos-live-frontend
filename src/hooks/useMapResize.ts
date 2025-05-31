import { useEffect } from 'react';

export function useMapResize(
  map: React.RefObject<mapboxgl.Map | null>,
  mapContainer: React.RefObject<HTMLDivElement | null>,
) {
  useEffect(() => {
    if (!map.current) return;
    const observer = new ResizeObserver(() => {
      map.current?.resize();
    });
    if (mapContainer.current) {
      observer.observe(mapContainer.current);
    }
  }, [map, mapContainer]);
}
