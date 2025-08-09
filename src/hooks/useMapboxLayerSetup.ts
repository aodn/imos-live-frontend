import { useEffect, useState, DependencyList, useRef } from 'react';

export function useMapboxLayerSetup(
  map: React.RefObject<mapboxgl.Map | null>,
  setupLayerFn: () => Promise<void>,
  deps: DependencyList = [],
) {
  const [loadComplete, setLoadComplete] = useState(false);
  const isSettingUpRef = useRef(false);

  const setupLayerFnRef = useRef(setupLayerFn);

  useEffect(() => {
    setupLayerFnRef.current = setupLayerFn;
  }, [setupLayerFn]);

  useEffect(() => {
    if (!map.current) return;

    let cancelled = false;
    isSettingUpRef.current = false;

    const setupLayer = async () => {
      if (isSettingUpRef.current || cancelled) return;
      isSettingUpRef.current = true;
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
          await setupLayerFnRef.current();
          setLoadComplete(true);
        }
      } catch (err) {
        if (import.meta.env.MODE !== 'production') {
          //this error is expected when select custom style, but not affect application running.
          console.error('Ignored error:', err);
        }
      } finally {
        isSettingUpRef.current = false;
      }
    };

    //setupLayer immediately if style is already loaded
    if (map.current.isStyleLoaded()) {
      setupLayer();
    }

    const handleStyleData = () => {
      if (map.current?.isStyleLoaded() && !isSettingUpRef.current) {
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
  }, [...deps]);

  return { loadComplete };
}
