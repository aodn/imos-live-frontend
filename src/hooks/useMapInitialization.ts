import { maxZoom } from '@/config';
import { useMapUIStore } from '@/store';
import mapboxgl from 'mapbox-gl';
import { useEffect, useRef } from 'react';
import { useShallow } from 'zustand/shallow';

export function useMapInitialization() {
  const { center, zoom, setIsMapReady } = useMapUIStore(
    useShallow(s => ({
      center: s.center,
      zoom: s.zoom,
      setIsMapReady: s.setMapReady,
    })),
  );

  const map = useRef<mapboxgl.Map | null>(null);
  const mapContainer = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    map.current = new mapboxgl.Map({
      container: mapContainer.current!,
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
    map.current.on('load', () => setIsMapReady(true));
    return () => map.current?.remove();
  }, []);

  return { map, mapContainer };
}
