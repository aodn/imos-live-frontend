import { maxZoom } from '@/config';
import { useMapUIStore } from '@/store';
import mapboxgl, { LngLatBoundsLike } from 'mapbox-gl';
import { useEffect, useRef } from 'react';
import { useShallow } from 'zustand/shallow';

const maxBounds: LngLatBoundsLike = [
  [89.90022172949003, -60.0997150997151],
  [180.09977827050997, 10.0997150997151],
]; // Australia + New Zealand

export function useMapInitialization() {
  const { center, zoom } = useMapUIStore(
    useShallow(s => ({
      center: s.center,
      zoom: s.zoom,
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
      maxBounds,
      bounds: maxBounds,
      testMode: import.meta.env.VITE_AUTOMATED_TEST_RUNNING,
    });

    if (import.meta.env.VITE_AUTOMATED_TEST_RUNNING) (window as any).map = map.current;
    return () => map.current?.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { map, mapContainer };
}
