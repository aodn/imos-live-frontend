import { useState, useEffect } from 'react';

export function useIsMapDragging(mapRef: React.RefObject<mapboxgl.Map | null>) {
  const [map, setMap] = useState<mapboxgl.Map | null>(mapRef.current);
  const [isDragging, setIsDragging] = useState(false);

  if (mapRef.current !== map) setMap(mapRef.current);

  useEffect(() => {
    if (!map) return;

    const handleDragStart = () => setIsDragging(true);
    const handleDragEnd = () => setIsDragging(false);

    map.on('dragstart', handleDragStart);
    map.on('dragend', handleDragEnd);

    return () => {
      map.off('dragstart', handleDragStart);
      map.off('dragend', handleDragEnd);
    };
  }, [map]);

  return isDragging;
}
