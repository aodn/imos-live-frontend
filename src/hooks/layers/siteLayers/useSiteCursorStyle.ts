import { SITE_CLUSTER_LAYER_ID, ZOOM_LIMIT_TEMP_POINTS_LAYER_ID } from '@/constants';
import { useEffect } from 'react';

/**
 * Manages cursor style changes when hovering over a site product's unclustered layer,
 * the shared cluster layer and the shared zoom-limit temp points layer.
 * Shows pointer cursor on mouseenter, normal cursor on mouseleave.
 */
export function useSiteCursorStyle(
  map: React.RefObject<mapboxgl.Map | null>,
  enabled: boolean,
  unclusteredLayerId: string,
) {
  useEffect(() => {
    if (!map.current || !enabled) return;
    const mapInstance = map.current;
    const layers = [SITE_CLUSTER_LAYER_ID, unclusteredLayerId, ZOOM_LIMIT_TEMP_POINTS_LAYER_ID];

    const handleMouseEnter = (e: mapboxgl.MapLayerMouseEvent) => {
      const inactive = e.features?.[0]?.properties?.hasDataForDate === false;
      mapInstance.getCanvas().style.cursor = inactive ? 'not-allowed' : 'pointer';
    };

    const handleMouseLeave = () => {
      mapInstance.getCanvas().style.cursor = '';
    };

    layers.forEach(layerId => {
      mapInstance.on('mouseenter', layerId, handleMouseEnter);
      mapInstance.on('mouseleave', layerId, handleMouseLeave);
    });

    return () => {
      layers.forEach(layerId => {
        mapInstance?.off(
          'mouseenter',
          layerId,
          handleMouseEnter as (e: mapboxgl.MapMouseEvent) => void,
        );
        mapInstance?.off('mouseleave', layerId, handleMouseLeave);
      });
      if (mapInstance?.getCanvas()) {
        mapInstance.getCanvas().style.cursor = '';
      }
    };
  }, [enabled, map, unclusteredLayerId]);
}
