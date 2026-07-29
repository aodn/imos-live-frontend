/**
 * particlesAtlasLayer
 *
 * Mapbox custom layer wrapper for ParticlesAtlasField. Wires map events to the
 * field, pausing the animation while the map moves and resuming on moveend.
 *
 * Usage:
 *   const layer = particlesAtlasLayer('gsla-ocean-current-atlas', palette);
 *   map.addLayer(layer);
 *   await layer.setSource(manifest, id => `/data_tiles/${id}?datetime=2026-01-01`, legendRange);
 *   layer.setVisible(true);
 */

import { createParticlesAtlasField } from './ParticlesAtlasField';
import type { ParticlesAtlasFieldAPI } from './ParticlesAtlasField';
import type {
  ParticleConfig,
  ProductManifest,
  ColorPalette,
  PalettePatch,
  LodZoomThresholds,
} from '../types';
import { throttle } from '../utils';

/** Mapbox fires `zoom` every frame of a zoom animation — cap onMapMove frequency. */
const ZOOM_THROTTLE_MS = 100;

export type ParticlesAtlasLayerInterface = mapboxgl.CustomLayerInterface & {
  visible: boolean;
  field?: ParticlesAtlasFieldAPI;
  setSource: (
    manifest: ProductManifest,
    buildTileUrl: (id: string) => string,
    legendRange: [number, number],
  ) => Promise<void>;
  setVisible: (visible: boolean) => void;
  updateConfig: (config: Partial<ParticleConfig>) => void;
  updatePalette: (patch: PalettePatch) => void;
  onMoveStart: () => void;
  onMoveEnd: () => void;
  onResize: () => void;
};

export function particlesAtlasLayer(
  id: string,
  palette: ColorPalette,
  lodZoomThresholds?: LodZoomThresholds,
): ParticlesAtlasLayerInterface {
  // Stored so onRemove can detach them — anonymous handlers would leak.
  let onMoveStartH: (() => void) | null = null;
  let onMoveEndH: (() => void) | null = null;
  let onZoomH: (() => void) | null = null;
  let onResizeH: (() => void) | null = null;

  return {
    id,
    type: 'custom' as const,
    visible: false,

    onAdd(map, gl) {
      this.field = createParticlesAtlasField(
        map,
        gl as WebGL2RenderingContext,
        palette,
        lodZoomThresholds,
      );

      onMoveStartH = () => this.onMoveStart();
      onMoveEndH = () => {
        this.onMoveEnd();
        if (this.visible) {
          const bounds = map.getBounds();
          if (bounds) this.field?.onMapMove(bounds, map.getZoom());
        }
      };
      onZoomH = throttle(() => {
        if (this.visible) {
          const bounds = map.getBounds();
          if (bounds) this.field?.onMapMove(bounds, map.getZoom());
        }
      }, ZOOM_THROTTLE_MS);
      onResizeH = () => this.onResize();

      map.on('movestart', onMoveStartH);
      map.on('moveend', onMoveEndH);
      map.on('zoom', onZoomH);
      map.on('resize', onResizeH);
    },

    onRemove(map) {
      if (onMoveStartH) map.off('movestart', onMoveStartH);
      if (onMoveEndH) map.off('moveend', onMoveEndH);
      if (onZoomH) map.off('zoom', onZoomH);
      if (onResizeH) map.off('resize', onResizeH);
      onMoveStartH = onMoveEndH = onZoomH = onResizeH = null;
      this.field?.destroy();
      this.field = undefined;
    },

    render() {
      this.field?.draw();
    },

    async setSource(
      manifest: ProductManifest,
      buildTileUrl: (id: string) => string,
      legendRange: [number, number],
    ) {
      await this.field?.setSource(manifest, buildTileUrl, legendRange);
      if (this.visible) this.field?.startAnimation();
    },

    setVisible(visible: boolean) {
      this.visible = visible;
      if (visible) {
        this.field?.startAnimation();
      } else {
        this.field?.stopAnimation();
      }
    },

    updateConfig(config: Partial<ParticleConfig>) {
      this.field?.updateConfig(config);
    },

    updatePalette(patch: PalettePatch) {
      this.field?.updatePalette(patch);
    },

    onMoveStart() {
      if (this.visible) this.field?.stopAnimation();
    },

    onMoveEnd() {
      if (this.visible) this.field?.startAnimation();
    },

    onResize() {
      this.field?.resize();
    },
  };
}
