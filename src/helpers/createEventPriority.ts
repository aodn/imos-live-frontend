import type { RefObject } from 'react';
import type { Map, MapMouseEvent } from 'mapbox-gl';

type EventPriorityConfig = {
  map: RefObject<Map | null>;
  distanceMeasurement: boolean;
  higherPriorityLayers?: string[]; // Layers that should block this handler
};

/**
 * Creates an event priority checker for map click events.
 * Uses Mapbox's queryRenderedFeatures to determine if higher priority layers
 * should handle the event instead.
 *
 * Provides a unified place to handle event priority logic across all handlers.
 */
export function createMapEventPriority({
  map,
  distanceMeasurement,
  higherPriorityLayers = [],
}: EventPriorityConfig) {
  const shouldHandleMapClick = (e?: MapMouseEvent): boolean => {
    if (!map.current) return false;

    // Distance measurement mode blocks all map clicks
    if (distanceMeasurement) return false;

    // Check if any higher priority layers were clicked
    if (higherPriorityLayers.length > 0 && e) {
      // Filter to only query layers that actually exist (handles dynamic layers)
      const existingLayers = higherPriorityLayers.filter(layerId => {
        const layer = map.current?.getLayer(layerId);
        return layer !== undefined;
      });

      if (existingLayers.length > 0) {
        const features = map.current.queryRenderedFeatures(e.point, {
          layers: existingLayers,
        });
        if (features.length > 0) return false; // Higher priority layer was clicked
      }
    }

    return true;
  };

  return {
    shouldHandleMapClick,
  };
}
