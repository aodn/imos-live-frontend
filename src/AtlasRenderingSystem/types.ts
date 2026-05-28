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

export type ParticleConfig = {
  nParticles: number;
  fadeOpacity: number;
  speedFactor: number;
  dropRate: number;
  dropRateBump: number;
  pointSize: number;
};

export type CustomizableParticleConfig = ParticleConfig;

// Default slider positions for the standalone module. The host app overrides
// these via updateConfig from its own particle store; these are the fallback
// values used before the first override.
export const INITIAL_PARTICLE_CONFIG: CustomizableParticleConfig = {
  nParticles: 30000,
  fadeOpacity: 0.98, // 90% of the [0.9, 0.99] range
  speedFactor: 4.5, // 50% of the [1.0, 8.0] range
  dropRate: 0.002,
  dropRateBump: 0.05,
  pointSize: 0.9, // 10% of the [0.5, 5.0] range
};

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
