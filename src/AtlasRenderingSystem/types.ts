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
};

// ── Color types ───────────────────────────────────────────────────────────────

export type ColorPalette = {
  legendRange: [number, number];
  rawColors: [number, number, number][];
  scale: 'log' | 'linear';
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

export const INITIAL_PARTICLE_CONFIG: CustomizableParticleConfig = {
  nParticles: 30000,
  fadeOpacity: Number(((0.99 - 0.9) * 0.9 + 0.9).toFixed(2)),
  speedFactor: Number(((8.0 - 1.0) * 0.5 + 1.0).toFixed(1)),
  dropRate: 0.002,
  dropRateBump: 0.05,
  pointSize: Number(((5.0 - 0.5) * 0.1 + 0.5).toFixed(1)),
} as const;

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
