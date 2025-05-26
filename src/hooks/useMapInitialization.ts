import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';

export function useMapInitialization(style: string, map: React.RefObject<mapboxgl.Map | null>) {
  const mapContainer = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current as HTMLElement,
      style,
      zoom: 3,
      antialias: true,
      projection: 'mercator',
      touchPitch: false,
      touchZoomRotate: false,
    });
  }, [map, style]);

  return { map, mapContainer };
}
