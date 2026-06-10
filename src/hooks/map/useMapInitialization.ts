import { MAX_ZOOM } from '@/constants';
import { useMapUIStore, setCenter, setZoom } from '@/store';
import type { LngLatBoundsLike } from 'mapbox-gl';
import mapboxgl from 'mapbox-gl';
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
      maxZoom: MAX_ZOOM,
      antialias: true,
      projection: 'mercator',
      touchPitch: false,
      pitchWithRotate: false,
      attributionControl: false,
      logoPosition: 'bottom-right',
      dragRotate: false,
      maxBounds,
      bounds: maxBounds,
      preserveDrawingBuffer: true,
      testMode: import.meta.env.VITE_AUTOMATED_TEST_RUNNING,
    });

    map.current.touchZoomRotate.disableRotation();
    map.current.setZoom(zoom);
    map.current.setCenter(center);

    if (import.meta.env.VITE_AUTOMATED_TEST_RUNNING) window.map = map.current;

    const handleMapMove = () => {
      setCenter(map.current!.getCenter());
      setZoom(map.current!.getZoom());
    };
    map.current.on('moveend', handleMapMove);
    map.current.on('zoomend', handleMapMove);
    return () => map.current?.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { map, mapContainer };
}
