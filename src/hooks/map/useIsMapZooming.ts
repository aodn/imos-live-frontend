import { useState, useEffect } from 'react';

export function useIsMapZooming(mapRef: React.RefObject<mapboxgl.Map | null>) {
  const [map, setMap] = useState<mapboxgl.Map | null>(mapRef.current);
  const [isZooming, setIsZooming] = useState(false);

  if (mapRef.current !== map) setMap(mapRef.current);

  useEffect(() => {
    if (!map) return;

    const handleZoomStart = () => setIsZooming(true);
    const handleZoomEnd = () => setIsZooming(false);

    map.on('zoomstart', handleZoomStart);
    map.on('zoomend', handleZoomEnd);

    return () => {
      map.off('zoomstart', handleZoomStart);
      map.off('zoomend', handleZoomEnd);
    };
  }, [map]);

  return isZooming;
}
