import { LngLat } from 'mapbox-gl';
import { useEffect } from 'react';

export function useMapView(
  map: React.RefObject<mapboxgl.Map | null>,
  center: LngLat,
  zoom: number,
  setCenter: (center: LngLat) => void,
  setZoom: (zoom: number) => void,
) {
  useEffect(() => {
    if (!map.current) return;

    const mapInstance = map.current;

    const handleZoomEnd = () => {
      const currentZoom = mapInstance?.getZoom();
      if (typeof currentZoom === 'number') {
        const roundedZoom = parseFloat(currentZoom.toFixed(4));
        setZoom(roundedZoom);
      }
    };

    const handleMoveEnd = () => {
      const currentCenter = mapInstance?.getCenter();
      if (currentCenter) {
        setCenter(currentCenter);
      }
    };

    mapInstance.on('zoomend', handleZoomEnd);
    mapInstance.on('moveend', handleMoveEnd);

    return () => {
      mapInstance?.off('zoomend', handleZoomEnd);
      mapInstance?.off('moveend', handleMoveEnd);
    };
  }, [map, setCenter, setZoom]);

  useEffect(() => {
    if (!map.current) return;

    const currentCenter = map.current.getCenter();
    if (center.lat !== currentCenter.lat || center.lng !== currentCenter.lng) {
      map.current.setCenter([center.lng, center.lat]);
    }
  }, [center, map]);

  useEffect(() => {
    if (!map.current) return;

    const currentZoom = map.current.getZoom();
    if (Math.abs(zoom - currentZoom) > 0.01) {
      map.current.setZoom(zoom);
    }
  }, [zoom, map]);
}
