import type { DependencyList } from 'react';
import { useEffect, useState } from 'react';

export function useMapboxLayerSetup(
  map: React.RefObject<mapboxgl.Map | null>,
  setupLayerFn: () => Promise<void>,
  deps: DependencyList = [],
) {
  const [loadComplete, setLoadComplete] = useState(false);

  useEffect(() => {
    if (!map.current) return;

    // Mapbox's event handler expects a void return, so keep the listener
    // synchronous and drive the async setup via a fire-and-forget IIFE. The
    // stable `setupLayer` reference is reused for both on() and off().
    const setupLayer = () => {
      void (async () => {
        await setupLayerFn();
        setLoadComplete(true);
      })();
    };

    map.current.on('style.load', setupLayer);
    return () => {
      // eslint-disable-next-line
      map.current?.off('style.load', setupLayer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { loadComplete };
}
