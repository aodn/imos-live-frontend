import { useEffect, useRef } from 'react';
import mapboxgl, { LngLat } from 'mapbox-gl';

export function useMapInitialization(
  style: string,
  center: LngLat,
  zoom: number,
  map: React.RefObject<mapboxgl.Map | null>,
) {
  const mapContainer = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (map.current) return;
    map.current = new mapboxgl.Map({
      container: mapContainer.current as HTMLElement,
      style,
      center: center,
      zoom: zoom,
      minZoom: 1,
      maxZoom: 14,
      antialias: true,
      projection: 'mercator',
      touchPitch: false,
      pitchWithRotate: false,
    });
  }, [center, map, style, zoom]);

  return { map, mapContainer };
}
