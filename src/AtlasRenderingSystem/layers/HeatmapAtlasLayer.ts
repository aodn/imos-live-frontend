/**
 * heatmapAtlasLayer
 *
 * Mapbox custom layer wrapper for HeatmapAtlasField.
 * Used by all scalar-overlay atlas products (sea level anomaly, SST anomaly mosaic, etc.).
 *
 * Usage:
 *   const layer = heatmapAtlasLayer('gsla-anomaly-sea-levels-webgl-layer', palette);
 *   map.addLayer(layer);
 *   await layer.setSource(manifest, '/26-01-01/sea_level_anomaly', legendRange);
 *   layer.setVisible(true);
 */

import { createHeatmapAtlasField } from './HeatmapAtlasField';
import type { HeatmapAtlasFieldAPI } from './HeatmapAtlasField';
import type { ProductManifest, ColorPalette, PalettePatch } from '../types';
import { throttle } from '../utils';

export type { ColorPalette, PalettePatch };

/** Mapbox fires `zoom` every frame of a zoom animation — cap onMapMove frequency. */
const ZOOM_THROTTLE_MS = 100;

export type HeatmapAtlasLayerInterface = mapboxgl.CustomLayerInterface & {
  visible: boolean;
  field?: HeatmapAtlasFieldAPI;
  setSource: (
    manifest: ProductManifest,
    tileBaseUrl: string,
    legendRange: [number, number],
  ) => Promise<void>;
  updatePalette: (patch: PalettePatch) => void;
  setVisible: (visible: boolean) => void;
};

export function heatmapAtlasLayer(id: string, palette: ColorPalette): HeatmapAtlasLayerInterface {
  let mapRef: mapboxgl.Map | null = null;
  // Stored so onRemove can detach them — anonymous handlers would leak.
  let onMoveEnd: (() => void) | null = null;
  let onZoom: (() => void) | null = null;

  return {
    id,
    type: 'custom' as const,
    visible: false,

    onAdd(map, gl) {
      mapRef = map;
      this.field = createHeatmapAtlasField(map, gl as WebGL2RenderingContext, palette);

      const forward = () => {
        if (this.visible) {
          const bounds = map.getBounds();
          if (bounds) this.field?.onMapMove(bounds, map.getZoom());
        }
      };
      onMoveEnd = forward;
      onZoom = throttle(forward, ZOOM_THROTTLE_MS);
      map.on('moveend', onMoveEnd);
      map.on('zoom', onZoom);
    },

    onRemove(map) {
      if (onMoveEnd) map.off('moveend', onMoveEnd);
      if (onZoom) map.off('zoom', onZoom);
      onMoveEnd = null;
      onZoom = null;
      this.field?.destroy();
      this.field = undefined;
      mapRef = null;
    },

    render() {
      this.field?.draw();
    },

    async setSource(manifest: ProductManifest, tileBaseUrl: string, legendRange: [number, number]) {
      await this.field?.setSource(manifest, tileBaseUrl, legendRange);
      if (this.visible) {
        this.field?.setVisible(true);
        const bounds = mapRef?.getBounds();
        if (bounds) this.field?.onMapMove(bounds, mapRef!.getZoom());
      }
    },

    updatePalette(patch: PalettePatch) {
      this.field?.updatePalette(patch);
    },

    setVisible(visible: boolean) {
      this.visible = visible;
      this.field?.setVisible(visible);
      if (visible) {
        const bounds = mapRef?.getBounds();
        if (bounds) this.field?.onMapMove(bounds, mapRef!.getZoom());
      }
    },
  };
}
