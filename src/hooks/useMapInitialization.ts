import { useEffect, useRef } from 'react';
import mapboxgl, { LngLat } from 'mapbox-gl';
import { maxZoom } from '@/config';

export function useMapInitialization(style: string, center: LngLat, zoom: number) {
  const map = useRef<mapboxgl.Map | null>(null);
  const mapContainer = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    map.current = new mapboxgl.Map({
      container: mapContainer.current!,
      style,
      center: center,
      zoom: zoom,
      minZoom: 1,
      maxZoom: maxZoom,
      antialias: true,
      projection: 'mercator',
      touchPitch: false,
      pitchWithRotate: false,
      attributionControl: false,
      dragRotate: false,
      touchZoomRotate: false,
    });

    if (import.meta.env.VITE_EXPOSE_MAPBOX) (window as any).map = map.current;
    return () => map.current?.remove();
  }, []);

  return { map, mapContainer };
}
