import { useEffect, useState } from 'react';

export function useMapboxLayerSetup(
  map: React.RefObject<mapboxgl.Map | null>,
  setupLayerFn: () => Promise<void>,
  deps: any[] = [],
) {
  const [loadComplete, setLoadComplete] = useState(false);

  useEffect(() => {
    if (!map.current) return;

    const setupLayer = async () => {
      await setupLayerFn();
      setLoadComplete(true);
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
