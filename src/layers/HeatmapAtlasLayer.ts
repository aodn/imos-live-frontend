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

import type { ProductManifest } from '@/api';
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
    manifest: ProductManifest,
    tileBaseUrl: string,
    legendRange: [number, number],
  ) => Promise<void>;
  updateLegendRange: (range: [number, number]) => void;
  setVisible: (visible: boolean) => void;
};

export function heatmapAtlasLayer(id: string, palette: ColorPalette): HeatmapAtlasLayerInterface {
  let mapRef: mapboxgl.Map | null = null;

  return {
    id,
    type: 'custom' as const,
    visible: false,

    onAdd(map, gl) {
      mapRef = map;
      this.field = createHeatmapAtlasField(map, gl as WebGL2RenderingContext, palette.colors);

      map.on('moveend', () => {
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

    async setSource(manifest: ProductManifest, tileBaseUrl: string, legendRange: [number, number]) {
      await this.field?.setSource(manifest, tileBaseUrl, legendRange);
      if (this.visible) {
        this.field?.setVisible(true);
        const bounds = mapRef?.getBounds();
        if (bounds) this.field?.onMapMove(bounds, mapRef!.getZoom());
      }
    },

    updateLegendRange(range: [number, number]) {
      this.field?.updateLegendRange(range);
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
