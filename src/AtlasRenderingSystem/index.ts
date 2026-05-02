// ── Public types ──────────────────────────────────────────────────────────────
export type {
  LodEntry,
  ProductManifest,
  ColorPalette,
  PalettePatch,
  ParticleConfig,
  CustomizableParticleConfig,
  AtlasLayerHandle,
  ParticleAtlasLayerHandle,
  ScalarAtlasLayerOptions,
  ParticleAtlasLayerOptions,
} from './types';
export { INITIAL_PARTICLE_CONFIG } from './types';

// ── Layer interfaces and constructors (used by React bindings in the app) ─────
export type { HeatmapAtlasFieldAPI } from './layers/HeatmapAtlasField';
export type { ParticlesAtlasFieldAPI } from './layers/ParticlesAtlasField';
export type { HeatmapAtlasLayerInterface } from './layers/HeatmapAtlasLayer';
export type { ParticlesAtlasLayerInterface } from './layers/particlesAtlasLayer';
export { heatmapAtlasLayer } from './layers/HeatmapAtlasLayer';
export { particlesAtlasLayer } from './layers/particlesAtlasLayer';

// ── Factory functions (Phase 4 — standalone, framework-agnostic API) ─────────
import { heatmapAtlasLayer as _heatmapAtlasLayer } from './layers/HeatmapAtlasLayer';
import { particlesAtlasLayer as _particlesAtlasLayer } from './layers/particlesAtlasLayer';
import type {
  AtlasLayerHandle,
  ParticleAtlasLayerHandle,
  ScalarAtlasLayerOptions,
  ParticleAtlasLayerOptions,
} from './types';

export function createScalarAtlasLayer(options: ScalarAtlasLayerOptions): AtlasLayerHandle {
  const { map, layerId, fetchManifest, tileBaseUrl, colorPalette, legendRange, beforeLayerId } =
    options;

  const layer = _heatmapAtlasLayer(layerId, colorPalette);

  if (beforeLayerId) {
    map.addLayer(layer, beforeLayerId);
  } else {
    map.addLayer(layer);
  }

  return {
    async setSource(date: string) {
      const manifest = await fetchManifest(date);
      await layer.setSource(manifest, `${tileBaseUrl}/${date}`, legendRange);
    },
    setVisible(visible: boolean) {
      layer.setVisible(visible);
    },
    updatePalette(patch) {
      layer.updatePalette(patch);
    },
    destroy() {
      if (map.getLayer(layerId)) map.removeLayer(layerId);
    },
  };
}

export function createParticleAtlasLayer(
  options: ParticleAtlasLayerOptions,
): ParticleAtlasLayerHandle {
  const {
    map,
    layerId,
    fetchManifest,
    tileBaseUrl,
    colorPalette,
    legendRange,
    particleConfig,
    beforeLayerId,
  } = options;

  const layer = _particlesAtlasLayer(layerId, colorPalette);

  if (beforeLayerId) {
    map.addLayer(layer, beforeLayerId);
  } else {
    map.addLayer(layer);
  }

  if (particleConfig) {
    layer.updateConfig(particleConfig);
  }

  return {
    async setSource(date: string) {
      const resolved = await fetchManifest(date);
      await layer.setSource(resolved, `${tileBaseUrl}/${date}`, legendRange);
    },
    setVisible(visible: boolean) {
      layer.setVisible(visible);
    },
    updatePalette(patch) {
      layer.updatePalette(patch);
    },
    updateConfig(config) {
      layer.updateConfig(config);
    },
    destroy() {
      if (map.getLayer(layerId)) map.removeLayer(layerId);
    },
  };
}
