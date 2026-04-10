/**
 * windAtlasLayer
 *
 * Mapbox custom layer wrapper for WindAtlasField.
 * Mirrors the structure of vectorLayer.ts — same event wiring, same
 * visibility / config API — but drives WindAtlasField instead of VectorField.
 *
 * Usage:
 *   const layer = windAtlasLayer('gsla-wind-atlas');
 *   map.addLayer(layer);
 *   await layer.setSource('/26-01-01/ocean_current');
 *   layer.setVisible(true);
 */

import type { CustomizableParticleConfig } from '@/config';
import { createWindAtlasField } from './WindAtlasField';
import type { WindAtlasFieldAPI } from './WindAtlasField';

export type WindAtlasLayerInterface = mapboxgl.CustomLayerInterface & {
  visible: boolean;
  windAtlasField?: WindAtlasFieldAPI;
  setSource: (baseUrl: string) => Promise<void>;
  setVisible: (visible: boolean) => void;
  updateConfig: (config: Partial<CustomizableParticleConfig>) => void;
  onMoveStart: () => void;
  onMoveEnd: () => void;
  onResize: () => void;
};

export function windAtlasLayer(id: string): WindAtlasLayerInterface {
  return {
    id,
    type: 'custom' as const,
    visible: false,

    onAdd(map, gl) {
      this.windAtlasField = createWindAtlasField(map, gl as WebGL2RenderingContext);

      map.on('movestart', () => this.onMoveStart());
      map.on('moveend', () => {
        this.onMoveEnd();
        if (this.visible) {
          const bounds = map.getBounds();
          if (bounds) this.windAtlasField?.onMapMove(bounds, map.getZoom());
        }
      });
      map.on('zoom', () => {
        if (this.visible) {
          const bounds = map.getBounds();
          if (bounds) this.windAtlasField?.onMapMove(bounds, map.getZoom());
        }
      });
      map.on('resize', () => this.onResize());
    },

    render() {
      this.windAtlasField?.draw();
    },

    async setSource(baseUrl: string) {
      await this.windAtlasField?.setSource(baseUrl);
      if (this.visible) this.windAtlasField?.startAnimation();
    },

    setVisible(visible: boolean) {
      this.visible = visible;
      if (visible) {
        this.windAtlasField?.startAnimation();
      } else {
        this.windAtlasField?.stopAnimation();
      }
    },

    updateConfig(config: Partial<CustomizableParticleConfig>) {
      this.windAtlasField?.updateConfig(config);
    },

    onMoveStart() {
      if (this.visible) this.windAtlasField?.stopAnimation();
    },

    onMoveEnd() {
      if (this.visible) this.windAtlasField?.startAnimation();
    },

    onResize() {
      this.windAtlasField?.resize();
    },
  };
}
