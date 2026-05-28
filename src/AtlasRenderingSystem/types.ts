// ── Manifest types ────────────────────────────────────────────────────────────

export type LodEntry = {
  grid: [number, number];
  storedPx: [number, number];
  chunkPx: [number, number];
  padding: number;
  zoomThreshold?: number;
};

export type ProductManifest = {
  bounds: { lonMin: number; lonMax: number; latMin: number; latMax: number };
  valueRange?: [number, number];
  uRange?: [number, number];
  vRange?: [number, number];
  lods: Record<string, LodEntry>;
  /**
   * Categorical products only: integer flag values present in the data, e.g.
   * `[0, 1, 2, 3, 4]`. Presence of this field tells the field/shader to switch
   * to a discrete colour lookup and NEAREST atlas/ramp sampling — continuous
   * products omit it.
   *
   * Assumed to be sequential integers spanning `valueRange[0]..valueRange[1]`
   * (the standard CF-conventions layout); the shader rounds the decoded raw
   * value to its index in this array.
   */
  flagValues?: number[];
  /** Categorical products only: human-readable label per `flagValues` entry. */
  flagMeanings?: string[];
};

// ── Color types ───────────────────────────────────────────────────────────────

export type ColorPalette = {
  legendRange: [number, number];
  rawColors: [number, number, number][];
  /**
   * 'log' / 'linear' build a 256-stop interpolated ramp.
   * 'category' uploads `rawColors` as a discrete N-pixel ramp with NEAREST
   * filtering — one colour per flag value, no interpolation.
   */
  scale: 'log' | 'linear' | 'category';
};

export type PalettePatch = Partial<ColorPalette>;

// ── Particle config types ─────────────────────────────────────────────────────
// Single source of truth lives in `./config/particleConfig` (types + ranges +
// default values). Re-exported here so the rest of the package can keep
// importing from `./types` without churn.

import type { ParticleConfig, CustomizableParticleConfig } from './config/particleConfig';
export type { ParticleConfig, CustomizableParticleConfig };
export { INITIAL_PARTICLE_CONFIG } from './config/particleConfig';

// ── Handle types (Phase 4 factory return value) ───────────────────────────────

export type AtlasLayerHandle = {
  setSource: (date: string) => Promise<void>;
  setVisible: (visible: boolean) => void;
  updatePalette: (patch: PalettePatch) => void;
  destroy: () => void;
};

export type ParticleAtlasLayerHandle = AtlasLayerHandle & {
  updateConfig: (config: Partial<ParticleConfig>) => void;
};

// ── Factory option types ──────────────────────────────────────────────────────

export type ScalarAtlasLayerOptions = {
  map: mapboxgl.Map;
  layerId: string;
  fetchManifest: (date: string) => Promise<ProductManifest>;
  tileBaseUrl: string;
  colorPalette: ColorPalette;
  legendRange: [number, number];
  beforeLayerId?: string;
};

export type ParticleAtlasLayerOptions = {
  map: mapboxgl.Map;
  layerId: string;
  fetchManifest: (date: string) => Promise<ProductManifest>;
  tileBaseUrl: string;
  colorPalette: ColorPalette;
  legendRange: [number, number];
  particleConfig?: Partial<ParticleConfig>;
  beforeLayerId?: string;
};
