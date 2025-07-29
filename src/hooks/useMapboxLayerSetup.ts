import { useEffect, useState, DependencyList } from 'react';

export function useMapboxLayerSetup(
  map: React.RefObject<mapboxgl.Map | null>,
  setupLayerFn: () => Promise<void>,
  deps: DependencyList = [],
) {
  const [loadComplete, setLoadComplete] = useState(false);
  const [isSettingUp, setIsSettingUp] = useState(false);

  useEffect(() => {
    if (!map.current) return;

    let cancelled = false;

    const setupLayer = async () => {
      if (isSettingUp || cancelled) return;

      setIsSettingUp(true);
      setLoadComplete(false);

      try {
        //ensure style is fully loaded
        if (!map.current?.isStyleLoaded()) {
          await new Promise<void>(resolve => {
            const checkLoaded = () => {
              if (map.current?.isStyleLoaded()) {
                map.current.off('idle', checkLoaded);
                resolve();
              }
            };
            map.current?.on('idle', checkLoaded);
          });
        }

        if (!cancelled) {
          await setupLayerFn();
          setLoadComplete(true);
        }
      } catch (error) {
        console.error('Error setting up layer:', error);
      } finally {
        setIsSettingUp(false);
      }
    };

    //setupLayer immediately if style is already loaded
    if (map.current.isStyleLoaded()) {
      setupLayer();
    }

    const handleStyleData = () => {
      if (map.current?.isStyleLoaded() && !isSettingUp) {
        setupLayer();
      }
    };

    //when style change or style loaded, set up layer.
    map.current.on('styledata', handleStyleData);
    map.current.on('style.load', setupLayer);

    return () => {
      cancelled = true;
      map.current?.off('styledata', handleStyleData);
      // eslint-disable-next-line react-hooks/exhaustive-deps
      map.current?.off('style.load', setupLayer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSettingUp, ...deps]);

  return { loadComplete };
}
