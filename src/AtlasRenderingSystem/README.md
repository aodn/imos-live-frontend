# Atlas Rendering System

The Atlas Rendering System is the shared GPU infrastructure that backs all chunked, LOD-aware map overlays in IMOS Live. It powers two product types:

- **Scalar overlays** — full-viewport quad coloured by a decoded 24-bit scalar value (sea level anomaly, SST anomaly)
- **Particle animations** — GPU ping-pong particles that sample velocity from the atlas (ocean current)

Both share the same `AtlasManager` and `ChunkScheduler` primitives.

The package under `src/AtlasRenderingSystem/` is **self-contained and framework-agnostic** — it imports nothing from the host app (no `@/` paths) and depends only on `mapbox-gl` and `twgl.js`. Its public entry point is `index.ts` (`createScalarAtlasLayer` / `createParticleAtlasLayer` + types). The React/Zustand/React-Query glue listed below lives in the host app (`src/hooks/layers/*`, `src/api/*`), not in the package.

### Tech stack

| Component     | Technology            | Where                             |
| ------------- | --------------------- | --------------------------------- |
| Map           | Mapbox GL JS          | package                           |
| Rendering     | WebGL 2 (hand-rolled) | package                           |
| Shaders       | GLSL ES 3.00          | package                           |
| UI            | React + Zustand       | host app (`src/hooks`, store)     |
| Data fetching | React Query           | host app (`src/hooks`, `src/api`) |

---

## Adding a New Product

1. **Generate tiles** — produce `manifest.json` + PNG files named `{lod}/{cx}/{cy}.png`. See [Tile & LOD configuration](#tile--lod-configuration-manifestjson) for all manifest fields.

2. **`src/constants/`** — add entries to `PRODUCT` and `PRODUCTS` in `products.ts`, plus a `PRODUCTLEGENDS` entry in `legends.ts`. The legend's `colorKey` selects a palette from `COLOR_OPTIONS` (`src/constants/colors.ts`); `buildProductPalette` (`src/helpers/buildProductPalette.ts`) assembles the `ColorPalette` the layer uploads. See [Visual appearance](#visual-appearance) for what each controls.

3. **`MapComponent.tsx`** — wire the hook:

   ```tsx
   // scalar overlay (heatmap)
   useScalarAtlasLayer({
     map,
     layerId: PRODUCTS[PRODUCT.MY_PRODUCT].layerId,
     product: PRODUCT.MY_PRODUCT,
   });

   // particle animation
   useParticleAtlasLayer({
     map,
     layerId: PRODUCTS[PRODUCT.MY_PRODUCT].layerId,
     product: PRODUCT.MY_PRODUCT,
   });
   ```

4. **`src/constants/layerOrder.ts`** — add the layer ID to `LAYERS_ORDER`.

5. **`src/components/MainSidebar/products.tsx`** — add the sidebar entry.

No changes to atlas, shader, or scheduler code are needed unless the new product exceeds 4 LODs or a total virtual chunk count > 256. Atlas dimensions are auto-computed from the manifest — see [System limits](#system-limits-srcatlasrenderingsystemwebglatlasmanagerts) if you need to raise the VRAM cap.

---

## Customisation Reference

Everything you can tune. Most changes are manifest-only — no code changes needed.

### Tile & LOD configuration (manifest.json)

The manifest is the primary configuration file for each product. It controls tile resolution, geographic coverage, LOD structure, and data encoding.

```json
{
  "bounds": { "lonMin": 110.0, "lonMax": 163.7, "latMin": -46.0, "latMax": -8.2 },
  "valueRange": [-4.98, 4.46],
  "lods": {
    "1": { "grid": [3, 3], "chunkPx": [240, 192], "storedPx": [242, 194], "padding": 1 },
    "2": {
      "grid": [6, 5],
      "chunkPx": [240, 192],
      "storedPx": [242, 194],
      "padding": 1,
      "zoomThreshold": 5
    },
    "3": {
      "grid": [12, 10],
      "chunkPx": [240, 192],
      "storedPx": [242, 194],
      "padding": 1,
      "zoomThreshold": 6
    }
  }
}
```

| Field                     | What it controls                                                                                                      |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `bounds`                  | Geographic extent of the dataset                                                                                      |
| `valueRange`              | `[rawMin, rawMax]` of the encoded scalar — used for RGB24 decoding                                                    |
| `uRange`, `vRange`        | Velocity encoding ranges for particle products                                                                        |
| `flagValues`              | _(categorical only)_ Sequential integer flag values, e.g. `[0,1,2,3,4]`. Presence flips the heatmap to discrete mode. |
| `flagMeanings`            | _(categorical only)_ Human-readable label per flag value (same length as `flagValues`)                                |
| `lods['N'].grid`          | `[cols, rows]` — how many chunks tile the region at this LOD                                                          |
| `lods['N'].chunkPx`       | `[w, h]` — inner data pixels per tile (excludes padding). This is the geographic resolution knob.                     |
| `lods['N'].storedPx`      | `[w, h]` — actual PNG pixel size (= `chunkPx + [2×padding, 2×padding]`)                                               |
| `lods['N'].padding`       | Padding pixels on each side. Recommended: **1**. See guidance below.                                                  |
| `lods['N'].zoomThreshold` | _(LOD2+)_ Minimum map zoom to activate this LOD. Defaults to `6`. LOD1 ignores it.                                    |

**Categorical (discrete) products**

When `flagValues` is present, `HeatmapAtlasField` switches into categorical mode:

- The atlas is created with NEAREST filtering so neighbouring pixels with different flag values are not blended.
- The colour ramp becomes an N-pixel × 1 texture (one texel per `flagValues` entry, same order as the palette's `rawColors`), also sampled with NEAREST.
- The shader decodes the raw value, rounds it to its index in `flagValues` (assumed sequential integers spanning `valueRange[0]..valueRange[1]`), and samples the ramp at the centre of that texel.
- LOD blending: like every product, the finer LOD pops in fully on residency (progressive, no crossfade). For categorical data a hard replace is doubly required — interpolating RGB-encoded categorical scalars would invent intermediate categories that aren't in the data.

In the host app, the matching `PRODUCTLEGENDS` entry should set `scale: 'category'` and supply N colours under its `colorKey`. `buildProductPalette` then produces a `ColorPalette` with `scale: 'category'` and rawColors aligned 1:1 with `flagValues` from the manifest. See `AUSTEMP_HEATWAVE_MCS_CATEGORY` in `src/constants/products.ts` for a worked example.

LOD keys are sorted numerically at runtime — insertion order in the JSON does not matter. Up to `MAX_LODS = 4` LODs are supported.

**Choosing `chunkPx` and `padding`**

Keep `padding: 1`. GPU bilinear filtering samples a 2×2 texel neighbourhood — without at least 1 px of padding the border texel of one tile bleeds into the adjacent atlas slot. The cost is negligible (≈ 0.4% per side). `padding: 2` would only be warranted for anisotropic or mip-mapped filtering, neither of which this system uses.

`chunkPx` is the tile resolution knob. Choose it based on how much geography you want each tile to cover, then derive `storedPx = chunkPx + [2, 2]`. The atlas auto-sizes to fit based on the grid counts — any `chunkPx` value works without code changes.

#### Atlas auto-sizing

Atlas dimensions are computed automatically from `storedPx` and the LOD grids — you do not need to specify them. The sizing target is `LOD1 count + largest single on-demand LOD count`, which guarantees that any one zoom level can be fully resident without eviction. LRU handles any overflow. Both dimensions are capped at `MAX_ATLAS_SIZE = 4096` (64 MB per atlas).

With the current manifest (storedPx=242×194, LOD1 3×3, LOD2 6×5, LOD3 12×10):

| Product        | `totalRequired`   | Auto-sized atlas | Slots           | Pool |
| -------------- | ----------------- | ---------------- | --------------- | ---- |
| Scalar heatmap | 9 + 120 = **129** | 4096 × 2048      | 16×10 = **160** | 151  |
| Particle       | 9 + 30 = **39**   | 2048 × 1024      | 8×5 = **40**    | 31   |

Switching to 256×256 `chunkPx` (258×258 `storedPx`) auto-sizes to 4096×4096 — no code change needed.

---

### Visual appearance

| Constant                                      | What it controls                                                                                                 |
| --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `PRODUCTLEGENDS` (`src/constants/legends.ts`) | Legend `label`, colour scale type (`linear`/`log`), `[min, max]` display `range`, and a `colorKey`               |
| `COLOR_OPTIONS` (`src/constants/colors.ts`)   | Maps each `colorKey` to its raw RGB tuples; `buildProductPalette` converts them into the uploaded `ColorPalette` |

`u_value_range` (from manifest) and `u_legend_range` (from `PRODUCTLEGENDS`) are intentionally separate — the colour ramp can be narrowed for visual emphasis without changing the stored data encoding.

---

### Particle behaviour (`src/AtlasRenderingSystem/config/particleConfig.ts`)

Applies only to the ocean current particle layer.

| Parameter      | Default | Effect                                         |
| -------------- | ------- | ---------------------------------------------- |
| `nParticles`   | 30 000  | Total particle count                           |
| `fadeOpacity`  | 0.98    | Trail persistence (higher = longer trails)     |
| `speedFactor`  | 4.5     | Velocity multiplier                            |
| `dropRate`     | 0.002   | Base probability of respawning per frame       |
| `dropRateBump` | 0.05    | Extra respawn chance for fast-moving particles |
| `pointSize`    | 0.9     | Particle size in pixels                        |

---

### System limits (`src/AtlasRenderingSystem/webgl/AtlasManager.ts`)

These are code constants. Change them only if your product genuinely exceeds the current bounds.

| Constant               | Value | Where to change           | When to raise it                                                |
| ---------------------- | ----- | ------------------------- | --------------------------------------------------------------- |
| `MAX_ATLAS_SIZE`       | 4096  | `webgl/AtlasManager.ts`   | Product needs more slots than 4096² can provide                 |
| `MAX_LODS`             | 4     | `webgl/AtlasManager.ts`   | Product has more than 4 LOD levels                              |
| Fetch concurrency      | 6     | `webgl/ChunkScheduler.ts` | Too many/few parallel tile requests                             |
| `MAX_RETRIES`          | 3     | `webgl/ChunkScheduler.ts` | Transient tile failures should retry more/less before giving up |
| Default zoom threshold | 6     | `webgl/ChunkScheduler.ts` | LOD2 should activate earlier or later when not set in manifest  |

The virtual chunk array size (`u_chunk_slots[N]`) and atlas slot array size (`u_slots[N]`) are both computed dynamically from the manifest and injected into the shader at compile time — no constant to update. The only hard limit is the device's uniform budget, validated at runtime: `totalSlots × 4 + totalVirtualChunks + 30 ≤ gl.MAX_FRAGMENT_UNIFORM_COMPONENTS`. If this throws, the product has too many tiles for the device.

---

## Technical Internals

### The Atlas Texture

The atlas is a **single WebGL texture** (a pre-allocated block of VRAM) that holds all loaded tile images at once. The GPU can only sample from one bound texture per draw call, so packing all tiles into one atlas means one bind per draw call — all of the GPU's parallel fragment cores sample from the same texture simultaneously without rebinding.

**Slot layout**

The atlas is partitioned into a fixed grid of **slots**, each exactly one stored chunk PNG in size (`storedPx`, e.g. 242×194 px). Slots are numbered left-to-right, top-to-bottom:

```
atlasCols  = floor(atlasW / slotW)
atlasRows  = floor(atlasH / slotH)
totalSlots = atlasCols × atlasRows

Atlas texture (e.g. 4096×2048, slotW=242, slotH=194 → 16×10 = 160 slots)

col:  0        1        2              15
     ┌────────┬────────┬────────┬─────┬────────┐
  0  │ slot 0 │ slot 1 │ slot 2 │ ... │slot 15 │
     ├────────┼────────┼────────┤     ├────────┤
  1  │slot 16 │slot 17 │slot 18 │ ... │slot 31 │
     ├────────┼────────┼────────┤     ├────────┤
 ...
     ├────────┼────────┼────────┤     ├────────┤
  9  │slot144 │slot145 │slot146 │ ... │slot159 │
     └────────┴────────┴────────┴─────┴────────┘
```

Each slot's UV origin and scale are precomputed once at initialisation and stored in `u_slots[physSlot]`:

```
u_slots[i] = vec4(
  (col * slotW) / atlasW,   // UV x origin
  (row * slotH) / atlasH,   // UV y origin
   slotW / atlasW,           // UV x scale
   slotH / atlasH            // UV y scale
)
```

**PNG → atlas upload**

```
Network         CPU                            GPU (VRAM)
────────────────────────────────────────────────────────────────
tile.png  →  fetch()  →  createImageBitmap()  →  texSubImage2D()  →  atlas slot
             download     decode PNG to            write pixels         persists for
             bytes        raw RGBA pixels          at (col*slotW,       layer lifetime
                          (off main thread)         row*slotH)
```

`createImageBitmap()` decompresses the PNG on the CPU (off main thread). `texSubImage2D()` copies the raw pixels into the slot's pixel region in VRAM. The `ImageBitmap` is then discarded — it was only needed as a staging buffer for the transfer.

---

### Geographic Chunks → Atlas Slots

**Two grids**

| Grid                    | What it represents                      | Defined by                                  |
| ----------------------- | --------------------------------------- | ------------------------------------------- |
| **Chunk grid** (cx, cy) | How the geographic data region is tiled | Manifest: `lods['N'].grid`                  |
| **Atlas slot grid**     | How physical slots are packed in VRAM   | `floor(atlasW/slotW) × floor(atlasH/slotH)` |

These are deliberately decoupled — the geographic tiling can be any shape without affecting how slots are packed in the texture.

**Virtual index**

Every chunk has a **virtual index** — a stable integer that identifies its position across all LODs regardless of whether it is currently resident in the atlas:

```
virtualIdx = u_lod_offsets[lodIdx] + cy × cols + cx
```

`u_lod_offsets` accumulates the total chunk count of all coarser LODs. With LOD1 (3×3=9 chunks) and LOD2 (6×5=30 chunks):

```
u_lod_offsets = [ 0,  9, 39, ... ]
                  ↑   ↑   ↑
                LOD1 LOD2 LOD3
```

**Slot assignment**

LOD1 chunks occupy dedicated slots — their physical slot equals their virtual index directly (no indirection, never evicted). LOD2+ chunks compete for the shared pool, assigned dynamically at upload time with LRU eviction when the pool is full.

```
LOD1 3×3 chunk grid              Atlas slot assignment for LOD1
(geographic space —              (dedicated slots 0–8, formula-based)
 cx: west→east
 cy: north→south)                 slot = virtualIdx = cy×cols + cx

 ┌────────┬────────┬────────┐     cy=0: cx=0→slot 0  cx=1→slot 1  cx=2→slot 2
 │(cx0,0) │(cx1,0) │(cx2,0) │     cy=1: cx=0→slot 3  cx=1→slot 4  cx=2→slot 5
 ├────────┼────────┼────────┤     cy=2: cx=0→slot 6  cx=1→slot 7  cx=2→slot 8
 │(cx0,1) │(cx1,1) │(cx2,1) │
 ├────────┼────────┼────────┤     LOD2+ chunks → dynamically assigned
 │(cx0,2) │(cx1,2) │(cx2,2) │     from pool (slots 9–N)
 └────────┴────────┴────────┘
```

The `u_chunk_slots[virtualIdx]` array bridges virtual index to physical slot:

- `≥ 0` — chunk is resident; value is the physical slot index
- `= −1` — chunk is not loaded (not yet fetched, or evicted)

**Dynamic updates and eviction**

`u_chunk_slots` is a CPU-side `Int32Array` that is uploaded as a uniform at the start of every draw call. The GPU always sees a fresh snapshot — there is no partial update; the entire array is sent each frame.

| Event                                    | CPU action                               |
| ---------------------------------------- | ---------------------------------------- |
| New LOD2+ chunk uploaded, pool has space | `chunkSlots[newVirtIdx] = physSlot`      |
| New LOD2+ chunk uploaded, pool is full   | Evict LRU first (see below), then assign |
| Chunk evicted                            | `chunkSlots[evictedVirtIdx] = -1`        |

**Eviction sequence** — when the pool is full and a new chunk arrives:

```
Before eviction                           After eviction
───────────────────────────────────────────────────────────────────
chunkSlots[victimVirtIdx] = 42   →   chunkSlots[victimVirtIdx] = -1
chunkSlots[newVirtIdx]    = -1   →   chunkSlots[newVirtIdx]    = 42

Atlas texture: slot 42 pixels   →   slot 42 pixels overwritten
               = victim's data       = new chunk's data
```

The physical slot number (42) stays the same — only its contents and the two `chunkSlots` entries change. On the next draw call, the shader looks up `u_chunk_slots[victimVirtIdx]` → `-1` (skip), and `u_chunk_slots[newVirtIdx]` → `42` (sample).

**LOD1 is immune** — its slots are dedicated and never enter the pool, so eviction never touches `chunkSlots[0 … lod1Count−1]`.

**ChunkId convention**

```
"{lod}/{cx}/{cy}"    e.g.  "1/0/0",  "2/3/2",  "3/5/4"
```

File URL: `{baseUrl}/{lod}/{cx}/{cy}.png`

---

### Shader Coordinate Lookup

For every fragment (screen pixel), the shader determines which geographic location it represents, finds the correct atlas chunk for that location, and samples the data. The full lookup has five steps.

**Step 1 — Screen position → lon/lat**

The vertex shader passes `v_screen_pos` as a Mercator [0,1]×[0,1] position. The fragment shader reconstructs lon/lat using the viewport bounds (`u_bounds = [nwX, seY, seX, nwY]` in Mercator):

```glsl
float mercX = fract(u_bounds.x + pos.x * abs(u_bounds.x - u_bounds.z));
float mercY = u_bounds.w     + pos.y * abs(u_bounds.y - u_bounds.w);
float lon   = mercX * 360.0 - 180.0;
float lat   = 360.0/PI * atan(exp((180.0 - mercY*360.0) * PI/180.0)) - 90.0;
```

Fragments outside `u_data_bounds` are discarded immediately.

**Step 2 — lon/lat → chunk (cx, cy)**

```glsl
cx = clamp(floor((lon  − lonMin) / (lonRange / cols)), 0, cols−1)
cy = clamp(floor((latMax − lat)  / (latRange / rows)), 0, rows−1)
// cy=0 is the northernmost row, matching chunk generation convention
```

**Step 3 — (cx, cy) → virtual index → physical slot**

```glsl
int virtualIdx = u_lod_offsets[lodIdx] + cy * int(grid.x) + cx;
int physSlot   = u_chunk_slots[virtualIdx];   // −1 = not resident
```

If `physSlot < 0`, the chunk is absent — skip this LOD (or discard for LOD1).

**Step 4 — Physical slot → atlas UV origin and scale**

```glsl
vec4 slot = u_slots[physSlot];
// slot.xy  = UV origin (top-left corner of the slot in the atlas)
// slot.zw  = UV scale  (slot width/height in normalised UV space)
```

**Step 5 — Local UV within the chunk, with padding correction**

Each PNG has 1px of padding on each side to prevent bilinear bleed at tile edges. `u_uv_scale` and `u_uv_offset` crop the local [0,1] UV into the inner data region only:

```glsl
// u_uv_scale  = chunkPx / storedPx   (e.g. [240/242, 192/194])
// u_uv_offset = padding / storedPx   (e.g. [1/242,   1/194])
localU = localU * u_uv_scale.x + u_uv_offset.x;
localV = localV * u_uv_scale.y + u_uv_offset.y;

vec2 atlasUV = slot.xy + vec2(localU, localV) * slot.zw;
vec4 sample  = texture(u_atlas, atlasUV);
```

**LOD blending — progressive, no crossfade**

Rendering is **progressive**: every resident chunk is sampled the moment it lands, and each finer chunk fully replaces the coarser sample under it at full opacity. Finer detail pops in tile-by-tile as the `ChunkScheduler` fills the viewport — there is no animated crossfade and no "wait for the whole LOD to finish loading" gate. A region whose finer tile hasn't arrived simply shows the coarser LOD beneath it until it does.

`u_lod_count` is **zoom-gated**, not static. Each Field's `draw()` computes the active LOD count from the current map zoom and the per-LOD `zoomThreshold`s via `computeActiveLodCount`: LOD1 is always active; LOD2+ counts only while `zoom > threshold`. Two consequences worth knowing:

- The shader's loop shrinks as the user zooms out. A LOD2+ chunk loaded at a deeper zoom and still resident in the atlas after zoom-out is **not sampled** until the user zooms back past its threshold — preventing the square-patchwork artefact that would otherwise appear at low zoom (a stale intermediate-LOD chunk overriding LOD1).
- The chunks are **not evicted** by the zoom change. The atlas keeps them so zooming back in is instant; eviction remains purely LRU-driven by upload pressure (see [AtlasManager](#atlasmanager)).

Pan/zoom cycle:

1. User pans or zooms → `syncSchedulersOnMove` updates every scheduler with the new viewport.
2. `ChunkScheduler` fetches the LOD2+ tiles now in view.
3. Each tile, on upload, fires `onChunkLoaded` → `map.triggerRepaint()`, so it appears as soon as it's decoded.

The fragment shader:

```glsl
if (physicalSlot(lonlat, 0) < 0) discard;   // LOD1 tile not resident — skip (no u_slots[-1])
vec4 result = texture(u_atlas, worldToAtlasUV(lonlat, 0));
if (result.a < 0.01) discard;

// Each resident finer chunk replaces the coarser sample at full opacity.
for (int i = 1; i < u_lod_count; i++) {
    if (physicalSlot(lonlat, i) >= 0) {
        vec4 finer = texture(u_atlas, worldToAtlasUV(lonlat, i));
        if (finer.a >= 0.01) result = finer;
    }
}
```

The particle position-update shader samples LOD1 only and skips this loop entirely.

**RGB24 scalar decoding** (heatmap only)

Each chunk PNG stores a scalar as a 24-bit integer spread across R, G, B channels:

```glsl
float decoded  = (R*65536.0 + G*256.0 + B) / 16777215.0;
float rawValue = decoded * (u_value_range.y - u_value_range.x) + u_value_range.x;
float t        = clamp(
    (rawValue - u_legend_range.x) / (u_legend_range.y - u_legend_range.x),
    0.0, 1.0
);
```

**Particle engine**

The particle layer runs a second rendering loop on top of the atlas lookup. Six steps execute every animation frame:

1. **Initialise** — particles start at random Mercator [0,1]×[0,1] positions in a `RG32F` GPU texture.
2. **Sample velocity** — the update shader looks up the atlas chunk for each particle's (lon, lat), decodes UCUR/VCUR from R/G channels, and applies a Mercator offset scaled by `speedFactor`.
3. **Ping-pong** — updated positions write to an off-screen texture; the previous frame's texture is read. Roles swap each frame.
4. **Random drop** — particles whose `rand(seed) > 1 − dropRate − speed_t × dropRateBump` are respawned at a new random position.
5. **Draw** — a point sprite is rendered at each particle position, coloured by speed via `u_color_ramp`.
6. **Fade trail** — the screen framebuffer is composited at reduced opacity (`fadeOpacity`) each frame.

---

### Data Flow

```
manifest.json
    │
    ▼
useScalarAtlasLayer / useParticleAtlasLayer
    │  fetches manifest, calls handle.setSource(date)
    │  → factory resolves manifest then calls layer.setSource(manifest, baseUrl, legendRange)
    ▼
HeatmapAtlasField / ParticlesAtlasField  (setSource)
    │  1. sort manifest.lods numerically
    │  2. compute uvScale = chunkPx/storedPx, uvOffset = padding/storedPx
    │  3. create AtlasManager(gl, { slotPx: lod1.storedPx, lods })
    │     → auto-computes atlas dimensions from storedPx + LOD grids
    │  4. compile shaders with totalSlots injected as compile-time constant (first call only)
    │
    │  Heatmap:
    │  5. create ChunkSchedulers for LOD2..N
    │  6. start progressive LOD1 preload — resolves on first tile uploaded,
    │     remaining tiles continue in the background
    │
    │  Particles:
    │  5. await full LOD1 preload (Promise.all) — all tiles must be resident
    │     before resolving (update shader samples LOD1 without a residency guard)
    │  6. create ChunkSchedulers for LOD2..N
    ▼
Map interactions (pan / zoom)  →  onMapMove(bounds, zoom)
    │  ChunkScheduler.update(bounds, zoom)
    │      - no-ops if zoom ≤ zoomThreshold
    │      - calls atlas.touch() for every visible loaded chunk (LRU refresh)
    │      - aborts in-flight requests for chunks outside the buffer zone
    │      - fetches missing chunks (viewport = priority 0, buffer ring = priority 1)
    │      - uploads each decoded ImageBitmap → atlas.upload()
    │      - fires onChunkLoaded callback
    ▼
onChunkLoaded  →  map.triggerRepaint()           ← reveal the new chunk progressively
    │                  (heatmap has no rAF loop, so this is what shows each tile;
    │                   particles also repaint continuously via tick())
    ▼
draw()  — called every frame by Mapbox render()
    │  uploads uniforms: u_atlas, u_slots, u_chunk_slots,
    │                    u_lod_grids, u_lod_offsets, u_lod_count,
    │                    u_uv_scale, u_uv_offset, …
    ▼
GPU fragment shader  (see Shader Coordinate Lookup)
    ▼
Screen
```

---

## API Reference

### AtlasManager

**File:** `src/AtlasRenderingSystem/webgl/AtlasManager.ts`

Manages the GPU texture and the virtual→physical slot mapping.

```ts
createAtlasManager(gl, config: AtlasConfig): AtlasManagerAPI
```

**`AtlasConfig`**

| Field    | Type                                | Description                                                                               |
| -------- | ----------------------------------- | ----------------------------------------------------------------------------------------- |
| `slotPx` | `[number, number]`                  | Slot pixel size `[w, h]` — set to `lod1.storedPx`                                         |
| `lods`   | `Array<{ grid: [number, number] }>` | LOD configs, coarsest first                                                               |
| `filter` | `'linear' \| 'nearest'`             | Atlas min/mag filter. Defaults to `'linear'`. Categorical products must pass `'nearest'`. |

Atlas dimensions are auto-computed from `slotPx` and the LOD grids (see [Atlas auto-sizing](#atlas-auto-sizing)).

**Methods**

| Method                    | Description                                                                                                                                 |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `upload(chunkId, img)`    | Upload ImageBitmap into the atlas. LOD2+ triggers LRU if the pool is full.                                                                  |
| `has(chunkId)`            | True if the chunk is currently resident.                                                                                                    |
| `touch(chunkId)`          | Refresh LRU timestamp. Call for every visible chunk each frame.                                                                             |
| `getTexture()`            | The `WebGLTexture` → `u_atlas`                                                                                                              |
| `getSlotsData()`          | `Float32Array` — static UV layout per slot → `u_slots`                                                                                      |
| `getChunkSlots()`         | `Int32Array` — virtual→physical mapping → `u_chunk_slots`                                                                                   |
| `getLodOffsets()`         | `Int32Array` — cumulative LOD offsets → `u_lod_offsets`                                                                                     |
| `getLodCount()`           | Manifest LOD count. The Field zoom-gates this via `computeActiveLodCount` before writing `u_lod_count` (see [LOD blending](#lod-blending)). |
| `getTotalSlots()`         | Total physical slots (atlasCols × atlasRows)                                                                                                |
| `getTotalVirtualChunks()` | Sum of all LOD grid cells → sizes `u_chunk_slots`                                                                                           |
| `getAtlasW()`             | Actual atlas width after auto-sizing and clamping                                                                                           |
| `getAtlasH()`             | Actual atlas height after auto-sizing and clamping                                                                                          |
| `destroy()`               | Delete GPU texture and reset all state.                                                                                                     |

**LRU eviction**

When a LOD2+ chunk is uploaded and the pool is full, the chunk with the oldest `lastUsed` timestamp is evicted: its `u_chunk_slots` entry is set to `-1` and its physical slot is reused. `ChunkScheduler` re-queues evicted chunks when they re-enter the viewport.

---

### HeatmapAtlasField

**File:** `src/AtlasRenderingSystem/layers/HeatmapAtlasField.ts`

Orchestrates the atlas, schedulers, and LOD controller for scalar overlay products.

```ts
setSource(manifest, tileBaseUrl, legendRange): Promise<void>
updatePalette(patch: PalettePatch): void   // legendRange, rawColors, and/or scale
setVisible(visible: boolean): void
onMapMove(bounds: LngLatBounds, zoom: number): void
draw(): void
destroy(): void                            // free GPU resources; call from the layer's onRemove
```

**Progressive LOD1 preload** — `setSource` resolves as soon as the first LOD1 tile is uploaded so the layer becomes visible immediately. Remaining tiles continue in the background; each upload triggers `map.triggerRepaint()` so coverage fills in progressively. Rejects only if every tile fails.

A `fetchGeneration` counter discards stale upload callbacks if `setSource` is called again (e.g. date change) before the previous fetch completes. Unloaded LOD1 tile regions discard in the fragment shader via an explicit slot guard (`physicalSlot(lonlat, 0) < 0`) before the base sample — a tile that never loads (a failed fetch, which has no scheduler to retry it) would otherwise index `u_slots[-1]` and smear another tile's data into that region instead of discarding.

---

### ParticlesAtlasField

**File:** `src/AtlasRenderingSystem/layers/ParticlesAtlasField.ts`

Orchestrates the atlas, schedulers, and LOD controller for the ocean current particle product.

```ts
setSource(manifest, tileBaseUrl, legendRange): Promise<void>
startAnimation(): void
stopAnimation(): void
draw(): void
resize(): void
updateConfig(config: Partial<CustomizableParticleConfig>): void
updatePalette(patch: PalettePatch): void
onMapMove(bounds: LngLatBounds, zoom: number): void
destroy(): void                            // stop the rAF loop and free GPU resources
```

**Blocking LOD1 preload** — `setSource` uses `preloadAllLod1` (`Promise.all`) and blocks until every LOD1 tile is resident before resolving. This is required because the particle position-update and draw shaders call `worldToAtlasUV(lonlat, 0)` unconditionally — a missing LOD1 chunk produces an out-of-bounds `u_slots[-1]` access (undefined behaviour) rather than the graceful discard the heatmap alpha mask provides.

A `fetchGeneration` counter discards stale upload callbacks and aborts scheduler setup if superseded by a newer `setSource` call.

---

### ChunkScheduler

**File:** `src/AtlasRenderingSystem/webgl/ChunkScheduler.ts`

One instance per on-demand LOD. Manages the fetch queue for that LOD.

```ts
createChunkScheduler(
  atlas, tileBaseUrl, onChunkLoaded, region,
  lod, zoomThreshold?
): ChunkSchedulerAPI
```

`zoomThreshold` defaults to `DEFAULT_ZOOM_THRESHOLD = 6`. Pass `lodEntry.zoomThreshold` from the manifest to make it per-LOD.

| Behaviour                | Detail                                                                                                                                                                                                                                                                                                                                                                        |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Viewport priority**    | Viewport chunks at priority 0; 1-chunk buffer ring at priority 1                                                                                                                                                                                                                                                                                                              |
| **Concurrency**          | Max 6 in-flight fetches                                                                                                                                                                                                                                                                                                                                                       |
| **Zoom gate**            | Aborts all in-flight and no-ops if `zoom ≤ zoomThreshold`                                                                                                                                                                                                                                                                                                                     |
| **Cancellation**         | Chunks scrolled outside the buffer zone are aborted via `AbortController`                                                                                                                                                                                                                                                                                                     |
| **Retry**                | A transient (non-abort) fetch failure is re-fetched up to `MAX_RETRIES` (3) times with exponential backoff (500ms / 1s / 2s), so a 404/network blip self-heals instead of leaving that region at the coarser LOD. Aborts never retry; a chunk that scrolls out of scope, zooms below threshold, or is destroyed cancels its pending retry. Each fresh view resets the budget. |
| **`allVisibleLoaded()`** | `true` once every visible chunk for this LOD is resident; vacuously `true` when `visibleIds` is empty (zoom below threshold, off-region, or post-`destroy`). Exposed for diagnostics — progressive rendering no longer gates on it.                                                                                                                                           |
| **LRU refresh**          | `atlas.touch(id)` for every visible loaded chunk per `update()` call                                                                                                                                                                                                                                                                                                          |

---

### Progressive rendering

There is no crossfade controller. Each chunk is sampled the moment it is resident and finer chunks hard-replace coarser ones at full opacity (see [LOD blending](#lod-blending)). The heatmap has no continuous render loop, so `onChunkLoaded` calls `map.triggerRepaint()` to reveal each tile as it arrives; the particle layer repaints every frame via its own rAF `tick()` loop and picks up new tiles automatically.

---

## Shader Uniforms

Shader source is generated by factory functions (`makeScalarAtlasFs(totalSlots, totalVirtualChunks)`, `makeOceanCurrentAtlasFsParticle/Update(totalSlots, totalVirtualChunks, atlasW, atlasH)`) that inject `totalSlots` and `totalVirtualChunks` as GLSL compile-time constants, sizing `u_slots` and `u_chunk_slots` to match the atlas layout exactly. The shared Mercator/atlas-lookup GLSL (uniforms + `returnLonLat`/`physicalSlot`/`worldToAtlasUV`, plus the particle bilinear sampler) lives in `webgl/atlasGlsl.ts` and is concatenated into each shader.

### Shared (both shader families)

| Uniform         | Type        | Description                                                                            |
| --------------- | ----------- | -------------------------------------------------------------------------------------- |
| `u_atlas`       | `sampler2D` | The atlas texture                                                                      |
| `u_bounds`      | `vec4`      | Viewport in Mercator: `[nwX, seY, seX, nwY]`                                           |
| `u_data_bounds` | `vec4`      | Data region: `[lonMin, latMax, lonMax, latMin]`                                        |
| `u_slots`       | `vec4[N]`   | Static UV layout per physical slot. N = totalSlots (auto-computed per manifest)        |
| `u_chunk_slots` | `int[N]`    | Virtual index → physical slot (−1 = not resident). N = sum of all LOD grids            |
| `u_lod_grids`   | `vec2[4]`   | `[cols, rows]` per LOD, coarse→fine                                                    |
| `u_lod_offsets` | `int[4]`    | Cumulative virtual chunk offset per LOD                                                |
| `u_lod_count`   | `int`       | Zoom-gated active LOD count (≤ manifest LOD count). See [LOD blending](#lod-blending). |
| `u_uv_scale`    | `vec2`      | `chunkPx / storedPx` — crops local [0,1] UV to the inner data region                   |
| `u_uv_offset`   | `vec2`      | `padding / storedPx` — shifts past the padding border                                  |

### Scalar-specific (heatmapShader)

| Uniform            | Type        | Description                                                                                |
| ------------------ | ----------- | ------------------------------------------------------------------------------------------ |
| `u_value_range`    | `vec2`      | `[rawMin, rawMax]` from manifest — decodes RGB24 to physical units                         |
| `u_legend_range`   | `vec2`      | `[legendMin, legendMax]` from `PRODUCTLEGENDS` — colour ramp clamp range (continuous only) |
| `u_color_ramp`     | `sampler2D` | Continuous: 256×1 ramp (LINEAR). Categorical: N×1 ramp (NEAREST, one texel per flag)       |
| `u_num_categories` | `int`       | `0` = continuous data, `N>0` = categorical with N flag values                              |

### Uniform component budget

WebGL2 guarantees `MAX_FRAGMENT_UNIFORM_COMPONENTS ≥ 1024`. The heatmap shader consumes ~926 components (`u_slots[160]`=640 + `u_chunk_slots[256]`=256 + ~30 others). `createAtlasManager` validates this after auto-sizing and throws if the budget would be exceeded.

---

## Module Map

```
src/
  AtlasRenderingSystem/
    index.ts                — public API: createScalarAtlasLayer, createParticleAtlasLayer, types
    types.ts                — shared types (ProductManifest, AtlasLayerHandle, ColorPalette, …)
    webgl/
      AtlasManager.ts       — GPU texture + slot pool + LRU eviction
      ChunkScheduler.ts     — on-demand fetch queue per LOD
      atlasGlsl.ts          — shared GLSL (uniforms + Mercator/atlas lookup + bilinear sampler)
      heatmapShader.ts      — scalarAtlasVs + makeScalarAtlasFs() factory
      particlesShader.ts    — makeOceanCurrentAtlasFsParticle/Update() factories
    layers/
      HeatmapAtlasField.ts  — orchestrates atlas for scalar products
      HeatmapAtlasLayer.ts  — Mapbox CustomLayerInterface wrapper (scalar)
      ParticlesAtlasField.ts — orchestrates atlas for particle products
      ParticlesAtlasLayer.ts — Mapbox CustomLayerInterface wrapper (particles)
      atlasFieldShared.ts   — shared field logic (manifest parsing, LOD1 preload, scheduler wiring, zoom-gated active LOD count)
    utils/
      colorScaleUtils.ts    — colour ramp conversion (linear/log)
      getColorRamp.ts       — colour ramp builder
      rgbToHex.ts           — hex conversion helper
      throttle.ts           — leading+trailing throttle (caps the zoom event)

  hooks/layers/
    useScalarAtlasLayer.ts  — React hook: wires createScalarAtlasLayer to Zustand store
    useParticleAtlasLayer.ts — React hook: wires createParticleAtlasLayer to Zustand store

  api/
    tiles.ts                — getProductManifest (ProductManifest type re-exported from the package's types.ts)
```

---

## Known Limitations

| Issue                                                           | Status                                                               |
| --------------------------------------------------------------- | -------------------------------------------------------------------- |
| LOD4 (480 tiles) exceeds `MAX_ATLAS_SIZE` pool at any tile size | Atlas sizes to cap; LRU handles overflow — or raise `MAX_ATLAS_SIZE` |
| LOD4 pushes uniform budget past the WebGL2 minimum of 1024      | Runtime check throws before upload; works fine on desktop (4096+)    |
