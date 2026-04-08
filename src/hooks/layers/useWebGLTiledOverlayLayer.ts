/**
 * Hook for using the tiled WebGL overlay layer
 * Example usage of the new tile-based architecture
 */

import { useToast } from '@/components';
import { WEBGL_OVERLAY_LAYER_ID } from '@/constants';
import { addLayerInOrder } from '@/helpers';
import { webGLTiledOverlayLayer as WebGLTiledOverlayLayer } from '@/layers/WebGLTiledOverlayLayer';
import { useMapUIStore } from '@/store';
import { useCallback, useMemo } from 'react';
import { useShallow } from 'zustand/shallow';
import { useMapboxLayerSetup } from './useMapboxLayerSetup';
import { useCustomLayerVisibility } from './useCustomLayerVisibility';
import { paletteA } from '@/config';

export function useWebGLTiledOverlayLayer(map: React.RefObject<mapboxgl.Map | null>) {
  const { showToast } = useToast();
  const { webglOverlay, dataset } = useMapUIStore(
    useShallow(s => ({
      webglOverlay: s.webglOverlay,
      dataset: s.dataset,
    })),
  );

  // Create the tiled layer (only once)
  const webglTiledOverlayLayer = useMemo(
    () => WebGLTiledOverlayLayer(`${WEBGL_OVERLAY_LAYER_ID}_tiled`, paletteA),
    [],
  );

  /**
   * Setup the tile source
   * This is where you configure how tiles are loaded
   */
  const setupTileSource = useCallback(() => {
    try {
      // Example: Configure tile source
      // You'll need to implement your tile URL template and metadata fetching
      webglTiledOverlayLayer.setTileSource({
        // Tile URL template - adjust this to match your tile server
        getTileUrl: (x: number, y: number, z: number) => {
          // Example 1: Simple file-based tiles
          return `/tiles/${dataset}/${z}/${x}/${y}.png`;

          // Example 2: Dynamic API endpoint
          // return `https://your-api.com/tiles/${dataset}/${z}/${x}/${y}.png`;

          // Example 3: With query parameters
          // return `/api/tiles?x=${x}&y=${y}&z=${z}&dataset=${dataset}`;
        },

        // Optional: Fetch metadata for each tile (range, etc.)
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        getMetadata: async (x: number, y: number, z: number) => {
          // Example: Fetch metadata from API
          // const response = await fetch(`/api/tiles/meta?x=${x}&y=${y}&z=${z}&dataset=${dataset}`);
          // const meta = await response.json();
          // return { range: meta.range };

          // Or use a default range if all tiles have the same range
          return { range: [-0.5, 0.5] as [number, number] };
        },

        // Zoom level constraints
        minZoom: 0,
        maxZoom: 10,
      });
    } catch (error) {
      console.error('Error setting up tile source:', error);
      showToast({
        type: 'error',
        title: 'Error occurred',
        message: 'Failed to setup tile source',
        duration: 6000,
      });
    }
  }, [dataset, webglTiledOverlayLayer, showToast]);

  /**
   * Setup the layer on the map
   */
  const setupLayer = useCallback(async () => {
    if (!map.current || !webglTiledOverlayLayer) return;

    // Add layer to map if not already added
    if (!map.current.getLayer(webglTiledOverlayLayer.id)) {
      addLayerInOrder(map, webglTiledOverlayLayer);
    }

    // Configure tile source
    setupTileSource();
  }, [map, webglTiledOverlayLayer, setupTileSource]);

  const { loadComplete } = useMapboxLayerSetup(map, setupLayer);

  useCustomLayerVisibility(map, loadComplete, webglTiledOverlayLayer, webglOverlay);

  return {
    updatePalette: webglTiledOverlayLayer?.updatePalette.bind(webglTiledOverlayLayer),
    getStats: webglTiledOverlayLayer?.getStats.bind(webglTiledOverlayLayer),
  };
}
