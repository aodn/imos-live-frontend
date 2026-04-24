/**
 * scalarAtlasLayer
 *
 * Mapbox custom layer wrapper for ScalarAtlasField.
 * Used by all scalar-overlay atlas products (sea level anomaly, SST anomaly mosaic, etc.).
 *
 * Usage:
 *   const layer = scalarAtlasLayer('gsla-anomaly-sea-levels-webgl-layer', palette);
 *   map.addLayer(layer);
 *   await layer.setSource(manifest, '/26-01-01/sea_level_anomaly', legendRange);
 *   layer.setVisible(true);
 */

import type { HeatmapAtlasProductManifest } from '@/api';
import { createHeatmapAtlasField } from './HeatmapAtlasField';
import type { HeatmapAtlasFieldAPI } from './HeatmapAtlasField';

export type ColorPalette = {
  name: string;
  colors: Record<string, string>; // hex colors
};

export type HeatmapAtlasLayerInterface = mapboxgl.CustomLayerInterface & {
  visible: boolean;
  field?: HeatmapAtlasFieldAPI;
  setSource: (
    manifest: HeatmapAtlasProductManifest,
    tileBaseUrl: string,
    legendRange: [number, number],
  ) => Promise<void>;
  updateLegendRange: (range: [number, number]) => void;
  setVisible: (visible: boolean) => void;
  onMoveStart: () => void;
  onMoveEnd: () => void;
};

export function heatmapAtlasLayer(id: string, palette: ColorPalette): HeatmapAtlasLayerInterface {
  return {
    id,
    type: 'custom' as const,
    visible: false,

    onAdd(map, gl) {
      this.field = createHeatmapAtlasField(map, gl as WebGL2RenderingContext, palette.colors);

      map.on('movestart', () => this.onMoveStart());
      map.on('moveend', () => {
        this.onMoveEnd();
        if (this.visible) {
          const bounds = map.getBounds();
          if (bounds) this.field?.onMapMove(bounds, map.getZoom());
        }
      });
      map.on('zoom', () => {
        if (this.visible) {
          const bounds = map.getBounds();
          if (bounds) this.field?.onMapMove(bounds, map.getZoom());
        }
      });
    },

    render() {
      this.field?.draw();
    },

    async setSource(
      manifest: HeatmapAtlasProductManifest,
      tileBaseUrl: string,
      legendRange: [number, number],
    ) {
      await this.field?.setSource(manifest, tileBaseUrl, legendRange);
      if (this.visible) this.field?.setVisible(true);
    },

    updateLegendRange(range: [number, number]) {
      this.field?.updateLegendRange(range);
    },

    setVisible(visible: boolean) {
      this.visible = visible;
      this.field?.setVisible(visible);
    },

    onMoveStart() {
      if (this.visible) this.field?.setVisible(false);
    },

    onMoveEnd() {
      if (this.visible) this.field?.setVisible(true);
    },
  };
}
