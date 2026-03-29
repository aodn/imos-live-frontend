import { useState, useEffect } from 'react';

export function useMapCanvasWidth(mapRef: React.RefObject<mapboxgl.Map | null>): number {
  const [map, setMap] = useState<mapboxgl.Map | null>(mapRef.current);
  const [width, setWidth] = useState<number>(mapRef.current?.getCanvas().clientWidth ?? 0);

  if (mapRef.current !== map) setMap(mapRef.current);

  useEffect(() => {
    if (!map) return;
    setWidth(map.getCanvas().clientWidth);
    const onResize = () => setWidth(map.getCanvas().clientWidth);
    map.on('resize', onResize);
    return () => {
      map.off('resize', onResize);
    };
  }, [map]);

  return width;
}
