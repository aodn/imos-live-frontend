import { useEffect } from 'react';

export function useMapZoomed(
  map: React.RefObject<mapboxgl.Map | null>,
  zoom: number,
  setZoom: (zoom: number) => void,
) {
  useEffect(() => {
    if (!map.current) return;
    map.current.on('zoomend', () => {
      //fire after zooming complete
      const currentZoom = map.current?.getZoom();
      if (typeof currentZoom !== 'number') return;
      setZoom(currentZoom);
    });

    map.current.setZoom(zoom);
  }, [map, zoom, setZoom]);
}
