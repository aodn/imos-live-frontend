// ── Public types ──────────────────────────────────────────────────────────────
export type {
  LodEntry,
  ProductManifest,
  ColorPalette,
  PalettePatch,
  AtlasLayerHandle,
  ParticleAtlasLayerHandle,
  ScalarAtlasLayerOptions,
  ParticleAtlasLayerOptions,
} from './types';

// ── Particle config (types, default values, and slider ranges) ────────────────
export type { ParticleConfig } from './config/particleConfig';
export {
  DEFAULT_PARTICLE_CONFIG,
  FADE_OPACITY_RANGE,
  SPEED_FACTOR_RANGE,
  DROP_RATE_RANGE,
  DROP_RATE_BUMP_RANGE,
  POINT_SIZE_RANGE,
} from './config/particleConfig';

// ── Layer interfaces and constructors (used by React bindings in the app) ─────
export type { HeatmapAtlasFieldAPI } from './layers/HeatmapAtlasField';
export type { ParticlesAtlasFieldAPI } from './layers/ParticlesAtlasField';
export type { HeatmapAtlasLayerInterface } from './layers/HeatmapAtlasLayer';
export type { ParticlesAtlasLayerInterface } from './layers/ParticlesAtlasLayer';
export { heatmapAtlasLayer } from './layers/HeatmapAtlasLayer';
export { particlesAtlasLayer } from './layers/ParticlesAtlasLayer';

// ── Factory functions  ─────────
import { heatmapAtlasLayer as _heatmapAtlasLayer } from './layers/HeatmapAtlasLayer';
import { particlesAtlasLayer as _particlesAtlasLayer } from './layers/ParticlesAtlasLayer';
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
