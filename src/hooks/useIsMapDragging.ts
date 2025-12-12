import { useState, useEffect } from 'react';

export function useIsMapDragging(mapRef: React.RefObject<mapboxgl.Map | null>) {
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const handleDragStart = () => setIsDragging(true);
    const handleDragEnd = () => setIsDragging(false);

    map.on('dragstart', handleDragStart);
    map.on('dragend', handleDragEnd);

    return () => {
      map.off('dragstart', handleDragStart);
      map.off('dragend', handleDragEnd);
    };
  }, [mapRef]);

  return isDragging;
}
