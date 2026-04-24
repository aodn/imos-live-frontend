/**
 * windAtlasLayer
 *
 * Mapbox custom layer wrapper for oceanCurrentAtlasField.
 * Mirrors the structure of vectorLayer.ts — same event wiring, same
 * visibility / config API — but drives oceanCurrentAtlasField instead of VectorField.
 *
 * Usage:
 *   const layer = windAtlasLayer('gsla-wind-atlas');
 *   map.addLayer(layer);
 *   await layer.setSource('/26-01-01/ocean_current');
 *   layer.setVisible(true);
 */

import type { CustomizableParticleConfig } from '@/config';
import type { HeatmapAtlasProductManifest } from '@/api';
import { createParticlesAtlasField } from './ParticlesAtlasField';
import type { ParticlesAtlasFieldAPI } from './ParticlesAtlasField';

export type ParticlesAtlasLayerInterface = mapboxgl.CustomLayerInterface & {
  visible: boolean;
  oceanCurrentAtlasField?: ParticlesAtlasFieldAPI;
  setSource: (
    manifest: HeatmapAtlasProductManifest,
    baseUrl: string,
    filePrefix: string,
    date: string,
    legendRange: [number, number],
  ) => Promise<void>;
  setVisible: (visible: boolean) => void;
  updateConfig: (config: Partial<CustomizableParticleConfig>) => void;
  onMoveStart: () => void;
  onMoveEnd: () => void;
  onResize: () => void;
};

export function particlesAtlasLayer(id: string): ParticlesAtlasLayerInterface {
  return {
    id,
    type: 'custom' as const,
    visible: false,

    onAdd(map, gl) {
      this.oceanCurrentAtlasField = createParticlesAtlasField(map, gl as WebGL2RenderingContext);

      map.on('movestart', () => this.onMoveStart());
      map.on('moveend', () => {
        this.onMoveEnd();
        if (this.visible) {
          const bounds = map.getBounds();
          if (bounds) this.oceanCurrentAtlasField?.onMapMove(bounds, map.getZoom());
        }
      });
      map.on('zoom', () => {
        if (this.visible) {
          const bounds = map.getBounds();
          if (bounds) this.oceanCurrentAtlasField?.onMapMove(bounds, map.getZoom());
        }
      });
      map.on('resize', () => this.onResize());
    },

    render() {
      this.oceanCurrentAtlasField?.draw();
    },

    async setSource(
      manifest: HeatmapAtlasProductManifest,
      baseUrl: string,
      filePrefix: string,
      date: string,
      legendRange: [number, number],
    ) {
      await this.oceanCurrentAtlasField?.setSource(
        manifest,
        baseUrl,
        filePrefix,
        date,
        legendRange,
      );
      if (this.visible) this.oceanCurrentAtlasField?.startAnimation();
    },

    setVisible(visible: boolean) {
      this.visible = visible;
      if (visible) {
        this.oceanCurrentAtlasField?.startAnimation();
      } else {
        this.oceanCurrentAtlasField?.stopAnimation();
      }
    },

    updateConfig(config: Partial<CustomizableParticleConfig>) {
      this.oceanCurrentAtlasField?.updateConfig(config);
    },

    onMoveStart() {
      if (this.visible) this.oceanCurrentAtlasField?.stopAnimation();
    },

    onMoveEnd() {
      if (this.visible) this.oceanCurrentAtlasField?.startAnimation();
    },

    onResize() {
      this.oceanCurrentAtlasField?.resize();
    },
  };
}
