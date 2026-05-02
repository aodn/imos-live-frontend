# Atlas Rendering System — Package Extraction Plan

The goal is to extract the Atlas Rendering System into a standalone, reusable package with a clean public interface. Another project should be able to render scalar overlays or particle animations on a Mapbox map by passing in a manifest URL, tile base URL, and colour config — without touching any atlas, shader, or scheduler code.

---

## Phase 1 — Define the public interface

This is the most important decision. Everything else follows from it.

```ts
// Scalar overlay (heatmap)
type ScalarAtlasLayerOptions = {
  map: mapboxgl.Map;
  layerId: string;
  fetchManifest: () => Promise<ProductManifest>;
  tileBaseUrl: string;
  colorPalette: ColorPalette;
  legendRange: [number, number];
};

// Particle overlay
type ParticleAtlasLayerOptions = {
  map: mapboxgl.Map;
  layerId: string;
  fetchManifest: () => Promise<ProductManifest>;
  tileBaseUrl: string;
  colorPalette: ColorPalette;
  legendRange: [number, number];
  particleConfig?: Partial<ParticleConfig>; // optional, has defaults
};

// What the consumer gets back
type AtlasLayerHandle = {
  setSource: (date?: string) => Promise<void>;
  setVisible: (visible: boolean) => void;
  updatePalette: (patch: PalettePatch) => void;
  destroy: () => void;
};
```

Consumer usage:

```ts
const layer = createScalarAtlasLayer({
  map,
  layerId: 'my-sst',
  fetchManifest: () => fetch('/api/sst/manifest.json').then(r => r.json()),
  tileBaseUrl: 'https://cdn.example.com/tiles/sst',
  colorPalette: { rawColors: [...], scale: 'linear', legendRange: [-2, 2] },
  legendRange: [-2, 2],
});

await layer.setSource('2024-01-15');
layer.setVisible(true);
```

---

## Phase 2 — Identify the package boundary

```
Package (zero app dependencies):      Stays app-specific:
─────────────────────────────────     ──────────────────────────────────────
src/webgl/                            hooks/layers/useWebGLHeatmapLayer.ts
  AtlasManager.ts                     hooks/layers/useParticleLayer.ts
  ChunkScheduler.ts                   constants/product.ts
  LODController.ts                      (PRODUCTLEGENDS, PRODUCTCOLORPALETTES)
  heatmapShader.ts
  particlesShader.ts

src/layers/
  HeatmapAtlasField.ts   ← needs refactor (3 app-specific imports)
  ParticlesAtlasField.ts ← needs refactor (3 app-specific imports)
  HeatmapAtlasLayer.ts
  particlesAtlasLayer.ts

src/utils/
  getColorRamp              ← move into package
  convertLogColorScale      ← move into package
  convertLinearColorScale   ← move into package

types/
  ProductManifest
  ColorPalette
  ParticleConfig
  PalettePatch
```

---

## Phase 3 — Refactor field classes

`HeatmapAtlasField` and `ParticlesAtlasField` currently import three app-specific modules:

| Import                                                        | Source                             | Replacement                          |
| ------------------------------------------------------------- | ---------------------------------- | ------------------------------------ |
| `getColorRamp`                                                | `@/utils`                          | Move into package                    |
| `convertLogColorScaleToRamp`, `convertLinearColorScaleToRamp` | `@/components/ColorScaleBar/utils` | Move into package                    |
| `INITIAL_PARTICLE_CONFIG`                                     | `@/config`                         | Bundle default config inside package |

The field classes themselves barely change — they already accept `tileBaseUrl` and `manifest` as arguments to `setSource`. Cutting these three imports is the bulk of the work.

---

## Phase 4 — Factory entry points

Two exported functions wrap the field class + Mapbox layer lifecycle. These are what consumers call — they never touch `HeatmapAtlasField` directly.

```ts
export function createScalarAtlasLayer(options: ScalarAtlasLayerOptions): AtlasLayerHandle;
export function createParticleAtlasLayer(options: ParticleAtlasLayerOptions): AtlasLayerHandle;
```

Each factory handles:

- Creating the WebGL context from the Mapbox map
- Registering the Mapbox `CustomLayerInterface`
- Calling `setSource` with the manifest and tile URL
- Wiring `onMapMove` to the map's `moveend` event
- Returning the `AtlasLayerHandle` to the consumer

---

## Phase 5 — Relocate into `src/AtlasRenderingSystem/`

Move the files identified in Phase 2 into a self-contained folder inside this project. No separate package setup needed — everything stays in the existing build.

```
src/
  AtlasRenderingSystem/        ← new home
    webgl/                     ← moved from src/webgl/
    layers/                    ← moved from src/layers/ (field + layer classes only)
    utils/                     ← color ramp utilities
    types.ts                   ← ProductManifest, ColorPalette, ParticleConfig, etc.
    index.ts                   ← public API (createScalarAtlasLayer, createParticleAtlasLayer)
```

App code imports only from `@/AtlasRenderingSystem` — never from its internal subfolders directly. This enforces the public interface boundary and makes a future npm extraction a straight file move with no import graph changes.

> **Future:** when another project needs this, extract `src/AtlasRenderingSystem/` into a standalone `@imos/atlas-rendering-system` npm package. The internal structure and public API stay identical.

---

## Phase 6 — React bindings (optional, stays in app)

A thin React wrapper over the factory functions, keeping React Query and Zustand wiring in the app layer:

```ts
// App-side — not part of the package
useScalarAtlasLayer({ map, product: PRODUCT.SST, date });
useParticleAtlasLayer({ map, product: PRODUCT.CURRENT, date });
```

These are the bridge between the package API and app state. They stay in `src/hooks/layers/` and are not exported from the package.

---

## Summary

| Phase                     | Work                                                                              | Effort | Prerequisite |
| ------------------------- | --------------------------------------------------------------------------------- | ------ | ------------ |
| 1. Define interface       | Design `ScalarAtlasLayerOptions`, `ParticleAtlasLayerOptions`, `AtlasLayerHandle` | Low    | —            |
| 2. Identify boundary      | Audit imports, list files to move                                                 | Low    | Phase 1      |
| 3. Refactor field classes | Cut 3 app-specific imports per file, replace with injected deps                   | Medium | Phase 2      |
| 4. Factory entry points   | Write `createScalarAtlasLayer` / `createParticleAtlasLayer`                       | Medium | Phase 3      |
| 5. Package extraction     | Move files, set up `package.json` / `tsconfig.json`                               | Low    | Phase 4      |
| 6. React bindings         | Thin wrapper in app, not in package                                               | Low    | Phase 5      |

Phase 1 is the decision that matters most — get the interface wrong and everything downstream needs rework. Implement phases sequentially; each is a clean checkpoint.
