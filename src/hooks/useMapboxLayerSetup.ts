import { useEffect, useState } from 'react';

export function useMapboxLayerSetup(
  map: React.RefObject<mapboxgl.Map | null>,
  setupLayerFn: () => Promise<void>,
  deps: any[],
) {
  const [loadComplete, setLoadComplete] = useState(false);
  const mapInstance = map.current;
  useEffect(() => {
    if (!mapInstance) return;

    const setupLayer = async () => {
      await setupLayerFn();
      setLoadComplete(true);
    };

    mapInstance.on('style.load', setupLayer);
    return () => {
      mapInstance.off('style.load', setupLayer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps]);

  return { loadComplete };
}
