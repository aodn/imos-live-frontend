import {
  WAVE_BUOYS_LAYER_ID,
  UNCLUSTERED_WAVE_BUOYS_LAYER_ID,
  ZOOM_LIMIT_TEMP_POINTS_LAYER_ID,
} from '@/constants';
import { useEffect } from 'react';

const layers = [
  WAVE_BUOYS_LAYER_ID,
  UNCLUSTERED_WAVE_BUOYS_LAYER_ID,
  ZOOM_LIMIT_TEMP_POINTS_LAYER_ID,
] as const;

/**
 * Manages cursor style changes when hovering over wave buoy layers.
 * Shows pointer cursor on mouseenter, normal cursor on mouseleave.
 */
export function useWaveBuoysCursorStyle(
  map: React.RefObject<mapboxgl.Map | null>,
  enabled: boolean,
) {
  useEffect(() => {
    if (!map.current || !enabled) return;
    const mapInstance = map.current;

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
  }, [enabled, map]);
}
