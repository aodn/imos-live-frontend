import { MAX_ZOOM } from '@/constants';
import { fitDefaultView } from '@/helpers';
import { useMapUIStore, setCenter, setZoom } from '@/store';
import type { LngLatBoundsLike, MapEvent } from 'mapbox-gl';
import mapboxgl from 'mapbox-gl';
import { useEffect, useRef } from 'react';
import { useShallow } from 'zustand/shallow';

const maxBounds: LngLatBoundsLike = [
  [68, -58],
  [178, -7],
]; // [SW, NE] — lon 68–178 (crosses the antimeridian to show GSLA's eastern edge), lat -58 to -7

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
    // No URL/saved view: fit to Australia.
    if (center === null || zoom === null) {
      fitDefaultView(map.current);
    } else {
      map.current.setZoom(zoom);
      map.current.setCenter(center);
    }

    if (import.meta.env.VITE_AUTOMATED_TEST_RUNNING) window.map = map.current;

    const handleMapMove = (e: MapEvent & { isDefaultView?: boolean }) => {
      // Default view is stored as null so the URL stays clean.
      if (e.isDefaultView) {
        setCenter(null);
        setZoom(null);
        return;
      }
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
