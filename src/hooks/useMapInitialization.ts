import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';

export function useMapInitialization(
  style: string,
  zoom: number,
  map: React.RefObject<mapboxgl.Map | null>,
) {
  const mapContainer = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (map.current) return;
    map.current = new mapboxgl.Map({
      container: mapContainer.current as HTMLElement,
      style,
      zoom: zoom,
      minZoom: 1,
      maxZoom: 12,
      antialias: true,
      projection: 'mercator',
      touchPitch: false,
      pitchWithRotate: false,
    });
  }, [map, style, zoom]);

  return { map, mapContainer };
}
