/**
 * windAtlasLayer
 *
 * Mapbox custom layer wrapper for oceanCurrentAtlasField.
 * Mirrors the structure of vectorLayer.ts — same event wiring, same
 * visibility / config API — but drives oceanCurrentAtlasField instead of VectorField.
 *
 * Usage:
 *   const layer = particlesAtlasLayer('gsla-wind-atlas', palette);
 *   map.addLayer(layer);
 *   await layer.setSource(manifest, '/26-01-01/ocean_current', legendRange);
 *   layer.setVisible(true);
 */

import { createParticlesAtlasField } from './ParticlesAtlasField';
import type { ParticlesAtlasFieldAPI } from './ParticlesAtlasField';
import type {
  CustomizableParticleConfig,
  ProductManifest,
  ColorPalette,
  PalettePatch,
} from '../types';

export type ParticlesAtlasLayerInterface = mapboxgl.CustomLayerInterface & {
  visible: boolean;
  oceanCurrentAtlasField?: ParticlesAtlasFieldAPI;
  setSource: (
    manifest: ProductManifest,
    tileBaseUrl: string,
    legendRange: [number, number],
  ) => Promise<void>;
  setVisible: (visible: boolean) => void;
  updateConfig: (config: Partial<CustomizableParticleConfig>) => void;
  updatePalette: (patch: PalettePatch) => void;
  onMoveStart: () => void;
  onMoveEnd: () => void;
  onResize: () => void;
};

export function particlesAtlasLayer(
  id: string,
  palette: ColorPalette,
): ParticlesAtlasLayerInterface {
  return {
    id,
    type: 'custom' as const,
    visible: false,

    onAdd(map, gl) {
      this.oceanCurrentAtlasField = createParticlesAtlasField(
        map,
        gl as WebGL2RenderingContext,
        palette,
      );

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

    async setSource(manifest: ProductManifest, tileBaseUrl: string, legendRange: [number, number]) {
      await this.oceanCurrentAtlasField?.setSource(manifest, tileBaseUrl, legendRange);
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

    updatePalette(patch: PalettePatch) {
      this.oceanCurrentAtlasField?.updatePalette(patch);
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
